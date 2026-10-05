import { Router } from 'express';
import { asyncHandler } from '../../core/http/async-handler.js';
import { getScanProgress, scanModbusDevices, stopModbusScan, updateScannedDevice, listSavedDevices } from './device-scan.controller.js';

export const deviceScanRouter = Router();
deviceScanRouter.get('/saved', asyncHandler(listSavedDevices));
deviceScanRouter.post('/', asyncHandler(scanModbusDevices));
deviceScanRouter.get('/progress', getScanProgress);
deviceScanRouter.delete('/', stopModbusScan);
deviceScanRouter.put('/:unitId', asyncHandler(updateScannedDevice));
