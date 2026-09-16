import { facetByKey, rangeByKey, type FacetKey, type RangeKey } from './filter-definitions';

export type SortKey = 'overall' | 'price' | 'priceToScore' | 'volume' | 'releaseDate' | 'brandModel';
export type SortDirection = 'asc' | 'desc';
export type NumericRange = { min?: number; max?: number };
export type FilterState = {
  q: string;
  filters: Partial<Record<FacetKey, string[]>>;
  ranges: Partial<Record<RangeKey, NumericRange>>;
  sort: { key: SortKey; direction: SortDirection };
};

const sortKeys: readonly SortKey[] = ['overall', 'price', 'priceToScore', 'volume', 'releaseDate', 'brandModel'];
const normalize = (value: string) => value.trim().toLocaleLowerCase();
const finite = (value: string | null) => {
  if (!value?.trim()) return undefined;
  const result = Number(value);
  return Number.isFinite(result) ? result : undefined;
};
const asParams = (input: string | URL | URLSearchParams) => input instanceof URLSearchParams ? input : new URLSearchParams(input instanceof URL ? input.search : input.startsWith('?') ? input.slice(1) : input);

export const createDefaultState = (): FilterState => ({ q: '', filters: {}, ranges: {}, sort: { key: 'overall', direction: 'desc' } });

export const parseQueryState = (input: string | URL | URLSearchParams): FilterState => {
  const params = asParams(input);
  const state = createDefaultState();
  state.q = (params.get('q') ?? '').trim();
  for (const key of Object.keys(facetByKey) as FacetKey[]) {
    const values = [...new Set(params.getAll(`f.${key}`).flatMap(value => value.split(',')).map(normalize).filter(Boolean))].sort();
    if (values.length) state.filters[key] = values;
  }
  for (const key of Object.keys(rangeByKey) as RangeKey[]) {
    const [minRaw, maxRaw] = (params.get(`r.${key}`) ?? '').split('..', 2);
    const min = finite(minRaw), max = finite(maxRaw);
    if (min !== undefined || max !== undefined) state.ranges[key] = min !== undefined && max !== undefined && min > max ? { min: max, max: min } : { min, max };
  }
  const sort = params.get('sort');
  if (sortKeys.includes(sort as SortKey)) state.sort.key = sort as SortKey;
  if (params.get('dir') === 'asc' || params.get('dir') === 'desc') state.sort.direction = params.get('dir') as SortDirection;
  return state;
};

export const serializeQueryState = (state: FilterState): string => {
  const params = new URLSearchParams();
  if (state.q.trim()) params.set('q', state.q.trim());
  for (const key of Object.keys(facetByKey) as FacetKey[]) {
    const values = [...new Set((state.filters[key] ?? []).map(normalize).filter(Boolean))].sort();
    if (values.length) params.set(`f.${key}`, values.join(','));
  }
  for (const key of Object.keys(rangeByKey) as RangeKey[]) {
    const range = state.ranges[key];
    const min = range?.min, max = range?.max;
    if ((min !== undefined && !Number.isFinite(min)) || (max !== undefined && !Number.isFinite(max)) || (min === undefined && max === undefined)) continue;
    params.set(`r.${key}`, `${min ?? ''}..${max ?? ''}`);
  }
  const sort = sortKeys.includes(state.sort.key) ? state.sort.key : 'overall';
  const direction = state.sort.direction === 'asc' ? 'asc' : 'desc';
  if (sort !== 'overall') params.set('sort', sort);
  if (direction !== 'desc') params.set('dir', direction);
  return params.toString();
};
