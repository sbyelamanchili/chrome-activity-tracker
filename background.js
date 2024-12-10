// Initialize storage with default values
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    activities: {}
  });
});

// Website categories mapping
const websiteCategories = {
  // Social Media
  'facebook.com': { category: 'social', subcategory: 'facebook' },
  'twitter.com': { category: 'social', subcategory: 'twitter' },
  'instagram.com': { category: 'social', subcategory: 'instagram' },
  'linkedin.com': { category: 'social', subcategory: 'linkedin' },
  'reddit.com': { category: 'social', subcategory: 'reddit' },
  'whatsapp.com': { category: 'social', subcategory: 'whatsapp' },
  'telegram.org': { category: 'social', subcategory: 'telegram' },

  // Productivity
  'github.com': { category: 'productivity', subcategory: 'github' },
  'gitlab.com': { category: 'productivity', subcategory: 'gitlab' },
  'stackoverflow.com': { category: 'productivity', subcategory: 'stackoverflow' },
  'docs.google.com': { category: 'productivity', subcategory: 'google' },
  'sheets.google.com': { category: 'productivity', subcategory: 'google' },
  'drive.google.com': { category: 'productivity', subcategory: 'google' },
  'notion.so': { category: 'productivity', subcategory: 'notion' },
  'trello.com': { category: 'productivity', subcategory: 'trello' },
  'asana.com': { category: 'productivity', subcategory: 'asana' },
  'slack.com': { category: 'productivity', subcategory: 'slack' },

  // Entertainment
  'youtube.com': { category: 'entertainment', subcategory: 'youtube' },
  'netflix.com': { category: 'entertainment', subcategory: 'netflix' },
  'spotify.com': { category: 'entertainment', subcategory: 'spotify' },
  'twitch.tv': { category: 'entertainment', subcategory: 'twitch' },
  'disney.com': { category: 'entertainment', subcategory: 'disney' },
  'disneyplus.com': { category: 'entertainment', subcategory: 'disney' },
  'primevideo.com': { category: 'entertainment', subcategory: 'prime' },
  'amazon.com/Prime-Video': { category: 'entertainment', subcategory: 'prime' },
  'hulu.com': { category: 'entertainment', subcategory: 'hulu' },

  // News
  'news.google.com': { category: 'news', subcategory: 'google' },
  'reuters.com': { category: 'news', subcategory: 'reuters' },
  'bbc.com': { category: 'news', subcategory: 'bbc' },
  'bbc.co.uk': { category: 'news', subcategory: 'bbc' },
  'cnn.com': { category: 'news', subcategory: 'cnn' },
  'nytimes.com': { category: 'news', subcategory: 'nytimes' },
  'theguardian.com': { category: 'news', subcategory: 'guardian' },
  'washingtonpost.com': { category: 'news', subcategory: 'wapo' },

  // Shopping
  'amazon.com': { category: 'shopping', subcategory: 'amazon' },
  'ebay.com': { category: 'shopping', subcategory: 'ebay' },
  'walmart.com': { category: 'shopping', subcategory: 'walmart' },
  'etsy.com': { category: 'shopping', subcategory: 'etsy' },
  'aliexpress.com': { category: 'shopping', subcategory: 'aliexpress' },
  'shopify.com': { category: 'shopping', subcategory: 'shopify' },
  'bestbuy.com': { category: 'shopping', subcategory: 'bestbuy' }
};

// Function to get domain from URL
function getDomain(url) {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    return domain;
  } catch (e) {
    return '';
  }
}

// Function to get category and subcategory for a domain
function getCategoryInfo(domain) {
  const categoryInfo = websiteCategories[domain];
  if (categoryInfo) {
    return categoryInfo;
  }
  
  // For unknown domains, create a subcategory based on the domain
  const mainDomain = domain.split('.')[0];
  return {
    category: 'other',
    subcategory: mainDomain.toLowerCase()
  };
}

// Update activity count
function updateActivityCount(url) {
  const domain = getDomain(url);
  if (!domain) return;

  const { category, subcategory } = getCategoryInfo(domain);

  chrome.storage.local.get(['activities'], function(result) {
    const activities = result.activities || {};
    
    // Initialize category if it doesn't exist
    if (!activities[category]) {
      activities[category] = {};
    }
    
    // Initialize subcategory if it doesn't exist
    if (!activities[category][subcategory]) {
      activities[category][subcategory] = 0;
    }
    
    // Increment count
    activities[category][subcategory]++;
    
    // Save updated activities
    chrome.storage.local.set({ activities });
  });
}

// Listen for tab activation
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab && tab.url) {
      updateActivityCount(tab.url);
    }
  });
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    updateActivityCount(tab.url);
  }
});

// Listen for tab creation and removal to update tab count
chrome.tabs.onCreated.addListener(updateTabCount);
chrome.tabs.onRemoved.addListener(updateTabCount);

// Function to update tab count
function updateTabCount() {
  chrome.tabs.query({}, function(tabs) {
    chrome.storage.local.set({ 'openTabs': tabs.length });
  });
}

// Initial tab count
updateTabCount();

// Reset data at midnight
function checkForDailyReset() {
  const now = new Date();
  if (now.getHours() === 0 && now.getMinutes() === 0) {
    chrome.storage.local.set({ activities: {} });
  }
}

// Check for reset every minute
setInterval(checkForDailyReset, 60000);
