import { mkdir, rm, writeFile } from 'node:fs/promises';
import MiniSearch from 'minisearch';
import { fetchSheet } from './fetch';
import { parseSheet } from './parse';
import { source } from './source';

const json = (value: unknown) => JSON.stringify(value, null, 2) + '\n';
const devices = parseSheet(await fetchSheet());
await rm('src/data/devices', { recursive: true, force: true }); await mkdir('src/data/devices', { recursive: true });
for (const device of devices) await writeFile(`src/data/devices/${device.id}.json`, json(device));
const catalog = devices.map(({ id, model, brand, cpu, gpu, scores, physical, pricing, ports, releaseDate, discontinued }) => ({ id, model, brand, cpu, gpu, scores, physical, pricing: { barebone: pricing.barebone, variants: pricing.variants }, ports, releaseDate, discontinued }));
const search = new MiniSearch({ fields: ['model', 'brand', 'cpu', 'gpu'], storeFields: ['id'] }); search.addAll(catalog.map(d => ({ id: d.id, model: d.model, brand: d.brand, cpu: d.cpu.name ?? '', gpu: d.gpu.name ?? '' })));
await Promise.all([writeFile('src/data/catalog.json', json(catalog)), writeFile('src/data/search-index.json', json(search.toJSON())), writeFile('src/data/meta.json', json({ generatedAt: new Date().toISOString(), sourceSheet: source, rowCount: devices.length, warnings: [] }))]);
