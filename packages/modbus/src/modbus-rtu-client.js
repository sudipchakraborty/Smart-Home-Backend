import { EventEmitter } from 'node:events';

import ModbusRTU from 'modbus-serial';
import { normalizeSerialSettings } from '@smart-home/serial-port';

export class ModbusRtuClient extends EventEmitter {
  #client;

  constructor({ serialPort, modbus = {} }) {
    super();
    this.serialSettings = normalizeSerialSettings({ ...serialPort, autoOpen: false });
    this.settings = Object.freeze({
      protocol: modbus.protocol ?? 'rtu',
      unitId: modbus.unitId ?? 1,
      timeoutMs: modbus.timeoutMs ?? 1000,
    });

    if (!Number.isInteger(this.settings.unitId) || this.settings.unitId < 1 || this.settings.unitId > 247) {
      throw new TypeError('modbus.unitId must be an integer from 1 to 247');
    }
    if (!Number.isInteger(this.settings.timeoutMs) || this.settings.timeoutMs <= 0) {
      throw new TypeError('modbus.timeoutMs must be a positive integer');
    }
    if (!['rtu', 'ascii'].includes(this.settings.protocol)) {
      throw new TypeError('modbus.protocol must be rtu or ascii');
    }
  }

  get isOpen() {
    return this.#client?.isOpen ?? false;
  }

  get status() {
    return {
      connected: this.isOpen,
      path: this.serialSettings.path,
      baudRate: this.serialSettings.baudRate,
      protocol: this.settings.protocol,
      unitId: this.settings.unitId,
      timeoutMs: this.settings.timeoutMs,
    };
  }

  async connect() {
    if (this.isOpen) return this.status;

    const client = new ModbusRTU();
    client.setID(this.settings.unitId);
    client.setTimeout(this.settings.timeoutMs);

    try {
      await new Promise((resolve, reject) => {
        const connect = this.settings.protocol === 'ascii'
          ? client.connectAsciiSerial.bind(client)
          : client.connectRTUBuffered.bind(client);

        connect(this.serialSettings.path, {
          baudRate: this.serialSettings.baudRate,
          dataBits: this.serialSettings.dataBits,
          stopBits: this.serialSettings.stopBits,
          parity: this.serialSettings.parity,
        }, (error) => (error ? reject(error) : resolve()));
      });
      await new Promise((resolve, reject) => {
        client._port._client.set(
          { dtr: this.serialSettings.dtr, rts: this.serialSettings.rts },
          (error) => (error ? reject(error) : resolve()),
        );
      });
      this.#client = client;
      this.emit('connected', this.status);
      return this.status;
    } catch (error) {
      await this.#closeClient(client);
      this.emit('connectionError', error);
      throw error;
    }
  }

  async disconnect() {
    if (!this.#client) return;
    const client = this.#client;
    this.#client = undefined;
    await this.#closeClient(client);
    this.emit('disconnected');
  }

  readCoils(address, length) {
    return this.#execute('readCoils', address, length);
  }

  readDiscreteInputs(address, length) {
    return this.#execute('readDiscreteInputs', address, length);
  }

  readHoldingRegisters(address, length) {
    return this.#execute('readHoldingRegisters', address, length);
  }

  readInputRegisters(address, length) {
    return this.#execute('readInputRegisters', address, length);
  }

  writeCoil(address, value) {
    return this.#execute('writeCoil', address, value);
  }

  writeRegister(address, value) {
    return this.#execute('writeRegister', address, value);
  }

  writeCoils(address, values) {
    return this.#execute('writeCoils', address, values);
  }

  writeRegisters(address, values) {
    return this.#execute('writeRegisters', address, values);
  }

  async #execute(method, ...parameters) {
    if (!this.isOpen) throw new Error(`Modbus port ${this.serialSettings.path} is not connected`);
    return this.#client[method](...parameters);
  }

  async #closeClient(client) {
    if (!client?.isOpen) return;
    await new Promise((resolve) => client.close(() => resolve()));
  }
}
