import { describe, expect, it } from 'vitest';
import { parseSheet } from './parse';
import { buildFacets, toCatalog } from './build-data';

const csv = `Model Name,Brand,CPU,GPU,Overall Score,Estimated Barebone Cost\nTest 1,Acme,N100,UHD,10,$199\nTest 1,Acme,N100,UHD,9,$209\n`;
describe('parseSheet', () => it('creates stable, unique IDs and prices', () => {
  const devices = parseSheet(csv);
  expect(devices.map(d => d.id)).toEqual(['acme-test-1-n100-uhd', 'acme-test-1-n100-uhd-2']);
  expect(devices[0].pricing.barebone).toBe(199);
}));

describe('complete mappings', () => it('preserves zeroes, booleans and all filter fields', () => {
  const [device] = parseSheet('Model Name,Brand,CPU,PCIe x16,Gen 5 NVMe,Wifi 6E,Idle W,Warranty yrs,8GB/256GB\nBox,Acme,N100,0,2,1,0,3,$199\n');
  expect(device.ports.pcieX16).toBe(0);
  expect(device.storage.nvmeGen5).toBe(2);
  expect(device.network.wifi6e).toBe(true);
  expect(device.power.idleW).toBe(0);
  expect(device.support.warrantyYrs).toBe(3);
  expect(device.pricing.variants).toEqual([{ config: '8GB/256GB', usd: 199 }]);
}));

describe('catalog facets', () => it('calculates minimum price and deterministic values/ranges', () => {
  const catalog = toCatalog(parseSheet('Model Name,Brand,CPU,Estimated Barebone Cost,8GB/256GB,Vol L\nOne,Acme,N100,$299,$199,1\nTwo,Acme,N200,,$2,1\n'));
  expect(catalog.map(device => device.minPrice)).toEqual([199, 2]);
  expect(buildFacets(catalog)).toMatchObject({ values: { brand: [{ value: 'Acme', count: 2 }] }, ranges: { minPrice: { min: 2, max: 199 }, 'physical.volumeL': { min: 1, max: 1 } } });
}));
