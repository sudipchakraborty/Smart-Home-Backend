import { Router } from 'express';

import { healthRouter } from '../modules/health/health.routes.js';
import { modbusRouter } from '../modules/modbus/modbus.routes.js';
import { relayScheduleRouter } from '../modules/relay-schedule/relay-schedule.routes.js';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/modbus', modbusRouter);
apiRouter.use('/relays', relayScheduleRouter);
