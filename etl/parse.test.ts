import { describe, expect, it } from 'vitest';
import { parseSheet } from './parse';

const csv = `Model Name,Brand,CPU,GPU,Overall Score,Estimated Barebone Cost\nTest 1,Acme,N100,UHD,10,$199\nTest 1,Acme,N100,UHD,9,$209\n`;
describe('parseSheet', () => it('creates stable, unique IDs and prices', () => {
  const devices = parseSheet(csv);
  expect(devices.map(d => d.id)).toEqual(['acme-test-1-n100-uhd', 'acme-test-1-n100-uhd-2']);
  expect(devices[0].pricing.barebone).toBe(199);
}));
