import { Router } from 'express';

import { asyncHandler } from '../../core/http/async-handler.js';
import {
  listRelaySchedules,
  readRelaySchedule,
  setRelay1OnTime,
  writeRelaySchedule,
} from './relay-schedule.controller.js';

export const relayScheduleRouter = Router();

relayScheduleRouter.post('/1/on-time', asyncHandler(setRelay1OnTime));
relayScheduleRouter.get('/', asyncHandler(listRelaySchedules));
relayScheduleRouter.get('/:relayNumber/schedule', asyncHandler(readRelaySchedule));
relayScheduleRouter.put('/:relayNumber/schedule', asyncHandler(writeRelaySchedule));
