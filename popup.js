document.addEventListener('DOMContentLoaded', function() {
  const statsContainer = document.getElementById('activityStats');
  const noDataMessage = document.getElementById('noDataMessage');
  const tabCounter = document.getElementById('tabCounter');

  // Emoji constants using HTML entities
  const HAPPY_EMOJI = '&#128525;'; // 😍
  const GRUMPY_EMOJI = '&#128545;'; // 😡

  // Update tab counter
  function updateTabCounter() {
    chrome.storage.local.get(['openTabs'], function(result) {
      const tabCount = result.openTabs || 0;
      const emoji = tabCount >= 10 ? GRUMPY_EMOJI : HAPPY_EMOJI;
      const className = tabCount >= 10 ? 'many-tabs' : 'few-tabs';
      const message = tabCount >= 10 ? 
        `Whoa! ${tabCount} tabs open` : 
        `Nice! ${tabCount} tabs open`;
      
      tabCounter.className = `tab-counter ${className}`;
      tabCounter.innerHTML = `
        <span class="count-text">${message}</span>
        <span class="emoji">${emoji}</span>
      `;
    });
  }

  // Initial tab counter update
  updateTabCounter();

  // Function to generate a random color with good contrast
  function generateColor(seed) {
    // Use the seed to generate a hue value between 0 and 360
    const hue = Math.abs(hashCode(seed) % 360);
    // Use higher lightness (70-85%) and lower saturation (60-75%) for lighter, pastel colors
    const saturation = 65 + (Math.abs(hashCode(seed + 'sat') % 10));
    const lightness = 70 + (Math.abs(hashCode(seed + 'light') % 15));
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  // Simple string hash function
  function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }

  // Category display names
  const categoryNames = {
    social: 'Social Media',
    productivity: 'Productivity',
    entertainment: 'Entertainment',
    news: 'News',
    shopping: 'Shopping',
    other: 'Other'
  };

  // Get the stored activities
  chrome.storage.local.get(['activities'], function(result) {
    const activities = result.activities || {};
    
    // Calculate total visits across all categories
    let totalVisits = 0;
    Object.values(activities).forEach(category => {
      Object.values(category).forEach(count => {
        totalVisits += count;
      });
    });

    // If no data, show the message
    if (totalVisits === 0) {
      statsContainer.style.display = 'none';
      noDataMessage.style.display = 'block';
      return;
    }

    // Hide the message and show the stats
    noDataMessage.style.display = 'none';
    statsContainer.style.display = 'block';

    // Sort categories by total usage
    const sortedCategories = Object.entries(activities)
      .map(([category, subcategories]) => {
        const total = Object.values(subcategories).reduce((sum, count) => sum + count, 0);
        return { category, subcategories, total };
      })
      .sort((a, b) => b.total - a.total);

    // Create sections for each category
    sortedCategories.forEach(({ category, subcategories, total }) => {
      // Create category section
      const section = document.createElement('div');
      section.className = 'category-section';

      // Add category header with total
      const header = document.createElement('div');
      header.className = 'category-header';
      
      const categoryName = document.createElement('span');
      categoryName.className = 'category-name';
      categoryName.textContent = categoryNames[category] || category;
      
      const categoryTotal = document.createElement('span');
      categoryTotal.className = 'category-total';
      const categoryPercentage = ((total / totalVisits) * 100).toFixed(1);
      categoryTotal.textContent = `${categoryPercentage}% (${total} visits)`;
      
      header.appendChild(categoryName);
      header.appendChild(categoryTotal);
      section.appendChild(header);

      // Create the bar container
      const bar = document.createElement('div');
      bar.className = 'activity-bar';

      // Sort subcategories by usage
      const sortedSubcategories = Object.entries(subcategories)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      // Add segments for each subcategory
      sortedSubcategories.forEach(({ name, count }) => {
        const percentage = (count / totalVisits) * 100;
        
        // Create segment
        const segment = document.createElement('div');
        segment.className = `subcategory-segment`;
        
        // If it's the "other" category, generate a color dynamically
        if (category === 'other') {
          const color = generateColor(name);
          segment.style.backgroundColor = color;
        } else {
          segment.classList.add(`${category}-${name}`);
        }
        
        segment.style.width = percentage + '%';
        
        // Create tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = `${name}: ${percentage.toFixed(1)}% (${count} visits)`;
        
        segment.appendChild(tooltip);
        bar.appendChild(segment);
      });

      section.appendChild(bar);
      statsContainer.appendChild(section);
    });
  });
});
