import { scanDevices, updateDeviceIdentity } from './device-scan.service.js';
import { deviceStore } from './device-store.js';
import { appConfig } from '../../config/app-config.js';
import { AppError } from '../../core/errors/app-error.js';

export const listSavedDevices = async (_request, response) => response.json({ success: true,
  data: { devices: await deviceStore.list(), serialPort: appConfig.serialPort.path } });

export const scanModbusDevices = async (request, response) => {
  const startAddress = Number(request.body?.startAddress ?? 1);
  const endAddress = Number(request.body?.endAddress ?? 32);
  if (!Number.isInteger(startAddress) || !Number.isInteger(endAddress) || startAddress < 0 || endAddress > 255 || startAddress > endAddress) {
    return response.status(400).json({ success: false, error: { code: 'INVALID_SCAN_RANGE', message: 'Scan addresses must be integers from 0 to 255, with start no greater than end' } });
  }
  if (request.app.locals.scanRunning) return response.status(409).json({ success: false, error: { code: 'SCAN_IN_PROGRESS', message: 'A device scan is already running' } });
  request.app.locals.scanRunning = true;
  request.app.locals.scanStop = false;
  request.app.locals.scanResults = [];
  try {
    const result = await scanDevices(startAddress, endAddress, (update) => { request.app.locals.scanProgress = update; }, (device) => { request.app.locals.scanResults.push(device); }, () => request.app.locals.scanStop);
    await deviceStore.merge(result.devices.filter((device) => device.unitId >= 1 && device.unitId <= 247));
    response.json({ success: true, data: result.devices, stopped: result.stopped });
  } finally { request.app.locals.scanProgress = null; request.app.locals.scanRunning = false; }
};

export const getScanProgress = (request, response) => response.json({ success: true, data: { progress: request.app.locals.scanProgress, devices: request.app.locals.scanResults ?? [] } });

export const stopModbusScan = (request, response) => { request.app.locals.scanStop = true; response.json({ success: true, data: { stopped: true } }); };

export const updateScannedDevice = async (request, response) => {
  const unitId = Number(request.params.unitId);
  if (!Number.isInteger(unitId) || unitId < 1 || unitId > 247) return response.status(400).json({ success: false, error: { code: 'INVALID_UNIT_ID', message: 'Unit ID must be from 1 to 247' } });
  let device;
  try { device = await updateDeviceIdentity(unitId, request.body ?? {}); }
  catch (error) { if (error instanceof RangeError || error instanceof TypeError) throw new AppError(error.message, { statusCode: 400, code: 'INVALID_DEVICE_IDENTITY' }); throw error; }
  await deviceStore.replace(unitId, device);
  response.json({ success: true, data: device });
};
