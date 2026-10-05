import assert from 'node:assert/strict';
import test from 'node:test';
import { createModbusSession } from '../src/modules/modbus/modbus-session.js';

test('concurrent device contexts keep their targets and serialize complete connection lifecycles', async () => {
  const calls = [];
  const transport = {
    settings: { unitId: 1 }, isOpen: false,
    async connect() { this.isOpen = true; calls.push('connect'); },
    async disconnect() { this.isOpen = false; calls.push('disconnect'); },
    async readHoldingRegistersAtUnit(unitId) { calls.push(`read-${unitId}`); await new Promise(resolve => setTimeout(resolve, 5)); return { data: [unitId] }; },
    async writeRegisterAtUnit(unitId) { calls.push(`write-${unitId}`); },
  };
  const session = createModbusSession(transport);
  const operation = () => session.withConnection(async () => {
    const response = await session.client.readHoldingRegisters(29, 3);
    await session.client.writeRegister(7, 1);
    return response.data[0];
  });
  const results = await Promise.all([session.atUnit(2, operation), session.atUnit(3, operation)]);
  assert.deepEqual(results, [2, 3]);
  assert.deepEqual(calls, ['connect', 'read-2', 'write-2', 'disconnect', 'connect', 'read-3', 'write-3', 'disconnect']);
});
