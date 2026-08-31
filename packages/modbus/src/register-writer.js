const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export const writeRegisterBlock = async (
  client,
  address,
  values,
  { mode = 'multiple-registers', delayMs = 0 } = {},
) => {
  if (!Number.isInteger(address) || address < 0) {
    throw new RangeError('Register address must be a non-negative integer');
  }
  if (!Array.isArray(values) || values.length === 0) {
    throw new TypeError('Register values must be a non-empty array');
  }

  if (mode === 'multiple-registers') {
    await client.writeRegisters(address, values);
    return;
  }

  if (mode !== 'single-register') {
    throw new TypeError('writeMode must be single-register or multiple-registers');
  }

  for (const [offset, value] of values.entries()) {
    await client.writeRegister(address + offset, value);
    if (delayMs > 0 && offset < values.length - 1) await wait(delayMs);
  }
};
