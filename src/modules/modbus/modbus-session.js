import { AsyncLocalStorage } from 'node:async_hooks';

// Keep the selected address request-local and serialize complete serial operations.
export const createModbusSession = (transport) => {
  const target = new AsyncLocalStorage();
  let pending = Promise.resolve();
  const client = new Proxy(transport, {
    get(object, property) {
      const unitId = target.getStore();
      if (property === 'readHoldingRegisters' && unitId !== undefined)
        return (address, length) => object.readHoldingRegistersAtUnit(unitId, address, length);
      if (property === 'writeRegister' && unitId !== undefined)
        return (address, value) => object.writeRegisterAtUnit(unitId, address, value);
      const value = Reflect.get(object, property, object);
      return typeof value === 'function' ? value.bind(object) : value;
    },
  });
  const exclusive = (operation) => {
    const result = pending.then(operation);
    pending = result.catch(() => {});
    return result;
  };
  const withConnection = (operation) => exclusive(async () => {
    const wasConnected = transport.isOpen;
    if (!wasConnected) await transport.connect();
    try { return await operation(); }
    finally { if (!wasConnected) await transport.disconnect(); }
  });
  return { client, withConnection, exclusive, atUnit: (unitId, operation) => target.run(unitId, operation) };
};
