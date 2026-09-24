import { Router } from 'express';

import { healthRouter } from '../modules/health/health.routes.js';
import { deviceClockRouter } from '../modules/device-clock/device-clock.routes.js';
import { modbusRouter } from '../modules/modbus/modbus.routes.js';
import { relayScheduleRouter } from '../modules/relay-schedule/relay-schedule.routes.js';
import { outputAccessRouter } from '../modules/output-access/output-access.routes.js';
import { deviceScanRouter } from '../modules/device-scan/device-scan.routes.js';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/device-clock', deviceClockRouter);
apiRouter.use('/modbus', modbusRouter);
apiRouter.use('/relays', relayScheduleRouter);
apiRouter.use('/output-access', outputAccessRouter);
apiRouter.use('/devices/scan', deviceScanRouter);
apiRouter.use('/devices', deviceScanRouter);
