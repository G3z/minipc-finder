import { describe, expect, it } from 'vitest';
import { filterAndSortDevices } from './catalog-filter';
import { createDefaultState, parseQueryState, serializeQueryState } from './query-state';
import type { CatalogDevice } from './device';

const devices = [
  { id: 'a', brand: 'Acme', model: 'Fast', cpu: { name: 'N100', class: 'Intel' }, gpu: { name: 'UHD', discrete: false }, scores: { overall: 10 }, physical: { volumeL: 2 }, pricing: { barebone: 300 }, ports: {}, releaseDate: '2024-01-01', discontinued: false },
  { id: 'b', brand: 'Beta', model: 'Big', cpu: { name: 'R7', class: 'AMD' }, gpu: { name: 'Radeon', discrete: true }, scores: { overall: 20 }, physical: { volumeL: 4 }, pricing: { barebone: 200 }, ports: {}, releaseDate: '2023-01-01', discontinued: false },
  { id: 'c', brand: 'Acme', model: 'Unknown', cpu: { name: null, class: 'Intel' }, gpu: { name: null, discrete: null }, scores: { overall: null }, physical: { volumeL: null }, pricing: { barebone: null, variants: [{ usd: 500 }] }, ports: {}, releaseDate: null, discontinued: true },
] as unknown as CatalogDevice[];

describe('catalog filtering', () => {
  it('uses OR within a facet, AND between facets, ranges and search', () => {
    const state = createDefaultState();
    state.filters = { brand: ['acme', 'beta'], cpuClass: ['intel'] };
    state.ranges = { price: { max: 400 } };
    state.q = 'fast';
    expect(filterAndSortDevices(devices, state).map(device => device.id)).toEqual(['a']);
  });

  it('keeps missing values at the end in either direction', () => {
    const state = createDefaultState();
    state.sort = { key: 'overall', direction: 'asc' };
    expect(filterAndSortDevices(devices, state).map(device => device.id)).toEqual(['a', 'b', 'c']);
    state.sort.direction = 'desc';
    expect(filterAndSortDevices(devices, state).map(device => device.id)).toEqual(['b', 'a', 'c']);
  });
});

describe('query state', () => {
  it('parses defensively and serializes deterministically', () => {
    const state = parseQueryState('?f.brand=Beta,acme&f.brand=ACME&r.price=500..100&q= mini &sort=price&dir=asc&ignored=x');
    expect(state).toMatchObject({ q: 'mini', filters: { brand: ['acme', 'beta'] }, ranges: { price: { min: 100, max: 500 } }, sort: { key: 'price', direction: 'asc' } });
    expect(serializeQueryState(state)).toBe('q=mini&f.brand=acme%2Cbeta&r.price=100..500&sort=price&dir=asc');
  });
});
