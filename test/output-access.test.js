import assert from 'node:assert/strict';
import test from 'node:test';

import { createOutputAccessService } from '../src/modules/output-access/output-access.service.js';

test('output access reads and preserves unrelated bits while changing one output', async () => {
  const writes = [];
  let register = 0x0022;
  const client = {
    async readHoldingRegisters() { return { data: [register] }; },
    async writeRegister(address, value) { writes.push({ address, value }); register = value; },
  };
  const service = createOutputAccessService(client, { outputRegister: 0, outputs: { relay1: 0x0001, relay2: 0x0002 } });

  assert.deepEqual(await service.updateOutput('relay1', true), { relay1: true, relay2: true });
  assert.deepEqual(writes, [{ address: 0, value: 0x0023 }]);
});

test('output access rejects an unknown output before hardware access', async () => {
  const service = createOutputAccessService({ readHoldingRegisters() { throw new Error('hardware touched'); } }, { outputRegister: 0, outputs: { relay1: 1 } });
  await assert.rejects(service.updateOutput('unknown', true), /Unknown output/);
});
