export interface ChatMessage {
  text: string;
  timestamp?: string;
  sender?: string;
  isUser: boolean;
}

export interface SummaryOptions {
  lastNMessages?: number;
  timeRange?: 'lastHour' | 'lastDay' | 'lastWeek';
  customRange?: { start: Date; end: Date };
}

export interface SummaryResponse {
  success: boolean;
  summary?: string;
  error?: string;
  messageCount?: number;
}