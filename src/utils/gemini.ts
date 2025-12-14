import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiSummarizer {
  private apiKey: string = '';
  private genAI: GoogleGenerativeAI | null = null;
  private readonly FALLBACK_API_URL = 'https://api.euron.one/api/v1/euri/chat/completions';
  private readonly FALLBACK_API_KEY = 'euri-8c5d9a501dcf34b83aeeb7d59b95ac284cceb484314e33b26b45a73790c8e605';
  
  constructor() {
    this.loadApiKey();
  }
  
  // Load API key from Chrome storage
  private async loadApiKey() {
    return new Promise<void>((resolve) => {
      chrome.storage.local.get(['gemini_api_key'], (result) => {
        this.apiKey = result.gemini_api_key || '';
        if (this.apiKey) {
          this.genAI = new GoogleGenerativeAI(this.apiKey);
        }
        resolve();
      });
    });
  }
  
  async summarize(messages: Array<{text: string, sender?: string, isUser?: boolean}>): Promise<string> {
    // Wait for API key to load
    if (!this.apiKey) {
      await this.loadApiKey();
    }
    
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured. Please add your API key in the extension settings.');
    }
    
    if (!this.genAI) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
    }
    
    if (messages.length === 0) {
      throw new Error('No messages to summarize.');
    }
    
    // Format conversation
    const conversationText = messages.map(msg => {
      const sender = msg.isUser ? 'You' : (msg.sender || 'Unknown');
      return `[${sender}]: ${msg.text}`;
    }).join('\n\n');
    
    const geminiPrompt = `Please provide a concise summary of this WhatsApp conversation:

1. **Main Topics Discussed**: List 2-4 main topics
2. **Key Decisions Made**: What was agreed upon?
3. **Action Items**: Tasks mentioned with owners if specified
4. **Important Information**: Critical details shared
5. **Open Questions**: Unanswered questions or pending items

Conversation:
${conversationText}

Summary (be concise but comprehensive):`;

    // 1. First, try Gemini API
    try {
      console.log('Attempting to summarize with Gemini API...');
      const model = this.genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash',
        generationConfig: {
          temperature: 0.3,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 1024,
        }
      });
      
      const result = await model.generateContent(geminiPrompt);
      const summary = result.response.text();
      console.log('Summary generated successfully with Gemini.');
      return summary;
      
    } catch (error: any) {
      console.warn('Gemini API failed, trying fallback...', error.message);
      
      // 2. Check if it's a quota/rate limit error to trigger fallback
      if (error.message?.includes('quota') || 
          error.message?.includes('429') || 
          error.message?.includes('RESOURCE_EXHAUSTED') ||
          error.message?.includes('rate limit')) {
        return this.tryFallbackAPI(conversationText);
      }
      
      // 3. Re-throw other errors (like invalid key)
      throw new Error(`Gemini API failed: ${error.message || 'Unknown error'}`);
    }
  }
  
  // New method for the fallback API
  private async tryFallbackAPI(conversationText: string): Promise<string> {
    const fallbackPrompt = `Summarize the following WhatsApp conversation concisely, focusing on:
- Main topics discussed
- Key decisions made
- Action items and tasks
- Important information shared
- Open questions or pending items

Format the summary with clear sections and be concise but comprehensive.

Conversation:
${conversationText}`;
    
    try {
      console.log('Calling fallback API (Euri)...');
      const response = await fetch(this.FALLBACK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.FALLBACK_API_KEY}`
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: fallbackPrompt }],
          model: "gpt-4.1-nano",
          max_tokens: 1000,
          temperature: 0.3
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Fallback API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      // Adjust based on the actual response structure
      const summary = data.choices?.[0]?.message?.content || data.text || 'No summary generated.';
      console.log('Summary generated with fallback API.');
      return summary;
      
    } catch (fallbackError: any) {
      console.error('Fallback API also failed:', fallbackError);
      throw new Error('All summarization services are currently unavailable. Please try again later.');
    }
  }
  
  // Update to use Chrome storage instead of localStorage
  async setApiKey(apiKey: string): Promise<void> {
    this.apiKey = apiKey;
    this.genAI = new GoogleGenerativeAI(apiKey);
    
    // Store in Chrome storage instead of localStorage
    return new Promise((resolve) => {
      chrome.storage.local.set({ gemini_api_key: apiKey }, () => {
        resolve();
      });
    });
  }
  
  hasApiKey(): boolean {
    return !!this.apiKey;
  }
}