import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createDeviceStore } from '../src/modules/device-scan/device-store.js';

const device = (unitId, deviceName = 'BATHROOM') => ({ unitId, deviceId: String(unitId).padStart(3, '0'), deviceName, productId: 'LPTM', serialNumber: `serial-${unitId}`, status: 'Online' });
test('scan inventory survives reload, merges addresses and preserves offline devices on empty scans', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'smart-home-devices-'));
  try {
    const file = join(dir, 'devices.json');
    const store = createDeviceStore(file);
    assert.deepEqual(await store.list(), []);
    await store.merge([device(2)]);
    await store.merge([device(3)]);
    await store.merge([]);
    const saved = await createDeviceStore(file).list();
    assert.deepEqual(saved.map(item => item.unitId), [2, 3]);
    assert.equal(JSON.parse(await readFile(file, 'utf8')).devices.length, 2);
    await store.replace(2, device(4, 'UPDATED'));
    assert.deepEqual((await store.list()).map(item => item.unitId), [3, 4]);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
test('concurrent saves retain both results and do not overwrite each other', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'smart-home-devices-'));
  try {
    const store = createDeviceStore(join(dir, 'devices.json'));
    await Promise.all([store.merge([device(2)]), store.merge([device(3)])]);
    assert.equal((await store.list()).length, 2);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
