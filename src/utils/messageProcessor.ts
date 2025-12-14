import { ChatMessage, SummaryOptions } from './types';

export function extractMessages(options: SummaryOptions = {}): ChatMessage[] {
  console.log('Extracting messages with options:', options);
  
  // UPDATED SELECTOR: Use the selector that actually works
  const messageContainers = document.querySelectorAll('div[class*="message-"]');
  console.log(`Found ${messageContainers.length} message containers`);
  
  const messages: ChatMessage[] = [];
  const currentUser = getCurrentUser();
  
  messageContainers.forEach((container, index) => {
    try {
      // Try multiple selectors for message text
      const textElement = container.querySelector('.selectable-text.copyable-text') ||
                         container.querySelector('span[class*="selectable-text"]') ||
                         container.querySelector('div[class*="copyable-text"]') ||
                         container.querySelector('[dir="auto"]');
      
      const messageText = textElement?.textContent?.trim();
      if (!messageText || messageText.length === 0) return;
      
      // Extract timestamp - try multiple selectors
      const timeElement = container.querySelector('div[data-testid="msg-meta"]') ||
                         container.querySelector('span[class*="x1fj9vlw"]') ||
                         container.querySelector('[aria-label*=":"]');
      const timestamp = timeElement?.textContent?.trim();
      
      // Extract sender name
      const senderName = extractSenderName(container) || currentUser;
      
      // Determine if message is from current user
      const isUser = container.classList.contains('message-out') || 
                     container.querySelector('.message-out') !== null ||
                     senderName === currentUser ||
                     container.querySelector('div[data-testid*="out"]') !== null;
      
      messages.push({
        text: messageText,
        timestamp: timestamp || undefined,
        sender: senderName,
        isUser
      });
      
    } catch (error) {
      console.error(`Error processing message ${index}:`, error);
    }
  });
  
  // Apply filters
  const filteredMessages = applyFilters(messages, options);
  console.log(`Filtered to ${filteredMessages.length} messages`);
  
  return filteredMessages;
}

function getCurrentUser(): string {
  const profileElement = document.querySelector('header[data-testid="conversation-header"] span[dir="auto"]') ||
                        document.querySelector('header div[role="heading"] span') ||
                        document.querySelector('#side header img[alt*="profile"]');
  return profileElement?.textContent?.trim() || "You";
}

function extractSenderName(container: Element): string | null {
  // Multiple ways to find sender
  const senderElement = container.querySelector('span[dir="auto"]') ||
                       container.querySelector('div[class*="_ahxj"] span') ||
                       container.querySelector('div[data-testid*="sender"]');
  return senderElement?.textContent?.trim() || null;
}

function applyFilters(messages: ChatMessage[], options: SummaryOptions): ChatMessage[] {
  let filtered = [...messages];
  
  // Filter by count
  if (options.lastNMessages && options.lastNMessages > 0) {
    filtered = filtered.slice(-options.lastNMessages);
  }
  
  // Filter by time range
  if (options.timeRange && messages.length > 0) {
    const now = Date.now();
    let timeLimit = now;
    
    switch (options.timeRange) {
      case 'lastHour':
        timeLimit = now - 60 * 60 * 1000;
        break;
      case 'lastDay':
        timeLimit = now - 24 * 60 * 60 * 1000;
        break;
      case 'lastWeek':
        timeLimit = now - 7 * 24 * 60 * 60 * 1000;
        break;
    }
    
    filtered = filtered.filter(msg => {
      if (!msg.timestamp) return true;
      try {
        const msgTime = parseWhatsAppTimestamp(msg.timestamp);
        return msgTime >= timeLimit;
      } catch (e) {
        return true;
      }
    });
  }
  
  return filtered;
}

function parseWhatsAppTimestamp(timestamp: string): number {
  const now = new Date();
  const timeMatch = timestamp.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const period = timeMatch[3];
    
    if (period) {
      if (period.toUpperCase() === 'PM' && hours < 12) hours += 12;
      if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
    } else if (hours < 12) {
      hours += 12;
    }
    
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
    return date.getTime();
  }
  
  return Date.now();
}