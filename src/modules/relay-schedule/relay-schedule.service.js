import { parseDeviceDateTime } from '@smart-home/modbus';

import { appConfig } from '../../config/app-config.js';
import { modbusClient } from '../modbus/modbus.service.js';

const getRelayConfig = (relayNumber) => {
  const relay = appConfig.relaySchedule.registers[`relay${relayNumber}`];
  if (!relay) throw new RangeError(`Relay ${relayNumber} is not configured`);
  return relay;
};

const withConnection = async (operation) => {
  const wasConnected = modbusClient.isOpen;
  if (!wasConnected) await modbusClient.connect();

  try {
    return await operation();
  } finally {
    if (!wasConnected) await modbusClient.disconnect();
  }
};

const parseTime = (time) => {
  if (typeof time !== 'string' || !/^\d{2}:\d{2}:\d{2}$/.test(time)) throw new TypeError('Time must use HH:mm:ss format');
  const [hours, minutes, seconds] = time.split(':').map(Number);
  if (hours > 23 || minutes > 59 || seconds > 59) throw new RangeError('Time must be between 00:00:00 and 23:59:59');
  return [hours, minutes, seconds];
};
const writeTime = async (addresses, time) => {
  const values = parseTime(time);
  for (let index = 0; index < addresses.length; index += 1) {
    await modbusClient.writeRegister(addresses[index], values[index]);
    if (appConfig.relaySchedule.writeDelayMs > 0 && index < addresses.length - 1) await wait(appConfig.relaySchedule.writeDelayMs);
  }
};

const readTime = async (address) => {
  const response = await modbusClient.readHoldingRegisters(address[0], 3);
  const [hours, minutes, seconds] = response.data;
  if (hours > 23 || minutes > 59 || seconds > 59) throw new RangeError('Device returned an invalid time');
  return { time: [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':'), hours, minutes, seconds };
};

const readRelayScheduleConnected = async (relayNumber) => {
  const relay = getRelayConfig(relayNumber);
  const onTime = await readTime(relay.startTime);
  const offTime = await readTime(relay.endTime);
  return { relay: relayNumber, onTime, offTime };
};

export const getRelaySchedule = (relayNumber) =>
  withConnection(() => readRelayScheduleConnected(relayNumber));

export const getAllRelaySchedules = () =>
  withConnection(async () => {
    const relayNumbers = Object.keys(appConfig.relaySchedule.registers)
      .map((key) => Number(key.replace('relay', '')));
    const schedules = [];
    for (const relayNumber of relayNumbers) {
      schedules.push(await readRelayScheduleConnected(relayNumber));
    }
    return schedules;
  });

export const updateRelaySchedule = async (relayNumber, { onTime, offTime }) => {
  const relay = getRelayConfig(relayNumber);
  return withConnection(async () => {
    await writeTime(relay.startTime, onTime);
    await writeTime(relay.endTime, offTime);
    await modbusClient.writeRegister(relay.update, 1);
    return readRelayScheduleConnected(relayNumber);
  });
};

export const setRelayTime = async (relayNumber, field, time) => {
  const relay = getRelayConfig(relayNumber);
  const address = relay[field];
  if (!Number.isInteger(address)) throw new RangeError(`Relay field ${field} is not configured`);
  return withConnection(async () => {
    await writeTime(address, time);
    return {
      relay: relayNumber,
      field,
      address,
      wordOrder: appConfig.relaySchedule.wordOrder,
      writeMode: appConfig.relaySchedule.writeMode,
      ...await readTime(address),
    };
  });
};
