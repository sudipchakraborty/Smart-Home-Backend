import assert from 'node:assert/strict';
import test from 'node:test';

import {
  registersToTime,
  secondsToTime,
  timeToRegisters,
  timeToSeconds,
  uint32ToRegisters,
} from '@smart-home/modbus';

test('converts 17:18:19 to 62299 seconds', () => {
  assert.equal(timeToSeconds('17:18:19'), 62299);
});

test('encodes 17:18:19 into two high-low 16-bit registers', () => {
  assert.deepEqual(timeToRegisters('17:18:19', 'high-low'), {
    time: '17:18:19',
    totalSeconds: 62299,
    registers: [0x0000, 0xf35b],
  });
});

test('supports reversed 32-bit word order', () => {
  assert.deepEqual(uint32ToRegisters(62299, 'low-high'), [0xf35b, 0x0000]);
});

test('rejects invalid clock values', () => {
  assert.throws(() => timeToSeconds('24:00:00'), /between 00:00:00 and 23:59:59/);
  assert.throws(() => timeToSeconds('17:18'), /HH:mm:ss/);
});

test('decodes low-high device registers back to time', () => {
  assert.deepEqual(registersToTime([0xf35b, 0x0000], 'low-high'), {
    time: '17:18:19',
    totalSeconds: 62299,
    registers: [0xf35b, 0x0000],
  });
  assert.equal(secondsToTime(67500), '18:45:00');
});
