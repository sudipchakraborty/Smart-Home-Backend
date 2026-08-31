# @smart-home/serial-port

Reusable serial communication utilities. It validates serial settings, lists available ports, and provides an event-based raw serial connection independent of Express and Modbus.

```js
import { SerialPortManager } from '@smart-home/serial-port';

const serial = new SerialPortManager({ path: 'COM15', baudRate: 9600 });
await serial.open();
await serial.write(Buffer.from([0x01]));
await serial.close();
```
