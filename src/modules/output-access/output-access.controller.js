import { AppError } from '../../core/errors/app-error.js';
import { appConfig } from '../../config/app-config.js';
import { modbusClient } from '../modbus/modbus.service.js';
import { createOutputAccessService } from './output-access.service.js';

const service = createOutputAccessService(modbusClient, appConfig.outputAccess);
const withConnection = async (operation) => {
  const wasConnected = modbusClient.isOpen;
  if (!wasConnected) await modbusClient.connect();
  try { return await operation(); } finally { if (!wasConnected) await modbusClient.disconnect(); }
};
const handleError = (error) => {
  if (error instanceof TypeError || error instanceof RangeError) throw new AppError(error.message, { statusCode: 400, code: 'INVALID_OUTPUT_ACCESS' });
  throw new AppError(`Output communication failed: ${error.message}`, { statusCode: 503, code: 'OUTPUT_COMMUNICATION_FAILED' });
};
export const readOutputs = async (_request, response) => { try { response.json({ success: true, data: await withConnection(service.read) }); } catch (error) { handleError(error); } };
export const updateOutput = async (request, response) => {
  try {
    if (!service.hasOutput(request.params.outputName)) throw new RangeError(`Unknown output: ${request.params.outputName}`);
    response.json({ success: true, data: await withConnection(() => service.updateOutput(request.params.outputName, request.body?.enabled)) });
  } catch (error) { handleError(error); }
};
