const allowedDataBits = new Set([5, 6, 7, 8]);
const allowedStopBits = new Set([1, 1.5, 2]);
const allowedParity = new Set(['none', 'even', 'odd', 'mark', 'space']);

export const normalizeSerialSettings = (settings = {}) => {
  const normalized = {
    path: settings.path,
    baudRate: settings.baudRate ?? 9600,
    dataBits: settings.dataBits ?? 8,
    stopBits: settings.stopBits ?? 1,
    parity: settings.parity ?? 'none',
    rtscts: settings.rtscts ?? false,
    xon: settings.xon ?? false,
    xoff: settings.xoff ?? false,
    xany: settings.xany ?? false,
    dtr: settings.dtr ?? false,
    rts: settings.rts ?? false,
    autoOpen: settings.autoOpen ?? false,
  };

  if (typeof normalized.path !== 'string' || normalized.path.trim() === '') {
    throw new TypeError('serialPort.path must be a non-empty string');
  }

  if (!Number.isInteger(normalized.baudRate) || normalized.baudRate <= 0) {
    throw new TypeError('serialPort.baudRate must be a positive integer');
  }

  if (!allowedDataBits.has(normalized.dataBits)) {
    throw new TypeError('serialPort.dataBits must be 5, 6, 7, or 8');
  }

  if (!allowedStopBits.has(normalized.stopBits)) {
    throw new TypeError('serialPort.stopBits must be 1, 1.5, or 2');
  }

  if (!allowedParity.has(normalized.parity)) {
    throw new TypeError('serialPort.parity must be none, even, odd, mark, or space');
  }

  for (const setting of ['rtscts', 'xon', 'xoff', 'xany', 'dtr', 'rts', 'autoOpen']) {
    if (typeof normalized[setting] !== 'boolean') {
      throw new TypeError(`serialPort.${setting} must be a boolean`);
    }
  }

  return Object.freeze(normalized);
};
