const TIME_PATTERN = /^(\d{2}):(\d{2}):(\d{2})$/;

export const timeToSeconds = (time) => {
  const match = TIME_PATTERN.exec(time);
  if (!match) throw new TypeError('Time must use HH:mm:ss format');

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);

  if (hours > 23 || minutes > 59 || seconds > 59) {
    throw new RangeError('Time must be between 00:00:00 and 23:59:59');
  }

  return hours * 3600 + minutes * 60 + seconds;
};

export const uint32ToRegisters = (value, wordOrder = 'high-low') => {
  if (!Number.isInteger(value) || value < 0 || value > 0xffffffff) {
    throw new RangeError('Register value must be an unsigned 32-bit integer');
  }

  const highWord = Math.floor(value / 0x10000);
  const lowWord = value & 0xffff;

  if (wordOrder === 'high-low') return [highWord, lowWord];
  if (wordOrder === 'low-high') return [lowWord, highWord];
  throw new TypeError('wordOrder must be high-low or low-high');
};

export const timeToRegisters = (time, wordOrder) => {
  const totalSeconds = timeToSeconds(time);
  return { time, totalSeconds, registers: uint32ToRegisters(totalSeconds, wordOrder) };
};

export const registersToUint32 = (registers, wordOrder = 'high-low') => {
  if (!Array.isArray(registers) || registers.length !== 2) {
    throw new TypeError('Exactly two 16-bit registers are required');
  }
  if (registers.some((value) => !Number.isInteger(value) || value < 0 || value > 0xffff)) {
    throw new RangeError('Each register must be an unsigned 16-bit integer');
  }

  const [first, second] = registers;
  if (wordOrder === 'high-low') return first * 0x10000 + second;
  if (wordOrder === 'low-high') return second * 0x10000 + first;
  throw new TypeError('wordOrder must be high-low or low-high');
};

export const secondsToTime = (totalSeconds) => {
  if (!Number.isInteger(totalSeconds) || totalSeconds < 0 || totalSeconds > 86399) {
    throw new RangeError('Time value must be between 0 and 86399 seconds');
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
};

export const registersToTime = (registers, wordOrder) => {
  const totalSeconds = registersToUint32(registers, wordOrder);
  return { time: secondsToTime(totalSeconds), totalSeconds, registers };
};
