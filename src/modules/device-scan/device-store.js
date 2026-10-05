import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const createDeviceStore = (file) => {
  let pending = Promise.resolve();
  const read = async () => {
    try {
      const data = JSON.parse(await readFile(file, 'utf8'));
      if (data.version !== 1 || !Array.isArray(data.devices)) throw new Error('Saved device list has an invalid format');
      return data.devices;
    } catch (error) { if (error.code === 'ENOENT') return []; throw error; }
  };
  const save = (update) => {
    const operation = pending.then(async () => {
      const devices = update(await read()).sort((a, b) => a.unitId - b.unitId);
      await mkdir(dirname(file), { recursive: true });
      await writeFile(`${file}.tmp`, `${JSON.stringify({ version: 1, devices }, null, 2)}\n`, 'utf8');
      await rename(`${file}.tmp`, file);
      return devices;
    });
    pending = operation.catch(() => {});
    return operation;
  };
  const savedDevice = (device) => {
    if (!Number.isInteger(device.unitId) || device.unitId < 1 || device.unitId > 247) throw new RangeError('Saved device address must be from 1 to 247');
    return { unitId: device.unitId, deviceId: device.deviceId, deviceName: device.deviceName,
      productId: device.productId, serialNumber: device.serialNumber, status: 'Saved', lastSeenAt: new Date().toISOString() };
  };
  return {
    list: async () => { await pending; return read(); },
    merge: (found) => save((current) => {
      const devices = new Map(current.map((device) => [device.unitId, device]));
      for (const device of found) devices.set(device.unitId, savedDevice(device));
      return [...devices.values()];
    }),
    replace: (oldUnitId, device) => save((current) => [
      ...current.filter((item) => item.unitId !== oldUnitId && item.unitId !== device.unitId), savedDevice(device),
    ]),
  };
};

export const deviceStore = createDeviceStore(process.env.DEVICE_STORE_PATH ?? fileURLToPath(new URL('../../../data/devices.json', import.meta.url)));
