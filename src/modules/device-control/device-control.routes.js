import { Router } from 'express';

import { asyncHandler } from '../../core/http/async-handler.js';
import { readRelayStatus, resetDevice } from './device-control.controller.js';

export const deviceControlRouter = Router();
deviceControlRouter.get('/relay-status', asyncHandler(readRelayStatus));
deviceControlRouter.post('/reset', asyncHandler(resetDevice));
