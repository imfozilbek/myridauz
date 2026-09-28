// Cloudflare bindings of the Worker. Optional ones are absent when running locally.
export type Bindings = {
  readonly ANALYTICS?: AnalyticsEngineDataset;
};

export type AppEnv = { Bindings: Bindings };
