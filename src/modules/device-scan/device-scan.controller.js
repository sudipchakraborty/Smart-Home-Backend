import { scanDevices, updateDeviceIdentity } from './device-scan.service.js';

export const scanModbusDevices = async (request, response) => {
  const startAddress = Number(request.body?.startAddress ?? 1);
  const endAddress = Number(request.body?.endAddress ?? 32);
  if (!Number.isInteger(startAddress) || !Number.isInteger(endAddress) || startAddress < 0 || endAddress > 255 || startAddress > endAddress) {
    return response.status(400).json({ success: false, error: { code: 'INVALID_SCAN_RANGE', message: 'Scan addresses must be integers from 0 to 255, with start no greater than end' } });
  }
  request.app.locals.scanStop = false;
  request.app.locals.scanResults = [];
  const result = await scanDevices(startAddress, endAddress, (update) => { request.app.locals.scanProgress = update; }, (device) => { request.app.locals.scanResults.push(device); }, () => request.app.locals.scanStop);
  request.app.locals.scanProgress = null;
  response.json({ success: true, data: result.devices, stopped: result.stopped });
};

export const getScanProgress = (request, response) => response.json({ success: true, data: { progress: request.app.locals.scanProgress, devices: request.app.locals.scanResults ?? [] } });

export const stopModbusScan = (request, response) => { request.app.locals.scanStop = true; response.json({ success: true, data: { stopped: true } }); };

export const updateScannedDevice = async (request, response) => {
  const unitId = Number(request.params.unitId);
  if (!Number.isInteger(unitId) || unitId < 0 || unitId > 255) return response.status(400).json({ success: false, error: { code: 'INVALID_UNIT_ID', message: 'Unit ID must be from 0 to 255' } });
  response.json({ success: true, data: await updateDeviceIdentity(unitId, request.body ?? {}) });
};
