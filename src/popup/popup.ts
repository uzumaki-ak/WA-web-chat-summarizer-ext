import { SummaryOptions } from '../utils/types';

class WhatsAppSummarizerPopup {
  private currentChat: string = '';
  private currentOptions: SummaryOptions = { lastNMessages: 50, timeRange: 'lastHour' };
  private lastSummary: string = '';
  private isApiKeySaved: boolean = false;

  constructor() {
    this.initializeElements();
    this.setupEventListeners();
    this.checkAPIKey();
    this.updateChatInfo();
    this.initializeTimeRange();
  }

  private initializeElements() {
    // Initialize range slider with better UX
    const countSlider = document.getElementById('message-count') as HTMLInputElement;
    const countDisplay = document.getElementById('count-display') as HTMLSpanElement;
    
    if (countSlider && countDisplay) {
      countSlider.addEventListener('input', () => {
        const value = parseInt(countSlider.value);
        countDisplay.textContent = value.toString();
        this.currentOptions.lastNMessages = value;
      });
    }
  }

  private initializeTimeRange() {
    // Set first button as active
    const firstButton = document.querySelector('.time-range-btn');
    if (firstButton) {
      firstButton.classList.add('active');
      firstButton.classList.remove('bg-gray-700', 'hover:bg-gray-600');
    }
  }

  private setupEventListeners() {
    // Settings button
    document.getElementById('settings-btn')?.addEventListener('click', () => {
      this.toggleSettingsPanel();
    });

    document.getElementById('close-settings')?.addEventListener('click', () => {
      this.toggleSettingsPanel(false);
    });

    // API key setup
    document.getElementById('setup-api-btn')?.addEventListener('click', () => {
      this.toggleSettingsPanel(true);
    });

    // API key input changes
    const apiKeyInput = document.getElementById('api-key-input') as HTMLInputElement;
    apiKeyInput?.addEventListener('input', () => {
      this.resetApiKeyButton();
    });

    document.getElementById('save-api-key')?.addEventListener('click', () => {
      this.saveApiKey();
    });

    // Time range buttons - FIXED SELECTION
    document.querySelectorAll('.time-range-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const range = target.dataset.range;
        
        // Update active state
        document.querySelectorAll('.time-range-btn').forEach(b => {
          b.classList.remove('active', 'bg-blue-600', 'text-white');
          b.classList.add('bg-gray-700', 'hover:bg-gray-600', 'text-gray-300');
        });
        
        target.classList.add('active', 'bg-blue-600', 'text-white');
        target.classList.remove('bg-gray-700', 'hover:bg-gray-600', 'text-gray-300');
        
        // Update options
        if (range === 'all') {
          delete this.currentOptions.timeRange;
        } else if (range) {
          this.currentOptions.timeRange = range as any;
        }
        
        console.log('Time range selected:', range);
      });
    });

    // Summarize button
    (document.getElementById('summarize-btn') as HTMLButtonElement)?.addEventListener('click', () => {
      this.generateSummary();
    });

    // Copy summary button
    document.getElementById('copy-summary')?.addEventListener('click', () => {
      this.copySummary();
    });

    // Refresh summary button
    document.getElementById('refresh-summary')?.addEventListener('click', () => {
      this.generateSummary();
    });
  }

private async checkAPIKey() {
  try {
    // Use Chrome storage API directly
    chrome.storage.local.get(['gemini_api_key'], (result) => {
      const hasKey = !!result.gemini_api_key;
      const apiWarning = document.getElementById('api-warning');
      
      if (apiWarning) {
        apiWarning.classList.toggle('hidden', hasKey);
      }
      
      this.isApiKeySaved = hasKey;
    });
  } catch (error) {
    console.error('Error checking API key:', error);
  }
}

  private async updateChatInfo() {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tabs[0]?.url?.includes('web.whatsapp.com')) {
        const response = await chrome.tabs.sendMessage(tabs[0].id!, { 
          action: 'EXTRACT_MESSAGES',
          options: { lastNMessages: 1 }
        });
        
        if (response.success && response.messages.length > 0) {
          const chatInfo = document.getElementById('chat-info');
          const chatName = document.getElementById('chat-name');
          const countBadge = document.getElementById('message-count-badge');
          
          if (chatInfo && chatName && countBadge) {
            chatInfo.classList.remove('hidden');
            this.currentChat = response.chatTitle || 'Unknown Chat';
            chatName.textContent = this.currentChat;
            countBadge.textContent = `${response.messages.length} message(s) available`;
          }
        }
      }
    } catch (error) {
      console.log('WhatsApp Web not ready:', error);
    }
  }

  private async generateSummary() {
    const summarizeBtn = document.getElementById('summarize-btn') as HTMLButtonElement;
    const summarizeText = document.getElementById('summarize-text');
    const loadingSpinner = document.getElementById('loading-spinner');
    const resultContainer = document.getElementById('result-container');
    const errorContainer = document.getElementById('error-container');
    
    if (!summarizeBtn) return;
    
    // Check API key
    if (!this.isApiKeySaved) {
      this.showError('Please set your Gemini API key first');
      this.toggleSettingsPanel(true);
      return;
    }
    
    // Show loading state
    summarizeBtn.disabled = true;
    if (summarizeText) summarizeText.textContent = 'Summarizing...';
    if (loadingSpinner) loadingSpinner.classList.remove('hidden');
    
    // Hide previous results/errors
    if (resultContainer) resultContainer.classList.add('hidden');
    if (errorContainer) errorContainer.classList.add('hidden');
    
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tabs[0]?.url?.includes('web.whatsapp.com')) {
        throw new Error('Please open WhatsApp Web first');
      }
      
      console.log('Requesting messages with options:', this.currentOptions);
      const extraction = await chrome.tabs.sendMessage(tabs[0].id!, {
        action: 'EXTRACT_MESSAGES',
        options: this.currentOptions
      });
      
      if (!extraction.success) {
        throw new Error(extraction.error || 'Failed to extract messages');
      }
      
      if (extraction.messages.length === 0) {
        throw new Error('No messages found. Please try a different time range or scroll to load more messages.');
      }
      
      console.log(`Extracted ${extraction.messages.length} messages`);
      
      const summaryResponse = await chrome.runtime.sendMessage({
        action: 'SUMMARIZE_CHAT',
        data: {
          messages: extraction.messages,
          options: this.currentOptions
        }
      });
      
      if (!summaryResponse.success) {
        throw new Error(summaryResponse.error || 'Failed to generate summary');
      }
      
      this.displaySummary(summaryResponse.summary, extraction.messages.length);
      
    } catch (error: any) {
      this.showError(error.message || 'Failed to generate summary');
      console.error('Summary error:', error);
    } finally {
      summarizeBtn.disabled = false;
      if (summarizeText) summarizeText.textContent = '📝 Summarize Current Chat';
      if (loadingSpinner) loadingSpinner.classList.add('hidden');
    }
  }

  private displaySummary(summary: string, messageCount: number) {
    const resultContainer = document.getElementById('result-container');
    const summaryContent = document.getElementById('summary-content');
    const summaryTime = document.getElementById('summary-time');
    const summaryLength = document.getElementById('summary-length');
    
    if (!resultContainer || !summaryContent || !summaryTime || !summaryLength) return;
    
    const formattedSummary = summary
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-blue-300 font-semibold">$1</strong>')
      .replace(/\n/g, '<br>')
      .replace(/^(\d+\.|\*)\s+(.*?)(?=\n|$)/gm, '<li class="ml-4 mb-1">$2</li>')
      .replace(/^##\s+(.*?)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2 text-blue-300">$1</h3>')
      .replace(/^#\s+(.*?)$/gm, '<h2 class="text-xl font-bold mt-4 mb-3 text-purple-300 border-b border-gray-700 pb-2">$1</h2>');
    
    summaryContent.innerHTML = formattedSummary;
    this.lastSummary = summary;
    
    const now = new Date();
    summaryTime.textContent = `Summarized at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    summaryLength.textContent = `${messageCount} messages`;
    
    resultContainer.classList.remove('hidden');
    resultContainer.classList.add('fade-in');
  }

  private async copySummary() {
    if (!this.lastSummary) return;
    
    try {
      await navigator.clipboard.writeText(this.lastSummary);
      
      const copyBtn = document.getElementById('copy-summary');
      if (copyBtn) {
        const original = copyBtn.innerHTML;
        copyBtn.innerHTML = '✓';
        copyBtn.classList.add('text-green-400');
        
        setTimeout(() => {
          copyBtn.innerHTML = original;
          copyBtn.classList.remove('text-green-400');
        }, 2000);
      }
    } catch (error) {
      this.showError('Failed to copy summary');
    }
  }

  private async saveApiKey() {
    const apiKeyInput = document.getElementById('api-key-input') as HTMLInputElement;
    const saveButton = document.getElementById('save-api-key') as HTMLButtonElement;
    
    if (!apiKeyInput || !apiKeyInput.value.trim()) {
      this.showError('Please enter an API key');
      return;
    }
    
    try {
      // Show saving state
      saveButton.disabled = true;
      const originalText = saveButton.textContent;
      saveButton.textContent = 'Saving...';
      
      await chrome.runtime.sendMessage({
        action: 'SET_API_KEY',
        apiKey: apiKeyInput.value.trim()
      });
      
      // Update UI
      saveButton.textContent = 'Saved ✓';
      saveButton.classList.remove('bg-blue-600', 'hover:bg-blue-700');
      saveButton.classList.add('bg-green-600');
      saveButton.disabled = false;
      
      this.isApiKeySaved = true;
      
      // Hide settings and API warning
      this.toggleSettingsPanel(false);
      document.getElementById('api-warning')?.classList.add('hidden');
      
      // Update input placeholder
      apiKeyInput.placeholder = "API key is saved ✓";
      apiKeyInput.type = "password";
      apiKeyInput.value = "••••••••••••••••";
      apiKeyInput.disabled = true;
      
      // Show success message
      this.showNotification('API key saved successfully!', 'success');
      
      // Re-enable input after 3 seconds if user wants to change
      setTimeout(() => {
        apiKeyInput.disabled = false;
        apiKeyInput.value = '';
        apiKeyInput.type = "text";
        apiKeyInput.placeholder = "Enter new API key";
        saveButton.textContent = 'Save';
        saveButton.classList.remove('bg-green-600');
        saveButton.classList.add('bg-blue-600', 'hover:bg-blue-700');
      }, 3000);
      
    } catch (error) {
      saveButton.textContent = 'Save';
      saveButton.disabled = false;
      this.showError('Failed to save API key');
    }
  }

  private resetApiKeyButton() {
    const saveButton = document.getElementById('save-api-key') as HTMLButtonElement;
    if (saveButton) {
      saveButton.textContent = 'Save';
      saveButton.classList.remove('bg-green-600');
      saveButton.classList.add('bg-blue-600', 'hover:bg-blue-700');
    }
  }

  private showNotification(message: string, type: 'success' | 'error' | 'info' = 'info') {
    // Send notification to content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url?.includes('web.whatsapp.com')) {
        chrome.tabs.sendMessage(tabs[0].id!, {
          action: 'SHOW_NOTIFICATION',
          message: message,
          type: type
        });
      }
    });
  }

  private toggleSettingsPanel(show?: boolean) {
    const settingsPanel = document.getElementById('settings-panel');
    if (!settingsPanel) return;
    
    if (show === undefined) {
      settingsPanel.classList.toggle('hidden');
    } else {
      settingsPanel.classList.toggle('hidden', !show);
    }
  }

  private showError(message: string) {
    const errorContainer = document.getElementById('error-container');
    const errorMessage = document.getElementById('error-message');
    
    if (errorContainer && errorMessage) {
      errorMessage.textContent = message;
      errorContainer.classList.remove('hidden');
      errorContainer.classList.add('fade-in');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new WhatsAppSummarizerPopup();
});