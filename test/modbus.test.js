import assert from 'node:assert/strict';
import test from 'node:test';

import { ModbusRtuClient } from '@smart-home/modbus';
import { normalizeSerialSettings } from '@smart-home/serial-port';

import { appConfig } from '../src/config/app-config.js';

test('loads COM9 and Modbus settings from config.json', () => {
  assert.equal(appConfig.serialPort.path, 'COM9');
  assert.equal(appConfig.serialPort.baudRate, 115200);
  assert.ok(Number.isInteger(appConfig.modbus.unitId) && appConfig.modbus.unitId >= 1 && appConfig.modbus.unitId <= 247);
});

test('serial settings supply portable defaults', () => {
  const settings = normalizeSerialSettings({ path: 'COM15' });

  assert.equal(settings.path, 'COM15');
  assert.equal(settings.dataBits, 8);
  assert.equal(settings.stopBits, 1);
  assert.equal(settings.parity, 'none');
});

test('Modbus client exposes status without opening hardware', () => {
  const client = new ModbusRtuClient({ ...appConfig, modbus: { ...appConfig.modbus, unitId: 7 } });

  assert.deepEqual(client.status, {
    connected: false,
    path: 'COM9',
    baudRate: 115200,
    protocol: 'ascii',
    unitId: 7,
    timeoutMs: 2000,
  });
});

test('Modbus operations fail clearly while disconnected', async () => {
  const client = new ModbusRtuClient(appConfig);

  await assert.rejects(client.readHoldingRegisters(0, 1), /COM9 is not connected/);
});
