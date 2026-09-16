import { z } from 'zod';

const nullableNumber = z.number().nullable();
const nullableString = z.string().nullable();
const nullableBoolean = z.boolean().nullable();

export const deviceSchema = z.object({
  id: z.string(), model: z.string(), brand: z.string(), clonedFrom: nullableString,
  scores: z.record(nullableNumber),
  cpu: z.object({ name: nullableString, class: nullableString, gen: nullableString, socket: nullableString, pCores: nullableNumber, threads: nullableNumber, tdpW: nullableNumber }),
  gpu: z.object({ name: nullableString, discrete: nullableBoolean, integrated: nullableBoolean }),
  memory: z.object({ slots: nullableNumber, maxGb: nullableNumber, maxSpeedMts: nullableNumber, ecc: nullableBoolean }),
  storage: z.record(nullableNumber), ports: z.record(nullableNumber),
  network: z.object({ ethModel: nullableString, ports: z.record(nullableNumber), maxEth: nullableNumber, wifi6e: nullableBoolean, wifi6: nullableBoolean, wirelessSoc: nullableString }),
  power: z.object({ idleW: nullableNumber, loadW: nullableNumber, peakW: nullableNumber, tdpW: nullableNumber, psuW: nullableNumber, batteryWh: nullableNumber, psuType: nullableString, vPro: nullableBoolean }),
  physical: z.record(nullableNumber), support: z.object({ warrantyYrs: nullableNumber, durabilityYrs: nullableNumber }),
  pricing: z.object({ barebone: nullableNumber, variants: z.array(z.object({ config: z.string(), usd: z.number() })), history: z.array(z.object({ date: z.string(), fromUsd: z.number(), toUsd: z.number() })) }),
  seller: z.object({ name: nullableString, url: nullableString }), releaseDate: nullableString, notes: nullableString, discontinued: z.boolean(),
  source: z.object({ sheet: z.string(), row: z.number() }),
});
