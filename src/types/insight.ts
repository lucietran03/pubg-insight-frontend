export interface Insight {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  // V2 "AI coach" sections - each is empty ("" / []) rather than fabricated when Gemini's
  // response didn't include that section (see backend InsightService.parseInsight).
  playstyle: string;
  seasonProgress: string;
  riskFactors: string[];
  trainingPriorities: string[];
  source: string;
}
