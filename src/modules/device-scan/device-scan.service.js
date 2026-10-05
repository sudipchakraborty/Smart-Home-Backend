import { appConfig } from '../../config/app-config.js';
import { deviceStore } from './device-store.js';
import { planDeviceAddressChange } from './device-address-plan.js';
import { modbusClient, withModbusConnection } from '../modbus/modbus.service.js';

const decode = (values) => values.map((value) => String.fromCharCode(value)).join('').replace(/\0/g, '').trim();
const encode = (value, length, label) => { if (typeof value !== 'string' || value.length > length) throw new RangeError(`${label} must be at most ${length} characters`); return Array.from({ length }, (_, index) => value.charCodeAt(index) || 32); };
const readIdentity = async (unitId) => {
  const identity = appConfig.deviceIdentity;
  const timeout = identity.scanTimeoutMs;
  const deviceId = await modbusClient.readHoldingRegistersAtUnit(unitId, identity.deviceId.start, identity.deviceId.length, timeout);
  const deviceName = await modbusClient.readHoldingRegistersAtUnit(unitId, identity.deviceName.start, identity.deviceName.length, timeout);
  const productId = await modbusClient.readHoldingRegistersAtUnit(unitId, identity.productId.start, identity.productId.length, timeout);
  const serialNumber = await modbusClient.readHoldingRegistersAtUnit(unitId, identity.serialNumber.start, identity.serialNumber.length, timeout);
  return { unitId, deviceId: decode(deviceId.data), deviceName: decode(deviceName.data), productId: decode(productId.data), serialNumber: decode(serialNumber.data), status: 'Online' };
};

export const scanDevices = async (startAddress = 1, endAddress = 32, onProgress = () => {}, onFound = () => {}, shouldStop = () => false) => withModbusConnection(async () => {
  const found = [];
  const total = endAddress - startAddress + 1;
  for (let unitId = startAddress; unitId <= endAddress; unitId += 1) {
    if (shouldStop()) break;
    onProgress({ current: unitId, start: startAddress, end: endAddress, total, percent: Math.round(((unitId - startAddress) / total) * 100) });
    try { const device = await readIdentity(unitId); found.push(device); onFound(device); }
    catch { /* no response or incomplete identity: continue scanning */ }
  }
  return { devices: found, stopped: shouldStop() };
});

export const updateDeviceIdentity = async (unitId, { deviceId, deviceName }) => {
  if (typeof deviceId !== 'string' || !/^\d{1,3}$/.test(deviceId) || Number(deviceId) < 1 || Number(deviceId) > 247)
    throw new RangeError('Device ID must be from 1 to 247 using at most 3 digits');
  if (typeof deviceName !== 'string' || !deviceName.trim() || deviceName.length > 18)
    throw new RangeError('Device name must contain 1 to 18 characters');
  const targetId = deviceId.padStart(3, '0');
  return withModbusConnection(async () => {
    const current = await readIdentity(unitId);
    if (current.deviceId !== targetId && Number(current.deviceId) !== unitId)
      throw new RangeError('Device address and ID registers differ; update the Edge firmware and rescan before changing its ID');
    const occupied = new Set((await deviceStore.list()).filter(device => device.unitId !== unitId).map(device => device.unitId));
    const steps = current.deviceId === targetId ? [] : planDeviceAddressChange(current.deviceId, targetId, occupied);
    const nameValues = encode(deviceName, appConfig.deviceIdentity.deviceName.length, 'Device name');
    const wait = () => new Promise(resolve => setTimeout(resolve, appConfig.deviceIdentity.writeDelayMs));
    // Save the name at the current address, then follow each accepted ID digit write.
    for (let index = 0; index < nameValues.length; index += 1) {
      await modbusClient.writeRegisterAtUnit(unitId, appConfig.deviceIdentity.deviceName.start + index, nameValues[index]);
      await wait();
    }
    let currentUnitId = unitId;
    for (const step of steps) {
      await modbusClient.writeRegisterAtUnit(currentUnitId, appConfig.deviceIdentity.deviceId.start + step.index, step.value);
      currentUnitId = step.unitId;
      await wait();
    }
    const verified = await readIdentity(currentUnitId);
    if (verified.deviceId !== targetId || verified.deviceName !== deviceName.trim()) throw new Error('Device identity readback did not match the requested values');
    return verified;
  });
};
