import assert from 'node:assert/strict';
import test from 'node:test';
import { planDeviceAddressChange } from '../src/modules/device-scan/device-address-plan.js';

test('address change plans keep intermediate IDs valid and avoid known occupied addresses', () => {
  const steps = planDeviceAddressChange('001', '210', new Set([201]));
  assert.equal(steps.at(-1).unitId, 210);
  assert.ok(steps.every(step => step.unitId >= 1 && step.unitId <= 247 && step.unitId !== 201));
});
test('occupied target and invalid IDs fail before any writes', () => {
  assert.throws(() => planDeviceAddressChange('001', '002', new Set([2])), /already saved/);
  assert.throws(() => planDeviceAddressChange('001', '000', new Set()), /1 to 247/);
  assert.deepEqual(planDeviceAddressChange('002', '002', new Set()), []);
});
