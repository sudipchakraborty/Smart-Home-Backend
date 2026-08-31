import { AppError } from '../../core/errors/app-error.js';
import {
  getAllRelaySchedules,
  getRelaySchedule,
  setRelayTime,
  updateRelaySchedule,
} from './relay-schedule.service.js';

const parseRelayNumber = (value) => {
  const relayNumber = Number(value);
  if (!Number.isInteger(relayNumber) || relayNumber < 1 || relayNumber > 2) {
    throw new AppError('Relay must be 1 or 2', { statusCode: 400, code: 'INVALID_RELAY' });
  }
  return relayNumber;
};

const handleRelayError = (error) => {
  if (error instanceof AppError) throw error;
  if (error instanceof TypeError || error instanceof RangeError) {
    throw new AppError(error.message, { statusCode: 400, code: 'INVALID_RELAY_SCHEDULE' });
  }
  throw new AppError(`Relay communication failed: ${error.message}`, {
    statusCode: 503,
    code: 'RELAY_COMMUNICATION_FAILED',
  });
};

export const listRelaySchedules = async (_request, response) => {
  try {
    response.json({ success: true, data: await getAllRelaySchedules() });
  } catch (error) {
    handleRelayError(error);
  }
};

export const readRelaySchedule = async (request, response) => {
  try {
    const relayNumber = parseRelayNumber(request.params.relayNumber);
    response.json({ success: true, data: await getRelaySchedule(relayNumber) });
  } catch (error) {
    handleRelayError(error);
  }
};

export const writeRelaySchedule = async (request, response) => {
  try {
    const relayNumber = parseRelayNumber(request.params.relayNumber);
    const { onTime, offTime } = request.body ?? {};
    response.json({ success: true, data: await updateRelaySchedule(relayNumber, { onTime, offTime }) });
  } catch (error) {
    handleRelayError(error);
  }
};

export const setRelay1OnTime = async (request, response) => {
  try {
    response.json({ success: true, data: await setRelayTime(1, 'startTime', request.body?.time) });
  } catch (error) {
    handleRelayError(error);
  }
};
