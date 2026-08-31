# Smart Home Backend

Modular Node.js/Express API for the Smart Home project. The runnable application is intentionally thin; reusable behavior is organized into independent feature modules.

## Requirements

- Node.js 20 or newer
- npm

## Run locally

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

The default API address is `http://127.0.0.1:4000`. Opening it returns basic service information. Check the detailed health endpoint with:

```powershell
Invoke-RestMethod http://127.0.0.1:4000/api/health
```

## Available endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/` | Confirm the API is running and discover the health URL |
| `GET` | `/api/health` | Return detailed service health and uptime |
| `GET` | `/api/modbus/status` | Show Modbus configuration and connection state |
| `GET` | `/api/modbus/ports` | List serial ports detected by Windows |
| `POST` | `/api/modbus/connect` | Open the configured Modbus RTU port |
| `POST` | `/api/modbus/disconnect` | Close the Modbus RTU port |
| `POST` | `/api/relays/1/on-time` | Set Relay 1 ON/start time using `HH:mm:ss` |
| `GET` | `/api/relays` | Read Relay 1 and Relay 2 schedules |
| `GET` | `/api/relays/:relay/schedule` | Read one relay's ON/OFF times |
| `PUT` | `/api/relays/:relay/schedule` | Update and verify one relay's ON/OFF times |

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start with automatic restart on source changes |
| `npm start` | Start normally |
| `npm test` | Run the backend tests |
| `npm run check` | Check the entrypoint syntax |

## Project structure

```text
config/
  config.json         Serial-port and Modbus RTU settings
packages/
  serial-port/        Reusable raw serial communication package
  modbus/             Reusable Modbus RTU package
src/
  config/             Environment and application configuration
  core/               Framework-level reusable helpers and middleware
  modules/            Independent business/feature modules
    health/           Health endpoint controller and routes
    modbus/           Thin HTTP adapter for the reusable Modbus package
  routes/             Central API module registration
  app.js              Express application composition
  server.js           Thin runnable process entrypoint
test/                 Automated tests
```

## Modbus RTU configuration

All Modbus port settings are kept in `config/config.json`. The initial port is `COM15`:

```json
{
  "serialPort": {
    "path": "COM15",
    "baudRate": 115200,
    "dataBits": 8,
    "stopBits": 1,
    "parity": "none",
    "dtr": false,
    "rts": false
  },
  "modbus": {
    "protocol": "ascii",
    "unitId": 1,
    "timeoutMs": 1000
  }
}
```

Change these values to match the connected Modbus device. The server does not open COM15 during startup; use `POST /api/modbus/connect` when communication should begin. This lets the API remain available for diagnostics even when the device is disconnected.

### Set Relay 1 ON time from Postman

Send `POST http://127.0.0.1:4000/api/relays/1/on-time`, select raw JSON, and set `Content-Type: application/json`:

```json
{
  "time": "17:18:19"
}
```

The endpoint converts this to `62299` seconds (`0x0000F35B`) and writes the device's low-word-first representation `[0xF35B, 0x0000]` beginning at zero-based holding-register address `1`. ModScan displays these as `40002` and `40003`. Close ModScan before sending the request because only one process can own COM15 at a time.

Relay addresses, 32-bit word order, and write mode are under `relaySchedule` in `config/config.json`. The default `single-register` mode sends two function-06 writes because many embedded Modbus slaves do not implement function 16. Change it to `multiple-registers` when the firmware supports function 16. Change `wordOrder` to `low-high` if the firmware stores the low 16-bit word first.

### Read or update either relay

Read Relay 2 with `GET /api/relays/2/schedule`. Update it with:

```http
PUT /api/relays/2/schedule
Content-Type: application/json
```

```json
{
  "onTime": "08:30:00",
  "offTime": "21:45:00"
}
```

Both values are validated before communication begins. After writing, the backend reads the registers again and returns the device-confirmed schedule.

The packages are independent of Express:

- `@smart-home/serial-port` provides validated serial settings, port discovery, and raw serial read/write lifecycle.
- `@smart-home/modbus` consumes serial settings and provides Modbus RTU coil/register read and write operations.

Each package has its own README and public `src/index.js`, so it can be moved into another Node.js workspace with minimal integration work.

## Adding a feature module

Create a folder under `src/modules/<feature>/`. Keep its routes, controller, service, repository, validation, and model files together as needed. Export its router and register that router once in `src/routes/index.js`. A module should depend on a small public interface so it can be moved to another Node.js project without copying application-specific startup code.

## API response convention

Successful responses use:

```json
{ "success": true, "data": {} }
```

Errors use:

```json
{
  "success": false,
  "error": { "code": "ERROR_CODE", "message": "Readable message" }
}
```

## Environment variables

Copy `.env.example` to `.env`. Never commit `.env` or credentials.

| Variable | Default | Description |
| --- | --- | --- |
| `NODE_ENV` | `development` | Runtime environment |
| `HOST` | `127.0.0.1` | Bind address |
| `PORT` | `4000` | HTTP port |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed frontend origin |

## Current progress

- [x] Initial Node.js/Express project
- [x] Environment configuration
- [x] Security, CORS, parsing, and standardized error middleware
- [x] Modular health feature
- [x] Root service information endpoint
- [x] Health and error-path tests
- [x] Reusable serial-port communication package
- [x] Reusable Modbus RTU package with COM15 configuration
- [x] Reusable time-to-register codec and Relay 1 ON-time endpoint
- [x] Relay 1/2 schedule read, update, and device readback routes
- [x] Modbus status, port discovery, connect, and disconnect API
- [x] COM15 detected and opened as an FTDI USB serial port at 115200 baud
- [x] Live Modbus ASCII read confirmed on COM15 at 115200 8-N-1 with DTR/RTS disabled
- [x] Relay 1 ON time `17:18:19` written and read back as `[0xF35B, 0x0000]`
- [ ] Authentication and users
- [ ] Homes, rooms, devices, and automation rules
- [ ] Database and migrations
- [ ] Real-time device events
