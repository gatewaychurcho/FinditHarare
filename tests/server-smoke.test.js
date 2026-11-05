const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');

const server = require('../server.js');
let baseUrl;

before(async () => {
  await new Promise((resolve, reject) => {
    const onError = (error) => {
      server.off('listening', onListening);
      reject(error);
    };
    const onListening = () => {
      server.off('error', onError);
      resolve();
    };
    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(0, '127.0.0.1');
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test('serves the app and admin dashboard', async () => {
  const [appResponse, adminResponse] = await Promise.all([
    fetch(`${baseUrl}/`),
    fetch(`${baseUrl}/admin`)
  ]);
  const [appHtml, adminHtml] = await Promise.all([
    appResponse.text(),
    adminResponse.text()
  ]);

  assert.equal(appResponse.status, 200);
  assert.match(appHtml, /Findit Harare/);
  assert.equal(adminResponse.status, 200);
  assert.match(adminHtml, /Findit Harare/i);
});

test('serves public app state without private account fields', async () => {
  const response = await fetch(`${baseUrl}/api/state`);
  const state = await response.json();

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(state.categories));
  assert.ok(Array.isArray(state.customers));
  assert.ok(Array.isArray(state.providers));
  for (const account of [...state.customers, ...state.providers]) {
    assert.equal(Object.hasOwn(account, 'password'), false);
    assert.equal(Object.hasOwn(account, 'passwordHash'), false);
    assert.equal(Object.hasOwn(account, 'nationalIdNumber'), false);
  }
});

test('opens the real-time event stream and receives its connection event', async () => {
  const controller = new AbortController();
  try {
    const response = await fetch(`${baseUrl}/api/stream`, {
      signal: controller.signal
    });
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /text\/event-stream/);

    const reader = response.body.getReader();
    const { value, done } = await reader.read();
    assert.equal(done, false);
    assert.match(new TextDecoder().decode(value), /"eventType":"CONNECTED"/);
    await reader.cancel();
  } finally {
    controller.abort();
  }
});
