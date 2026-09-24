import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

import { createApp } from '../src/app.js';

let baseUrl;
let server;

before(async () => {
  server = createApp().listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test('GET /api/health returns service health', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.data.service, 'smart-home-backend');
  assert.equal(body.data.status, 'healthy');
});

test('allows the frontend origin when opened through 127.0.0.1', async () => {
  const response = await fetch(`${baseUrl}/api/health`, { headers: { Origin: 'http://127.0.0.1:5173' } });
  assert.equal(response.headers.get('access-control-allow-origin'), 'http://127.0.0.1:5173');
});

test('GET / identifies the API and links to its health endpoint', async () => {
  const response = await fetch(baseUrl);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body, {
    success: true,
    data: {
      service: 'smart-home-backend',
      message: 'Smart Home Backend API is running',
      health: '/api/health',
    },
  });
});

test('GET /api/modbus/status reports configured port without opening it', async () => {
  const response = await fetch(`${baseUrl}/api/modbus/status`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.data.connected, false);
  assert.equal(body.data.path, 'COM9');
  assert.equal(body.data.unitId, 1);
});

test('relay schedule route rejects an unknown relay before hardware access', async () => {
  const response = await fetch(`${baseUrl}/api/relays/3/schedule`);
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.success, false);
  assert.equal(body.error.code, 'INVALID_RELAY');
});

test('device clock route validates input before hardware access', async () => {
  const response = await fetch(`${baseUrl}/api/device-clock`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dateTime: '2026-02-30T12:00:00' }),
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error.code, 'INVALID_DEVICE_DATE_TIME');
});

test('unknown route returns the standard error shape', async () => {
  const response = await fetch(`${baseUrl}/api/unknown`);
  const body = await response.json();

  assert.equal(response.status, 404);
  assert.deepEqual(body, {
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: 'Route not found: GET /api/unknown',
    },
  });
});
