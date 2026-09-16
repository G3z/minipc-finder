import { mkdir, rm, writeFile } from 'node:fs/promises';
import MiniSearch from 'minisearch';
import type { CatalogDevice, Device, Facets } from '../src/lib/device';
import { fetchSheet } from './fetch';
import { parseSheet } from './parse';
import { source } from './source';

const json = (value: unknown) => JSON.stringify(value, null, 2) + '\n';
const discrete = ['brand', 'cpu.class', 'cpu.gen', 'cpu.socket', 'cpu.name', 'gpu.name', 'gpu.discrete', 'gpu.integrated', 'memory.ecc', 'network.ethModel', 'network.wifi6e', 'network.wifi6', 'network.wirelessSoc', 'power.psuType', 'power.vPro'] as const;
const numeric = ['scores.overall', 'memory.slots', 'memory.maxGb', 'memory.maxSpeedMts', 'storage.maxDrives', 'storage.maxNvme', 'storage.nvmeGen5', 'storage.nvmeGen4', 'storage.nvmeGen3', 'storage.m2Sata', 'storage.sdCard', 'storage.sata25', 'storage.sata35', 'ports.pcieX16', 'ports.pcieX8', 'ports.pcieX4', 'ports.pcieX1', 'ports.oculink', 'ports.tb5', 'ports.usb4', 'ports.pdInMinW', 'ports.pdVideoMinW', 'ports.pdVideoDataMinW', 'ports.hdmi21', 'ports.displays', 'network.maxEth', 'network.ports.g10', 'network.ports.g5', 'network.ports.g2_5', 'network.ports.g1', 'power.idleW', 'power.loadW', 'power.peakW', 'power.tdpW', 'power.psuW', 'power.batteryWh', 'physical.d1', 'physical.d2', 'physical.d3', 'physical.volumeL', 'physical.fan1Mm', 'physical.fan2Mm', 'support.warrantyYrs', 'support.durabilityYrs', 'minPrice'] as const;
const at = (value: object, path: string): unknown => path.split('.').reduce<unknown>((current, key) => current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : null, value);
export const toCatalog = (devices: Device[]): CatalogDevice[] => devices.map(({ id, model, brand, scores, cpu, gpu, memory, storage, ports, network, power, physical, support, pricing, releaseDate, discontinued }) => ({ id, model, brand, scores, cpu, gpu, memory, storage, ports, network, power, physical, support, pricing: { barebone: pricing.barebone, variants: pricing.variants }, minPrice: [pricing.barebone, ...pricing.variants.map(variant => variant.usd)].filter((price): price is number => price !== null && price > 0).sort((a, b) => a - b)[0] ?? null, releaseDate, discontinued }));
export const buildFacets = (catalog: CatalogDevice[]): Facets => ({
  values: Object.fromEntries(discrete.map(path => [path, [...catalog.reduce((counts, device) => { const value = at(device, path); if (value !== null) counts.set(value as string | boolean, (counts.get(value as string | boolean) ?? 0) + 1); return counts; }, new Map<string | boolean, number>()).entries()].sort(([a], [b]) => String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0).map(([value, count]) => ({ value, count }))])),
  ranges: Object.fromEntries(numeric.flatMap(path => { const values = catalog.map(device => at(device, path)).filter((value): value is number => typeof value === 'number'); return values.length ? [[path, { min: Math.min(...values), max: Math.max(...values) }]] : []; })),
});
export const buildData = async () => {
  const devices = parseSheet(await fetchSheet());
  await rm('src/data/devices', { recursive: true, force: true }); await mkdir('src/data/devices', { recursive: true });
  for (const device of devices) await writeFile(`src/data/devices/${device.id}.json`, json(device));
  const catalog = toCatalog(devices);
  const search = new MiniSearch({ fields: ['model', 'brand', 'cpu', 'gpu'], storeFields: ['id'] }); search.addAll(catalog.map(d => ({ id: d.id, model: d.model, brand: d.brand, cpu: d.cpu.name ?? '', gpu: d.gpu.name ?? '' })));
  await Promise.all([writeFile('src/data/catalog.json', json(catalog)), writeFile('src/data/facets.json', json(buildFacets(catalog))), writeFile('src/data/search-index.json', json(search.toJSON())), writeFile('src/data/meta.json', json({ generatedAt: new Date().toISOString(), sourceSheet: source, rowCount: devices.length, warnings: [] }))]);
};
if (process.argv[1]?.endsWith('build-data.ts')) await buildData();
