import { Router } from 'express';

import { asyncHandler } from '../../core/http/async-handler.js';
import { connect, disconnect, getStatus, listPorts } from './modbus.controller.js';

export const modbusRouter = Router();

modbusRouter.get('/status', getStatus);
modbusRouter.get('/ports', asyncHandler(listPorts));
modbusRouter.post('/connect', asyncHandler(connect));
modbusRouter.post('/disconnect', asyncHandler(disconnect));
