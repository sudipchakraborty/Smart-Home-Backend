# @smart-home/modbus

Reusable Modbus RTU client independent of the web framework. It supports connection lifecycle, coils, discrete inputs, holding/input registers, and single/multiple writes.

```js
import { ModbusRtuClient } from '@smart-home/modbus';

const client = new ModbusRtuClient({
  serialPort: { path: 'COM15', baudRate: 9600 },
  modbus: { unitId: 1, timeoutMs: 1000 },
});

await client.connect();
const response = await client.readHoldingRegisters(0, 10);
await client.disconnect();
```
