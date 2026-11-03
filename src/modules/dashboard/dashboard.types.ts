export interface SearchTrendChartData {
  category: string;
  label: string;
  score: number;
  growth: number;
}

export interface DashboardSearchTrendsResponse {
  source: string;
  lastUpdated: string | Date;
  chart: SearchTrendChartData[];
  topCategory?: {
    category: string;
    score: number;
  };
  fastestGrowing?: {
    category: string;
    growth: number;
  };
  suggestedNext?: {
    title: string;
    reason: string;
  };
}

export interface TopPerformingPost {
  rank: number;
  id: string;
  title: string;
  slug: string;
  category: string;
  views: number;
  clicks: number;
  shares: number;
  growth: number;
  isTrending: boolean;
}

export interface DashboardFirstStageResponse {
  searchTrends: DashboardSearchTrendsResponse | null;
  topPosts: TopPerformingPost[];
}
