## 2026-09-24 - Planned frontend/backend Modbus device controls

- Scope: backend and frontend only; `Smart-Home-Edge` remains unchanged because it is the PlatformIO firmware project.
- Register contract from `Modbus Register Map.pptx`: output register `0`; Relay 1 schedule `1..7`; Relay 2 schedule `8..14`; RTC write `15..21`; RTC read `22..27`.
- Backend files expected to change: `config/config.json`, Modbus output service/controller/routes, device-clock configuration/service tests, and API tests.
- Frontend files expected to change: output API/hook/component, `App.jsx`, `App.css`, and frontend progress documentation.
- Verification planned: backend tests, frontend lint/build, and startup checks for both development servers. Serial hardware read/write remains pending unless COM15 is available.

## 2026-09-24 - Backend Modbus device controls implemented

- Updated `config/config.json` to match the supplied map: relay HH/MM/SS fields `1..6` and `8..13`, update triggers `7` and `14`, RTC write `15..20` with trigger `21`, RTC read `22..27`, and output register `0`.
- Added `src/modules/output-access/` for read-modify-write output control with bit preservation and API validation at `/api/output-access`.
- Updated relay scheduling to write individual HH/MM/SS registers and trigger the edge update register.
- Updated the device-clock write sequence to the supplied RTC register map.
- Validation: backend `npm test` PASS (`22/22`), `npm run check` PASS, `/api/health` returned HTTP 200 while the development server ran on port 4000.
- COM15 serial read/write remains hardware-unverified in this environment.

## 2026-09-24 - Fixed frontend COM15 read failure

- Root cause 1: frontend default origin was `http://127.0.0.1:5173`, but backend CORS allowed only `http://localhost:5173`; browser requests were blocked even though direct API requests worked.
- Root cause 2: edge read-only RTC register `27` contains the full year (`2026`), while the backend decoder only accepted the two-digit form (`26`).
- Fixed CORS to allow both local development origins and updated RTC decoding to accept both full and two-digit years.
- Live verification: `GET /api/device-clock` through COM15 returned HTTP 200 with `2026-09-24T16:18:07`.
- Validation: backend `npm test` PASS (`23/23`), `npm run check` PASS.

## 2026-09-24 - Planned Modbus slave-ID scan

- Replace the status-only frontend scan with a real Modbus slave-ID probe from `0` through `255`.
- For each responding slave, read the configured identity registers and return device name, device ID, product ID, and serial number for the table.
- Add scan progress reporting so the frontend can display the current address and percentage while the scan is active.
- Edge firmware remains unchanged.

## 2026-09-24 - Backend Modbus slave scan implemented

- Added `POST /api/devices/scan` to probe unit IDs `0..255` and read identity registers `29..90` for responding devices.
- Added `GET /api/devices/scan/progress` for frontend scan progress polling.
- Added temporary unit-ID selection to the Modbus client; no edge firmware changes.

## 2026-09-24 - Configurable fast slave scan

- Scan API now accepts `startAddress` and `endAddress`, validates the range `0..255`, and defaults to `1..32`.
- Each slave probe uses a one-second timeout so an unresponsive address does not stall the whole scan.
- Progress totals now reflect the selected address range.

- Probe calls now restore the configured Modbus unit ID and normal timeout after every address, so scanning cannot redirect later relay/RTC operations.

## 2026-09-24 - Planned realtime scan results and identity editing

- Scan progress polling will include devices as soon as each slave responds, rather than waiting for the full scan.
- Clicking a scanned row will expose editable device ID and device name fields.
- Backend will write and read back identity registers `29..31` and `32..50`.

## 2026-09-24 - Realtime scan results and identity update implemented

- Scan progress now includes the devices found so far; frontend rows appear during the scan.
- Added `PUT /api/devices/:unitId` to write and read back device ID/name identity fields.

## 2026-09-24 - Fixed backend disconnect during identity update

- Root cause: `updateDeviceIdentity` returned the asynchronous readback without `await`; its `finally` disconnected COM15 before readback completed.
- Fixed the transaction to await identity readback before connection cleanup.
- Added a configured inter-register delay for EEPROM-backed identity writes.

## 2026-09-24 - Planned cancellable Modbus scan

- Add a stop endpoint and cancellation flag checked between slave-ID probes.
- Preserve devices already found when a scan is stopped.

## 2026-09-24 - Cancellable Modbus scan implemented

- Added `DELETE /api/devices/scan` to request scan cancellation.
- Backend checks the stop flag between slave-ID probes and returns already-found devices.
