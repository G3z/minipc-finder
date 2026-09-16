import type { CatalogDevice } from './device';
import { facetByKey, rangeByKey, type DeviceRecord, type Value } from './filter-definitions';
import type { FilterState, SortKey } from './query-state';

const normalize = (value: Value) => {
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim().toLocaleLowerCase() : null;
};
const text = (device: DeviceRecord) => [device.id, device.brand, device.model, (device.cpu as DeviceRecord | undefined)?.name, (device.gpu as DeviceRecord | undefined)?.name]
  .filter((value): value is string => typeof value === 'string').join(' ').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase();
const price = (device: DeviceRecord) => {
  const pricing = device.pricing as DeviceRecord | undefined;
  const barebone = pricing?.barebone;
  if (typeof barebone === 'number' && Number.isFinite(barebone)) return barebone;
  const variants = pricing?.variants;
  if (!Array.isArray(variants)) return null;
  const values = variants.map(item => (item as DeviceRecord).usd).filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0);
  return values.length ? Math.min(...values) : null;
};
const metric = (device: DeviceRecord, key: SortKey): string | number | null => {
  if (key === 'overall') return rangeByKey.overallScore.value(device);
  if (key === 'price') return price(device);
  if (key === 'priceToScore') { const p = price(device), score = rangeByKey.overallScore.value(device); return p === null || score === null || score <= 0 ? null : p / score; }
  if (key === 'volume') return rangeByKey.volume.value(device);
  if (key === 'releaseDate') { const value = Date.parse(String(device.releaseDate ?? '')); return Number.isNaN(value) ? null : value; }
  return `${String(device.brand ?? '')} ${String(device.model ?? '')}`.trim().toLocaleLowerCase();
};

export const filterAndSortDevices = <T extends CatalogDevice>(devices: readonly T[], state: FilterState): T[] => devices
  .filter(device => {
    const record = device as unknown as DeviceRecord;
    if (state.q.trim() && !text(record).includes(state.q.trim().normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase())) return false;
    return Object.entries(state.filters).every(([key, selected]) => {
      if (!selected?.length) return true;
      const definition = facetByKey[key as keyof typeof facetByKey];
      if (!definition) return true;
      const value = normalize(definition.value(record));
      return value !== null && selected.map(value => value.trim().toLocaleLowerCase()).includes(value);
    }) && Object.entries(state.ranges).every(([key, range]) => {
      const definition = rangeByKey[key as keyof typeof rangeByKey];
      if (!definition && key !== 'price') return true;
      const value = key === 'price' ? price(record) : definition.value(record);
      return value !== null && (range?.min === undefined || value >= range.min) && (range?.max === undefined || value <= range.max);
    });
  })
  .slice()
  .sort((left, right) => {
    const a = metric(left as unknown as DeviceRecord, state.sort.key), b = metric(right as unknown as DeviceRecord, state.sort.key);
    if (a === null) return b === null ? String(left.id).localeCompare(String(right.id)) : 1;
    if (b === null) return -1;
    const compare = typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b));
    return (state.sort.direction === 'asc' ? compare : -compare) || String(left.id).localeCompare(String(right.id));
  });
