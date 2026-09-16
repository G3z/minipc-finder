export type Scores = Record<'overall' | 'brand' | 'socket' | 'gen' | 'gpu' | 'volume' | 'ram' | 'drive' | 'port' | 'lan' | 'seller', number | null>;

export type Device = {
  id: string;
  model: string;
  brand: string;
  clonedFrom: string | null;
  scores: Scores;
  cpu: { name: string | null; class: string | null; gen: string | null; socket: string | null; pCores: number | null; threads: number | null; tdpW: number | null };
  gpu: { name: string | null; discrete: boolean | null; integrated: boolean | null };
  memory: { slots: number | null; maxGb: number | null; maxSpeedMts: number | null; ecc: boolean | null };
  storage: Record<'maxDrives' | 'maxNvme' | 'nvmeGen5' | 'nvmeGen4' | 'nvmeGen3' | 'm2Sata' | 'sdCard' | 'sata25' | 'sata35', number | null>;
  ports: Record<'pcieX16' | 'pcieX8' | 'pcieX4' | 'pcieX1' | 'oculink' | 'tb5' | 'usb4' | 'pdInMinW' | 'pdVideoMinW' | 'pdVideoDataMinW' | 'hdmi21' | 'displays', number | null>;
  network: { ethModel: string | null; ports: Record<'g10' | 'g5' | 'g2_5' | 'g1', number | null>; maxEth: number | null; wifi6e: boolean | null; wifi6: boolean | null; wirelessSoc: string | null };
  power: Record<'idleW' | 'loadW' | 'peakW' | 'tdpW' | 'psuW' | 'batteryWh', number | null> & { psuType: string | null; vPro: boolean | null };
  physical: Record<'d1' | 'd2' | 'd3' | 'volumeL' | 'fan1Mm' | 'fan2Mm', number | null>;
  support: { warrantyYrs: number | null; durabilityYrs: number | null };
  pricing: { barebone: number | null; variants: { config: string; usd: number }[]; history: { date: string; fromUsd: number; toUsd: number }[] };
  seller: { name: string | null; url: string | null };
  releaseDate: string | null;
  notes: string | null;
  discontinued: boolean;
  source: { sheet: string; row: number };
};

export type CatalogDevice = Pick<Device, 'id' | 'model' | 'brand' | 'scores' | 'cpu' | 'gpu' | 'memory' | 'storage' | 'ports' | 'network' | 'power' | 'physical' | 'support' | 'releaseDate' | 'discontinued'> & {
  pricing: Pick<Device['pricing'], 'barebone' | 'variants'>;
  minPrice: number | null;
};

export type Facets = {
  values: Record<string, { value: string | boolean; count: number }[]>;
  ranges: Record<string, { min: number; max: number }>;
};
