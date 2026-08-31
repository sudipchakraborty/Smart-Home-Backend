import { AppError } from '../../core/errors/app-error.js';
import { getDeviceClock, setDeviceClock } from './device-clock.service.js';

const handleClockError = (error) => {
  if (error instanceof TypeError || error instanceof RangeError) {
    throw new AppError(error.message, { statusCode: 400, code: 'INVALID_DEVICE_DATE_TIME' });
  }
  throw new AppError(`Device clock communication failed: ${error.message}`, {
    statusCode: 503,
    code: 'DEVICE_CLOCK_COMMUNICATION_FAILED',
  });
};

export const readDeviceClock = async (_request, response) => {
  try {
    response.json({ success: true, data: await getDeviceClock() });
  } catch (error) {
    handleClockError(error);
  }
};

export const writeDeviceClock = async (request, response) => {
  try {
    response.json({ success: true, data: await setDeviceClock(request.body?.dateTime) });
  } catch (error) {
    handleClockError(error);
  }
};
