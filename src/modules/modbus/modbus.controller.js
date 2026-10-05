import { AppError } from '../../core/errors/app-error.js';
import { getAvailableSerialPorts, modbusClient, withModbusExclusive } from './modbus.service.js';

const connectionError = (error) =>
  new AppError(`Unable to open Modbus port: ${error.message}`, {
    statusCode: 503,
    code: 'MODBUS_CONNECTION_FAILED',
  });

export const getStatus = (_request, response) => {
  response.json({ success: true, data: modbusClient.status });
};

export const listPorts = async (_request, response) => {
  response.json({ success: true, data: await getAvailableSerialPorts() });
};

export const connect = async (_request, response) => {
  try {
    response.json({ success: true, data: await withModbusExclusive(() => modbusClient.connect()) });
  } catch (error) {
    throw connectionError(error);
  }
};

export const disconnect = async (_request, response) => {
  await withModbusExclusive(() => modbusClient.disconnect());
  response.json({ success: true, data: modbusClient.status });
};
