export interface GoogleSearchConsoleData {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  keys?: string[];
}

export interface GoogleAnalyticsData {
  sessions: number;
  users: number;
  views: number;
  engagementRate?: number;
  date?: string;
  hour?: number;
}
