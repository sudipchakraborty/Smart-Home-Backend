const bitMask = (value) => {
  if (!Number.isInteger(value) || value <= 0 || value > 0xffff) throw new RangeError('Output bit mask is invalid');
  return value;
};

export const createOutputAccessService = (client, config) => {
  const outputs = Object.freeze(Object.fromEntries(Object.entries(config.outputs).map(([name, mask]) => [name, bitMask(mask)])));
  const read = async () => {
    const response = await client.readHoldingRegisters(config.outputRegister, 1);
    const value = response.data?.[0];
    if (!Number.isInteger(value) || value < 0 || value > 0xffff) throw new RangeError('Output register response is invalid');
    return Object.fromEntries(Object.entries(outputs).map(([name, mask]) => [name, (value & mask) === mask]));
  };
  const updateOutput = async (name, enabled) => {
    if (!(name in outputs)) throw new RangeError(`Unknown output: ${name}`);
    if (typeof enabled !== 'boolean') throw new TypeError('enabled must be boolean');
    const current = await client.readHoldingRegisters(config.outputRegister, 1);
    const value = current.data?.[0];
    if (!Number.isInteger(value)) throw new RangeError('Output register response is invalid');
    const next = enabled ? value | outputs[name] : value & ~outputs[name];
    await client.writeRegister(config.outputRegister, next);
    return read();
  };
  return { read, updateOutput, hasOutput: (name) => name in outputs };
};
