import { useMemo, useState } from 'preact/hooks';
import type { CatalogDevice } from '../lib/device';

type RichDevice = CatalogDevice;
type Spec = { label: string; value: (device: RichDevice) => unknown; better?: 'high' | 'low' };
type Group = { title: string; specs: Spec[] };

const show = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
};

const groups: Group[] = [
  { title: 'Overview', specs: [
    { label: 'Overall score', value: d => d.scores.overall, better: 'high' },
    { label: 'Minimum price', value: d => d.minPrice ?? d.pricing.barebone, better: 'low' },
    { label: 'Release date', value: d => d.releaseDate },
  ] },
  { title: 'CPU and GPU', specs: [
    { label: 'CPU', value: d => d.cpu.name }, { label: 'CPU class', value: d => d.cpu.class },
    { label: 'CPU generation', value: d => d.cpu.gen }, { label: 'Performance cores', value: d => d.cpu.pCores, better: 'high' },
    { label: 'Threads', value: d => d.cpu.threads, better: 'high' }, { label: 'GPU', value: d => d.gpu.name },
    { label: 'Discrete GPU', value: d => d.gpu.discrete },
  ] },
  { title: 'Memory and storage', specs: [
    { label: 'RAM slots', value: d => d.memory?.slots, better: 'high' }, { label: 'Maximum RAM (GB)', value: d => d.memory?.maxGb, better: 'high' },
    { label: 'Maximum RAM speed', value: d => d.memory?.maxSpeedMts, better: 'high' }, { label: 'ECC', value: d => d.memory?.ecc },
    { label: 'Maximum drives', value: d => d.storage?.maxDrives, better: 'high' }, { label: 'Maximum NVMe', value: d => d.storage?.maxNvme, better: 'high' },
  ] },
  { title: 'Connectivity', specs: [
    { label: 'USB4 ports', value: d => d.ports.usb4, better: 'high' }, { label: 'Thunderbolt 5', value: d => d.ports.tb5, better: 'high' },
    { label: 'Oculink', value: d => d.ports.oculink, better: 'high' }, { label: 'Displays', value: d => d.ports.displays, better: 'high' },
    { label: 'Maximum Ethernet', value: d => d.network?.maxEth, better: 'high' }, { label: 'Wi-Fi 6E', value: d => d.network?.wifi6e },
  ] },
  { title: 'Physical and power', specs: [
    { label: 'Volume (L)', value: d => d.physical.volumeL, better: 'low' }, { label: 'Dimensions (mm)', value: d => [d.physical.d1, d.physical.d2, d.physical.d3].every(Boolean) ? `${d.physical.d1} × ${d.physical.d2} × ${d.physical.d3}` : null },
    { label: 'TDP (W)', value: d => d.power?.tdpW ?? d.cpu.tdpW, better: 'low' }, { label: 'Warranty (years)', value: d => d.support?.warrantyYrs, better: 'high' },
  ] },
];

export default function CompareApp({ devices }: { devices: RichDevice[] }) {
  const params = new URLSearchParams(location.search);
  const ids = [...new Set((params.get('ids') ?? '').split(',').filter(Boolean))].slice(0, 4);
  const selected = ids.map(id => devices.find(device => device.id === id)).filter(Boolean) as RichDevice[];
  const [differencesOnly, setDifferencesOnly] = useState(false);
  const visible = useMemo(() => groups.map(group => ({ ...group, specs: group.specs.filter(spec => !differencesOnly || new Set(selected.map(d => show(spec.value(d)))).size > 1) })).filter(group => group.specs.length), [selected, differencesOnly]);
  if (selected.length < 2) return <section class="empty-state"><h1>Compare mini PCs</h1><p>Select at least two products from the catalog.</p><a class="button" href={import.meta.env.BASE_URL}>Back to catalog</a></section>;
  return <>
    <header class="page-heading"><div><p class="eyebrow">Side-by-side</p><h1>Compare {selected.length} mini PCs</h1></div><label class="switch"><input type="checkbox" checked={differencesOnly} onChange={e => setDifferencesOnly(e.currentTarget.checked)} /> Show only differences</label></header>
    <div class="compare-scroll"><table class="compare-table"><thead><tr><th>Specification</th>{selected.map(device => <th key={device.id}>{device.brand}<br /><strong>{device.model}</strong></th>)}</tr></thead><tbody>{visible.map(group => <><tr class="section-row"><th colSpan={selected.length + 1}>{group.title}</th></tr>{group.specs.map(spec => { const raw = selected.map(spec.value); const numeric = raw.filter((v): v is number => typeof v === 'number'); const best = spec.better && numeric.length ? (spec.better === 'high' ? Math.max(...numeric) : Math.min(...numeric)) : null; return <tr><th>{spec.label}</th>{raw.map((value, index) => <td class={best !== null && value === best && new Set(raw).size > 1 ? 'best' : ''} key={selected[index].id}>{spec.label === 'Minimum price' && typeof value === 'number' ? `$${value.toLocaleString('en-US')}` : show(value)}</td>)}</tr>; })}</>)}</tbody></table></div>
  </>;
}
