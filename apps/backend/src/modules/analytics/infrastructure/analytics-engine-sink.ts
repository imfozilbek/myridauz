import type { AnalyticsSink } from '../application/analytics-sink';

export const analyticsEngineSink = (dataset: AnalyticsEngineDataset): AnalyticsSink => ({
  write: (point) => dataset.writeDataPoint(point),
});
