import { extractMessages } from '../utils/messageProcessor';
import { SummaryOptions } from '../utils/types';

// Create floating button UI
function createFloatingUI() {
  // Remove any existing floating button
  const existingButton = document.getElementById('whatsapp-summarizer-floating');
  if (existingButton) existingButton.remove();

  const floatingButton = document.createElement('div');
  floatingButton.id = 'whatsapp-summarizer-floating';
  floatingButton.innerHTML = `
    <style>
      #whatsapp-summarizer-floating {
        position: fixed;
        bottom: 120px;
        right: 30px;
        z-index: 999999;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 50px;
        padding: 14px 28px;
        cursor: pointer;
        box-shadow: 0 6px 25px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 600;
        font-size: 16px;
        transition: all 0.3s ease;
        user-select: none;
        border: 2px solid rgba(255,255,255,0.2);
      }
      #whatsapp-summarizer-floating:hover {
        transform: translateY(-3px);
        box-shadow: 0 10px 30px rgba(0,0,0,0.4);
      }
      #whatsapp-summarizer-floating:active {
        transform: translateY(1px);
      }
      .summarizer-icon {
        width: 24px;
        height: 24px;
        background: white;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: #667eea;
        font-size: 14px;
      }
      #summarizer-notification {
        position: fixed;
        top: 30px;
        right: 30px;
        background: #10B981;
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        z-index: 1000000;
        box-shadow: 0 6px 25px rgba(0,0,0,0.3);
        display: none;
        align-items: center;
        gap: 12px;
        animation: slideIn 0.3s ease;
        font-weight: 500;
        max-width: 350px;
      }
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    </style>
    <div class="summarizer-icon">AI</div>
    <span>Summarize Chat</span>
  `;
  
  floatingButton.addEventListener('click', () => {
    showNotification('Opening summarizer...', 'info');
    chrome.runtime.sendMessage({ action: 'OPEN_SUMMARIZER' });
  });
  
  document.body.appendChild(floatingButton);
  
  // Create notification element
  const notification = document.createElement('div');
  notification.id = 'summarizer-notification';
  document.body.appendChild(notification);
  
  return floatingButton;
}

function showNotification(message: string, type: 'success' | 'error' | 'info' = 'info') {
  const notification = document.getElementById('summarizer-notification');
  if (!notification) return;
  
  notification.textContent = message;
  notification.style.background = type === 'success' ? '#10B981' : 
                                 type === 'error' ? '#EF4444' : 
                                 '#3B82F6';
  notification.style.display = 'flex';
  
  setTimeout(() => {
    notification.style.display = 'none';
  }, 3000);
}

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);
  
  if (request.action === 'EXTRACT_MESSAGES') {
    try {
      const messages = extractMessages(request.options);
      sendResponse({ 
        success: true, 
        messages,
        chatTitle: getChatTitle()
      });
    } catch (error: any) {
      sendResponse({ 
        success: false, 
        error: error.message 
      });
    }
    return true;
  }
  
  if (request.action === 'SHOW_NOTIFICATION') {
    showNotification(request.message, request.type);
    sendResponse({ success: true });
  }
  
  return false;
});

function getChatTitle(): string {
  const titleElement = document.querySelector('header[data-testid="conversation-header"] span[dir="auto"]') ||
                       document.querySelector('header div[role="heading"] span') ||
                       document.querySelector('#main header div[title]');
  return titleElement?.textContent?.trim() || 'Unknown Chat';
}

// Enhanced initialization
function initialize() {
  console.log('WhatsApp Web Summarizer content script loaded');
  
  const observer = new MutationObserver((mutations) => {
    const chatLoaded = document.querySelector('div[class*="message-"]') !== null;
    if (chatLoaded) {
      observer.disconnect();
      setTimeout(() => {
        createFloatingUI();
        console.log('Floating UI created');
      }, 1500);
    }
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Fallback timeout
  setTimeout(() => {
    const chatLoaded = document.querySelector('div[class*="message-"]') !== null;
    if (chatLoaded) {
      createFloatingUI();
    }
  }, 5000);
}

// Start the extension
initialize();