import assert from 'node:assert/strict';
import test from 'node:test';

import { createDeviceControlService } from '../src/modules/device-control/device-control.service.js';

test('reset writes RESET to registers 91 through 95', async () => {
  const writes = [];
  const service = createDeviceControlService({
    async writeRegister(address, value) { writes.push({ address, value }); },
    async readHoldingRegisters() { return { data: [79, 70] }; },
  }, { resetRegister: 91, relayStatusRegister: 96 });

  await service.reset();

  assert.deepEqual(writes, [
    { address: 91, value: 82 },
    { address: 92, value: 69 },
    { address: 93, value: 83 },
    { address: 94, value: 69 },
    { address: 95, value: 84 },
  ]);
});

test('relay status decodes O as active and F as inactive', async () => {
  const service = createDeviceControlService({
    async readHoldingRegisters(address, quantity) {
      assert.equal(address, 96);
      assert.equal(quantity, 2);
      return { data: [79, 70] };
    },
  }, { resetRegister: 91, relayStatusRegister: 96 });

  assert.deepEqual(await service.readRelayStatus(), { relay1: true, relay2: false });
});
