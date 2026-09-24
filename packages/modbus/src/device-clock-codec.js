const DATE_TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

const pad = (value) => String(value).padStart(2, '0');

export const parseDeviceDateTime = (value) => {
  if (typeof value !== 'string') throw new TypeError('dateTime must be a string');
  const match = DATE_TIME_PATTERN.exec(value);
  if (!match) throw new TypeError('dateTime must use YYYY-MM-DDTHH:mm:ss format');

  const [year, month, day, hour, minute, second = '00'] = match.slice(1).map(Number);
  if (year < 2000 || year > 2099) throw new RangeError('Device year must be from 2000 to 2099');
  if (hour > 23 || minute > 59 || second > 59) throw new RangeError('Device time is invalid');

  const candidate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  if (candidate.getUTCFullYear() !== year || candidate.getUTCMonth() !== month - 1 || candidate.getUTCDate() !== day) {
    throw new RangeError('Device date is invalid');
  }
  return { year, month, day, hour, minute, second };
};

export const registersToDeviceDateTime = (registers) => {
  if (!Array.isArray(registers) || registers.length < 6) {
    throw new TypeError('Six RTC registers are required');
  }
  const [hour, minute, second, day, month, yearValue] = registers.map(Number);
  const year = yearValue >= 100 ? yearValue : 2000 + yearValue;
  const fields = parseDeviceDateTime(`${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:${pad(second)}`);
  return { dateTime: `${fields.year}-${pad(fields.month)}-${pad(fields.day)}T${pad(fields.hour)}:${pad(fields.minute)}:${pad(fields.second)}`, ...fields };
};

export const deviceDateTimeWriteSequence = (value, startAddress = 15, updateAddress = 21) => {
  const fields = parseDeviceDateTime(value);
  return [
    { address: updateAddress, value: 1 },
    { address: startAddress + 4, value: fields.month },
    { address: startAddress + 5, value: fields.year - 2000 },
    { address: startAddress + 3, value: fields.day },
    { address: startAddress, value: fields.hour },
    { address: startAddress + 1, value: fields.minute },
    { address: startAddress + 2, value: fields.second },
  ];
};
