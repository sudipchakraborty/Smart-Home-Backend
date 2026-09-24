import { deviceDateTimeWriteSequence, registersToDeviceDateTime } from '@smart-home/modbus';

import { appConfig } from '../../config/app-config.js';
import { modbusClient } from '../modbus/modbus.service.js';

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const clockConfig = appConfig.deviceClock;

const withConnection = async (operation) => {
  const wasConnected = modbusClient.isOpen;
  if (!wasConnected) await modbusClient.connect();
  try {
    return await operation();
  } finally {
    if (!wasConnected) await modbusClient.disconnect();
  }
};

const readConnected = async () => {
  const response = await modbusClient.readHoldingRegisters(clockConfig.readStartRegister, clockConfig.registerCount);
  return registersToDeviceDateTime(response.data);
};

export const getDeviceClock = () => withConnection(readConnected);

export const setDeviceClock = (dateTime) => {
  const writes = deviceDateTimeWriteSequence(dateTime, clockConfig.writeStartRegister, clockConfig.updateRegister);
  return withConnection(async () => {
    for (const [index, write] of writes.entries()) {
      await modbusClient.writeRegister(write.address, write.value);
      if (clockConfig.writeDelayMs > 0 && index < writes.length - 1) await wait(clockConfig.writeDelayMs);
    }
    return readConnected();
  });
};
