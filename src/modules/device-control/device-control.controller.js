import { AppError } from '../../core/errors/app-error.js';
import { appConfig } from '../../config/app-config.js';
import { modbusClient } from '../modbus/modbus.service.js';
import { createDeviceControlService } from './device-control.service.js';

const service = createDeviceControlService(modbusClient, appConfig.deviceControl);
const withConnection = async (operation) => {
  const wasConnected = modbusClient.isOpen;
  if (!wasConnected) await modbusClient.connect();
  try { return await operation(); } finally { if (!wasConnected) await modbusClient.disconnect(); }
};
const handleError = (error) => {
  if (error instanceof TypeError || error instanceof RangeError) throw new AppError(error.message, { statusCode: 502, code: 'INVALID_DEVICE_CONTROL_RESPONSE' });
  throw new AppError(`Device control communication failed: ${error.message}`, { statusCode: 503, code: 'DEVICE_CONTROL_COMMUNICATION_FAILED' });
};

export const resetDevice = async (_request, response) => {
  try { response.json({ success: true, data: await withConnection(service.reset) }); } catch (error) { handleError(error); }
};
export const readRelayStatus = async (_request, response) => {
  try { response.json({ success: true, data: await withConnection(service.readRelayStatus) }); } catch (error) { handleError(error); }
};
