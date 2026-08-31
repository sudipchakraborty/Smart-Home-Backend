import assert from 'node:assert/strict';
import test from 'node:test';

import { writeRegisterBlock } from '@smart-home/modbus';

test('single-register mode uses function 06 behavior for each word', async () => {
  const writes = [];
  const client = {
    writeRegister: async (address, value) => writes.push({ address, value }),
  };

  await writeRegisterBlock(client, 1, [0x0000, 0xf35b], {
    mode: 'single-register',
  });

  assert.deepEqual(writes, [
    { address: 1, value: 0x0000 },
    { address: 2, value: 0xf35b },
  ]);
});

test('multiple-register mode keeps function 16 behavior available', async () => {
  const writes = [];
  const client = {
    writeRegisters: async (address, values) => writes.push({ address, values }),
  };

  await writeRegisterBlock(client, 1, [0x0000, 0xf35b]);

  assert.deepEqual(writes, [{ address: 1, values: [0x0000, 0xf35b] }]);
});
