export type FacetKey =
  | 'brand' | 'cpuName' | 'cpuClass' | 'cpuGeneration' | 'cpuSocket' | 'gpuName'
  | 'gpuDiscrete' | 'gpuIntegrated' | 'discontinued' | 'memoryEcc' | 'networkEthModel'
  | 'networkWifi6' | 'networkWifi6e' | 'networkWirelessSoc' | 'powerVpro' | 'powerPsuType';

export type RangeKey =
  | 'overallScore' | 'price' | 'volume' | 'cpuCores' | 'cpuThreads' | 'cpuTdp'
  | 'memorySlots' | 'memoryMaxGb' | 'memorySpeed' | 'storageDrives' | 'storageNvme'
  | 'storageNvmeGen5' | 'storageNvmeGen4' | 'storageNvmeGen3' | 'storageM2Sata' | 'storageSdCard'
  | 'storageSata25' | 'storageSata35' | 'portsPcieX16' | 'portsPcieX8' | 'portsPcieX4'
  | 'portsPcieX1' | 'portsOculink' | 'portsTb5' | 'portsUsb4' | 'portsPdIn' | 'portsPdVideo' | 'portsPdVideoData'
  | 'portsHdmi21' | 'displays' | 'networkG10' | 'networkG5' | 'networkG25' | 'networkG1'
  | 'networkMaxEth' | 'powerIdle' | 'powerLoad' | 'powerPeak' | 'powerTdp' | 'powerPsu'
  | 'powerBattery' | 'volume' | 'dimension1' | 'dimension2' | 'dimension3' | 'fan1' | 'fan2'
  | 'warranty' | 'durability' | 'releaseYear';

export type DeviceRecord = Record<string, unknown>;
export type Value = string | number | boolean | null | undefined;

export type FacetDefinition = {
  key: FacetKey;
  label: string;
  value: (device: DeviceRecord) => Value;
};

export type RangeDefinition = {
  key: RangeKey;
  label: string;
  value: (device: DeviceRecord) => number | null;
};

const get = (device: DeviceRecord, path: string): Value => path.split('.').reduce<unknown>((value, key) =>
  value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined, device) as Value;
const number = (path: string) => (device: DeviceRecord) => {
  const value = get(device, path);
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
};

export const filterDefinitions: readonly FacetDefinition[] = [
  ['brand', 'Brand', 'brand'], ['cpuName', 'CPU', 'cpu.name'], ['cpuClass', 'CPU class', 'cpu.class'],
  ['cpuGeneration', 'CPU generation', 'cpu.gen'], ['cpuSocket', 'Socket', 'cpu.socket'], ['gpuName', 'GPU', 'gpu.name'],
  ['gpuDiscrete', 'Discrete GPU', 'gpu.discrete'], ['gpuIntegrated', 'Integrated GPU', 'gpu.integrated'],
  ['discontinued', 'Discontinued', 'discontinued'], ['memoryEcc', 'ECC memory', 'memory.ecc'], ['networkEthModel', 'Ethernet', 'network.ethModel'],
  ['networkWifi6', 'Wi-Fi 6', 'network.wifi6'], ['networkWifi6e', 'Wi-Fi 6E', 'network.wifi6e'], ['networkWirelessSoc', 'Wireless chipset', 'network.wirelessSoc'],
  ['powerVpro', 'vPro', 'power.vPro'], ['powerPsuType', 'PSU type', 'power.psuType'],
].map(([key, label, path]) => ({ key: key as FacetKey, label, value: (device: DeviceRecord) => get(device, path) }));

export const rangeDefinitions: readonly RangeDefinition[] = [
  ['overallScore', 'Overall score', 'scores.overall'], ['price', 'Price', 'minPrice'],
  ['cpuCores', 'CPU cores', 'cpu.pCores'], ['cpuThreads', 'CPU threads', 'cpu.threads'], ['cpuTdp', 'CPU TDP', 'cpu.tdpW'],
  ['memorySlots', 'Memory slots', 'memory.slots'], ['memoryMaxGb', 'Max memory', 'memory.maxGb'], ['memorySpeed', 'Memory speed', 'memory.maxSpeedMts'],
  ['storageDrives', 'Max drives', 'storage.maxDrives'], ['storageNvme', 'Max NVMe', 'storage.maxNvme'], ['storageNvmeGen5', 'NVMe Gen 5', 'storage.nvmeGen5'],
  ['storageNvmeGen4', 'NVMe Gen 4', 'storage.nvmeGen4'], ['storageNvmeGen3', 'NVMe Gen 3', 'storage.nvmeGen3'], ['storageM2Sata', 'M.2 SATA', 'storage.m2Sata'],
  ['storageSdCard', 'SD card', 'storage.sdCard'], ['storageSata25', '2.5 SATA', 'storage.sata25'], ['storageSata35', '3.5 SATA', 'storage.sata35'], ['portsPcieX16', 'PCIe x16', 'ports.pcieX16'],
  ['portsPcieX8', 'PCIe x8', 'ports.pcieX8'], ['portsPcieX4', 'PCIe x4', 'ports.pcieX4'], ['portsPcieX1', 'PCIe x1', 'ports.pcieX1'],
  ['portsOculink', 'OCuLink', 'ports.oculink'], ['portsTb5', 'Thunderbolt 5', 'ports.tb5'], ['portsUsb4', 'USB4', 'ports.usb4'],
  ['portsPdIn', 'PD input', 'ports.pdInMinW'], ['portsPdVideo', 'PD video', 'ports.pdVideoMinW'], ['portsPdVideoData', 'PD video and data', 'ports.pdVideoDataMinW'], ['portsHdmi21', 'HDMI 2.1', 'ports.hdmi21'],
  ['displays', 'Displays', 'ports.displays'], ['networkG10', '10 GbE ports', 'network.ports.g10'], ['networkG5', '5 GbE ports', 'network.ports.g5'],
  ['networkG25', '2.5 GbE ports', 'network.ports.g2_5'], ['networkG1', '1 GbE ports', 'network.ports.g1'], ['networkMaxEth', 'Max Ethernet', 'network.maxEth'],
  ['powerIdle', 'Idle power', 'power.idleW'], ['powerLoad', 'Load power', 'power.loadW'], ['powerPeak', 'Peak power', 'power.peakW'], ['powerTdp', 'Power TDP', 'power.tdpW'],
  ['powerPsu', 'PSU power', 'power.psuW'], ['powerBattery', 'Battery', 'power.batteryWh'], ['volume', 'Volume', 'physical.volumeL'],
  ['dimension1', 'Dimension 1', 'physical.d1'], ['dimension2', 'Dimension 2', 'physical.d2'], ['dimension3', 'Dimension 3', 'physical.d3'],
  ['fan1', 'Fan 1', 'physical.fan1Mm'], ['fan2', 'Fan 2', 'physical.fan2Mm'], ['warranty', 'Warranty', 'support.warrantyYrs'], ['durability', 'Durability', 'support.durabilityYrs'],
  ['releaseYear', 'Release year', 'releaseDate'],
].map(([key, label, path]) => ({
  key: key as RangeKey,
  label,
  value: path === 'releaseDate'
    ? (device: DeviceRecord) => { const date = Date.parse(String(get(device, path) ?? '')); return Number.isNaN(date) ? null : new Date(date).getUTCFullYear(); }
    : number(path),
}));

export const facetByKey = Object.fromEntries(filterDefinitions.map(definition => [definition.key, definition])) as Record<FacetKey, FacetDefinition>;
export const rangeByKey = Object.fromEntries(rangeDefinitions.map(definition => [definition.key, definition])) as Record<RangeKey, RangeDefinition>;
