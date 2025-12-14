import { GeminiSummarizer } from '../utils/gemini';

let summarizer: GeminiSummarizer | null = null;

// Initialize summarizer
chrome.runtime.onInstalled.addListener(() => {
  console.log('WhatsApp Summarizer extension installed');
  summarizer = new GeminiSummarizer();
  
  // Set up default storage
  chrome.storage.local.get(['gemini_api_key'], (result) => {
    if (result.gemini_api_key) {
      summarizer?.setApiKey(result.gemini_api_key);
    }
  });
});

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received:', request.action);
  
  switch (request.action) {
    case 'SUMMARIZE_CHAT':
      handleSummarize(request.data, sendResponse);
      return true; // Async response
    
    case 'SET_API_KEY':
      if (!summarizer) {
        summarizer = new GeminiSummarizer();
      }
      summarizer.setApiKey(request.apiKey);
      sendResponse({ success: true });
      break;
    
    case 'CHECK_API_KEY':
      const hasKey = summarizer?.hasApiKey() || false;
      sendResponse({ hasKey });
      break;
    
    case 'OPEN_SUMMARIZER':
      // Open the extension popup programmatically
      chrome.action.openPopup();
      sendResponse({ success: true });
      break;
  }
  
  return false; // Sync response handled
});

async function handleSummarize(data: any, sendResponse: (response: any) => void) {
  try {
    const { messages, options } = data;
    
    if (!summarizer) {
      summarizer = new GeminiSummarizer();
    }
    
    // Check if we have API key
    if (!summarizer.hasApiKey()) {
      sendResponse({
        success: false,
        error: 'Please set your Gemini API key in the extension settings.'
      });
      return;
    }
    
    // Generate summary
    const summary = await summarizer.summarize(messages);
    
    // Save to storage for history
    const summaryData = {
      summary,
      timestamp: new Date().toISOString(),
      messageCount: messages.length
    };
    
    chrome.storage.local.get(['summaryHistory'], (result) => {
      const history = result.summaryHistory || [];
      history.unshift(summaryData); // Add to beginning
      
      // Keep only last 50 summaries
      if (history.length > 50) {
        history.pop();
      }
      
      chrome.storage.local.set({ summaryHistory: history });
    });
    
    sendResponse({
      success: true,
      summary,
      messageCount: messages.length
    });
    
  } catch (error: any) {
    console.error('Summarization error:', error);
    sendResponse({
      success: false,
      error: error.message || 'Failed to generate summary'
    });
  }
}

// Handle extension button click
chrome.action.onClicked.addListener((tab) => {
  // This fires when the extension icon is clicked
  console.log('Extension icon clicked');
});

// Handle installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Open options page on first install
    chrome.runtime.openOptionsPage();
  }
});