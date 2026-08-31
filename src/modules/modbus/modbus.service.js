import { ModbusRtuClient } from '@smart-home/modbus';
import { SerialPortManager } from '@smart-home/serial-port';

import { appConfig } from '../../config/app-config.js';

export const modbusClient = new ModbusRtuClient(appConfig);

export const getAvailableSerialPorts = () => SerialPortManager.list();
