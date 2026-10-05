import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = await mkdtemp(join(tmpdir(), 'smart-home-control-'));
process.env.DEVICE_STORE_PATH = join(dir, 'devices.json');
const { createApp } = await import('../src/app.js');
const { transportClient } = await import('../src/modules/modbus/modbus.service.js');
const memories = new Map();
const calls = [];
for (const unitId of [2, 3]) {
  const memory = Array(200).fill(0);
  const put = (start, length, text) => { for (let index = 0; index < length; index++) memory[start + index] = (text[index] ?? ' ').charCodeAt(0); };
  put(29, 3, String(unitId).padStart(3, '0')); put(32, 19, `ROOM ${unitId}`);
  put(51, 20, 'LPTM'); put(71, 20, `serial-${unitId}`);
  memory.splice(1, 6, 1, 0, 0, 23, 28, 15);
  memory.splice(22, 6, 12, 34, 56, 5, 10, 26);
  memory.splice(96, 2, 79, 70);
  memories.set(unitId, memory);
}
let opened = false;
Object.defineProperty(transportClient, 'isOpen', { get: () => opened });
transportClient.connect = async () => { opened = true; };
transportClient.disconnect = async () => { opened = false; };
transportClient.readHoldingRegistersAtUnit = async (unitId, address, length) => {
  calls.push({ unitId, address, read: true });
  if (!memories.has(unitId)) throw new Error('No response');
  return { data: memories.get(unitId).slice(address, address + length) };
};
transportClient.writeRegisterAtUnit = async (unitId, address, value) => {
  calls.push({ unitId, address, value });
  const memory = memories.get(unitId);
  assert.ok(memory, 'write must follow current address');
  memory[address] = value;
  if (address >= 29 && address <= 31) {
    const nextId = Number(String.fromCharCode(...memory.slice(29, 32)));
    assert.ok(nextId >= 1 && nextId <= 247);
    memories.delete(unitId); memories.set(nextId, memory);
  }
  if (address >= 15 && address <= 20) memory[address + 7] = value;
};
let server, base;
before(async () => {
  server = createApp().listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(async () => { await new Promise(resolve => server.close(resolve)); await rm(dir, { recursive: true, force: true }); });
const request = async (path, body, method = body === undefined ? 'GET' : 'PUT') => {
  const response = await fetch(`${base}${path}`, { method, headers: { 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const result = await response.json();
  assert.equal(response.status, 200, JSON.stringify(result));
  return result.data;
};
test('scan saves actual results to JSON and saved endpoint restores them without hardware access', async () => {
  await request('/devices/scan', { startAddress: 2, endAddress: 3 }, 'POST');
  assert.deepEqual(JSON.parse(await readFile(process.env.DEVICE_STORE_PATH, 'utf8')).devices.map(device => device.unitId), [2, 3]);
  calls.length = 0;
  const saved = await request('/devices/saved');
  assert.deepEqual(saved.devices.map(device => device.unitId), [2, 3]);
  assert.equal(calls.length, 0);
});
test('stopped scans save found devices and leave the previous inventory intact', async () => {
  const originalRead = transportClient.readHoldingRegistersAtUnit;
  let entered;
  const firstRead = new Promise(resolve => { entered = resolve; });
  transportClient.readHoldingRegistersAtUnit = async (...parameters) => {
    entered();
    await new Promise(resolve => setTimeout(resolve, 20));
    return originalRead(...parameters);
  };
  try {
    const scanning = request('/devices/scan', { startAddress: 2, endAddress: 3 }, 'POST');
    await firstRead;
    const duplicate = await fetch(`${base}/devices/scan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ startAddress: 2, endAddress: 3 }) });
    assert.equal(duplicate.status, 409);
    await request('/devices/scan', undefined, 'DELETE');
    const found = await scanning;
    assert.deepEqual(found.map(device => device.unitId), [2]);
    const saved = await request('/devices/saved');
    assert.deepEqual(saved.devices.map(device => device.unitId), [2, 3]);
  } finally { transportClient.readHoldingRegistersAtUnit = originalRead; }
});
test('all control read and write routes target selected device 3 instead of default device 2', async () => {
  calls.length = 0;
  await request('/relays/1/schedule?unitId=3');
  await request('/relays/1/schedule?unitId=3', { onTime: '02:03:04', offTime: '22:23:24' });
  await request('/device-clock?unitId=3');
  await request('/device-clock?unitId=3', { dateTime: '2026-10-05T12:34:56' });
  await request('/output-access?unitId=3');
  await request('/output-access/buzzer?unitId=3', { enabled: true });
  await request('/device-control/relay-status?unitId=3');
  await request('/device-control/reset?unitId=3', {}, 'POST');
  assert.ok(calls.length > 20);
  assert.ok(calls.every(call => call.unitId === 3));
});
test('identity update follows the changed address and updates the saved inventory', async () => {
  const changed = await request('/devices/3', { deviceId: '4', deviceName: 'NEW ROOM' });
  assert.equal(changed.unitId, 4);
  const saved = await request('/devices/saved');
  assert.deepEqual(saved.devices.map(device => device.unitId), [2, 4]);
  assert.equal(saved.devices[1].deviceName, 'NEW ROOM');
});
test('invalid selected target is rejected before hardware access', async () => {
  calls.length = 0;
  const response = await fetch(`${base}/device-clock?unitId=0`);
  assert.equal(response.status, 400);
  assert.equal(calls.length, 0);
});
