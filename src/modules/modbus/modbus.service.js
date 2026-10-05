import { ModbusRtuClient } from '@smart-home/modbus';
import { SerialPortManager } from '@smart-home/serial-port';

import { appConfig } from '../../config/app-config.js';
import { createModbusSession } from './modbus-session.js';

export const transportClient = new ModbusRtuClient(appConfig);
const session = createModbusSession(transportClient);
export const modbusClient = session.client;
export const withModbusConnection = session.withConnection;
export const withModbusExclusive = session.exclusive;
export const targetDevice = (request, response, next) => {
  if (request.query.unitId === undefined) return next();
  const unitId = Number(request.query.unitId);
  if (!/^\d{1,3}$/.test(String(request.query.unitId)) || !Number.isInteger(unitId) || unitId < 1 || unitId > 247)
    return response.status(400).json({ success: false, error: { code: 'INVALID_UNIT_ID', message: 'Device address must be from 1 to 247' } });
  session.atUnit(unitId, next);
};

export const getAvailableSerialPorts = () => SerialPortManager.list();
