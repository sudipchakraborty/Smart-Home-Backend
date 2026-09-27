const RESET_COMMAND = 'RESET';

const decodeRelay = (value) => {
  if (value === 79) return true;
  if (value === 70) return false;
  throw new RangeError(`Invalid relay status value: ${value}`);
};

export const createDeviceControlService = (client, config) => {
  const reset = async () => {
    for (const [offset, character] of [...RESET_COMMAND].entries()) {
      await client.writeRegister(config.resetRegister + offset, character.charCodeAt(0));
    }
    return { accepted: true };
  };

  const readRelayStatus = async () => {
    const response = await client.readHoldingRegisters(config.relayStatusRegister, 2);
    const values = response.data;
    if (!Array.isArray(values) || values.length < 2) throw new RangeError('Relay status response is invalid');
    return { relay1: decodeRelay(values[0]), relay2: decodeRelay(values[1]) };
  };

  return { reset, readRelayStatus };
};
