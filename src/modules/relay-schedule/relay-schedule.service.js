import { registersToTime, timeToRegisters, writeRegisterBlock } from '@smart-home/modbus';

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

const writeEncodedTime = (address, encoded) =>
  writeRegisterBlock(modbusClient, address, encoded.registers, {
    mode: appConfig.relaySchedule.writeMode,
    delayMs: appConfig.relaySchedule.writeDelayMs,
  });

const readTime = async (address) => {
  const response = await modbusClient.readHoldingRegisters(address, 2);
  return registersToTime(response.data, appConfig.relaySchedule.wordOrder);
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
  const encodedOnTime = timeToRegisters(onTime, appConfig.relaySchedule.wordOrder);
  const encodedOffTime = timeToRegisters(offTime, appConfig.relaySchedule.wordOrder);

  return withConnection(async () => {
    await writeEncodedTime(relay.startTime, encodedOnTime);
    await writeEncodedTime(relay.endTime, encodedOffTime);
    return readRelayScheduleConnected(relayNumber);
  });
};

export const setRelayTime = async (relayNumber, field, time) => {
  const relay = getRelayConfig(relayNumber);
  const address = relay[field];
  if (!Number.isInteger(address)) throw new RangeError(`Relay field ${field} is not configured`);
  const encoded = timeToRegisters(time, appConfig.relaySchedule.wordOrder);

  return withConnection(async () => {
    await writeEncodedTime(address, encoded);
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
