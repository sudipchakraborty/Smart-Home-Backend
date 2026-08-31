import { EventEmitter } from 'node:events';

import { SerialPort } from 'serialport';

import { normalizeSerialSettings } from './serial-settings.js';

export class SerialPortManager extends EventEmitter {
  #port;

  constructor(settings) {
    super();
    this.settings = normalizeSerialSettings(settings);
  }

  static list() {
    return SerialPort.list();
  }

  get isOpen() {
    return this.#port?.isOpen ?? false;
  }

  async open() {
    if (this.isOpen) return;

    if (!this.#port) {
      this.#port = new SerialPort(this.settings);
      this.#port.on('data', (data) => this.emit('data', data));
      this.#port.on('error', (error) => this.emit('error', error));
      this.#port.on('close', () => this.emit('close'));
    }

    if (this.#port.isOpen) return;

    await new Promise((resolve, reject) => this.#port.open((error) => (error ? reject(error) : resolve())));
    await new Promise((resolve, reject) => {
      this.#port.set(
        { dtr: this.settings.dtr, rts: this.settings.rts },
        (error) => (error ? reject(error) : resolve()),
      );
    });
    this.emit('open');
  }

  async write(data) {
    if (!this.isOpen) throw new Error(`Serial port ${this.settings.path} is not open`);

    await new Promise((resolve, reject) => {
      this.#port.write(data, (writeError) => {
        if (writeError) return reject(writeError);
        this.#port.drain((drainError) => (drainError ? reject(drainError) : resolve()));
      });
    });
  }

  async close() {
    if (!this.#port?.isOpen) return;
    await new Promise((resolve, reject) => this.#port.close((error) => (error ? reject(error) : resolve())));
  }
}
