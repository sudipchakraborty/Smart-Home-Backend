import assert from 'node:assert/strict';
import test from 'node:test';

import { deviceDateTimeWriteSequence, registersToDeviceDateTime } from '@smart-home/modbus';

test('decodes RTC registers into frontend local date time', () => {
  assert.equal(registersToDeviceDateTime([14, 5, 9, 31, 8, 26]).dateTime, '2026-08-31T14:05:09');
});

test('uses a safe single-register sequence for month changes', () => {
  assert.deepEqual(deviceDateTimeWriteSequence('2028-02-29T23:59:58'), [
    { address: 12, value: 1 }, { address: 13, value: 2 }, { address: 14, value: 28 },
    { address: 12, value: 29 }, { address: 9, value: 23 }, { address: 10, value: 59 },
    { address: 11, value: 58 },
  ]);
});

test('rejects impossible or unsupported device dates', () => {
  assert.throws(() => deviceDateTimeWriteSequence('2026-02-29T10:00:00'), /invalid/);
  assert.throws(() => deviceDateTimeWriteSequence('2100-01-01T10:00:00'), /2000 to 2099/);
});
