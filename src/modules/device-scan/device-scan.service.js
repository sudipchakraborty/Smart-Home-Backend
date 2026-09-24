import { appConfig } from '../../config/app-config.js';
import { modbusClient } from '../modbus/modbus.service.js';

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

export const scanDevices = async (startAddress = 1, endAddress = 32, onProgress = () => {}, onFound = () => {}, shouldStop = () => false) => {
  const wasConnected = modbusClient.isOpen;
  if (!wasConnected) await modbusClient.connect();
  const found = [];
  try {
    const total = endAddress - startAddress + 1;
    for (let unitId = startAddress; unitId <= endAddress; unitId += 1) {
      if (shouldStop()) break;
      onProgress({ current: unitId, start: startAddress, end: endAddress, total, percent: Math.round(((unitId - startAddress) / total) * 100) });
      try { const device = await readIdentity(unitId); found.push(device); onFound(device); } catch { /* no response or incomplete identity: continue scanning */ }
    }
    return { devices: found, stopped: shouldStop() };
  } finally { if (!wasConnected) await modbusClient.disconnect(); }
};

export const updateDeviceIdentity = async (unitId, { deviceId, deviceName }) => {
  const wasConnected = modbusClient.isOpen; if (!wasConnected) await modbusClient.connect();
  try {
    const idValues = encode(deviceId, appConfig.deviceIdentity.deviceId.length, 'Device ID');
    const nameValues = encode(deviceName, appConfig.deviceIdentity.deviceName.length, 'Device name');
    const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
    const writeIdentityRegister = async (address, value, isLast) => { await modbusClient.writeRegisterAtUnit(unitId, address, value); if (!isLast) await wait(appConfig.deviceIdentity.writeDelayMs); };
    for (let index = 0; index < idValues.length; index += 1) await writeIdentityRegister(appConfig.deviceIdentity.deviceId.start + index, idValues[index], false);
    for (let index = 0; index < nameValues.length; index += 1) await writeIdentityRegister(appConfig.deviceIdentity.deviceName.start + index, nameValues[index], index === nameValues.length - 1);
    return await readIdentity(unitId);
  } finally { if (!wasConnected) await modbusClient.disconnect(); }
};
