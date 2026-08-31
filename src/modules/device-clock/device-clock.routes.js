import { Router } from 'express';

import { asyncHandler } from '../../core/http/async-handler.js';
import { readDeviceClock, writeDeviceClock } from './device-clock.controller.js';

export const deviceClockRouter = Router();

deviceClockRouter.get('/', asyncHandler(readDeviceClock));
deviceClockRouter.put('/', asyncHandler(writeDeviceClock));
