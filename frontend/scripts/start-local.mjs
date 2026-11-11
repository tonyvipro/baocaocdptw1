import { spawn } from 'node:child_process';
import { existsSync, openSync, closeSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const directory = fileURLToPath(new URL('../', import.meta.url));
const address = 'http://localhost:3001';
const log = path.join(directory, 'vite-local.log');
const vite = path.join(directory, 'node_modules/vite/bin/vite.js');

const backendAddress = 'http://127.0.0.1:8080';
const backendDirectory = path.resolve(directory, '../backend');
const backendLog = path.join(backendDirectory, 'laravel-local.log');
const artisan = path.join(backendDirectory, 'artisan');

async function inspectBackend() {
  try {
    const res = await fetch(backendAddress + '/up', { signal: AbortSignal.timeout(1200) });
    return res.status < 500;
  } catch {
    return false;
  }
}

async function startBackend() {
  if (await inspectBackend()) {
    console.log('Backend Laravel da san sang: ' + backendAddress);
    return;
  }
  if (!existsSync(artisan)) {
    console.warn('Khong tim thay artisan tai ' + backendDirectory);
    return;
  }
  const output = openSync(backendLog, 'a');
  const php = process.env.PHP_BINARY || 'php';
  const child = spawn(php, [artisan, 'serve', '--host=127.0.0.1', '--port=8080'], {
    cwd: backendDirectory,
    detached: true,
    windowsHide: true,
    stdio: ['ignore', output, output],
  });
  closeSync(output);
  child.unref();

  const deadline = Date.now() + 10000;
  let ready = false;
  while (Date.now() < deadline) {
    await delay(400);
    if (await inspectBackend()) {
      ready = true;
      break;
    }
  }
  if (ready) {
    console.log('Da khoi dong Backend Laravel: ' + backendAddress);
  } else {
    console.log('Backend dang khoi dong nen. Log: ' + backendLog);
  }
}

async function inspect() {
  let response;
  try { response = await fetch(address, { signal: AbortSignal.timeout(1200) }); }
  catch { return false; }
  const html = await response.text();
  if (!response.ok || !html.includes('<title>3TV LAND')) {
    throw new Error('Cong 3001 dang duoc ung dung khac su dung. Khong tu dong dung ung dung do.');
  }
  const app = await fetch(address + '/src/App.jsx', { signal: AbortSignal.timeout(15000) });
  if (!app.ok) throw new Error('Vite dang chay nhung App.jsx bi loi bien dich. Kiem tra thong bao tren trinh duyet.');
  return true;
}

try {
  await startBackend();
  if (!existsSync(vite)) throw new Error('Chua co thu vien frontend. Chay npm.cmd install trong thu muc frontend.');
  if (await inspect()) {
    console.log('Website da san sang: ' + address);
  } else {
    const output = openSync(log, 'a');
    const child = spawn(process.execPath, [vite, '--host', 'localhost', '--port', '3001', '--strictPort'], {
      cwd: directory, detached: true, windowsHide: true, stdio: ['ignore', output, output],
    });
    closeSync(output);
    let launchError;
    child.on('error', error => { launchError = error; });
    child.unref();
    const deadline = Date.now() + 20000;
    let ready = false;
    while (Date.now() < deadline && !launchError) {
      await delay(400);
      if (await inspect()) { ready = true; break; }
    }
    if (launchError) throw launchError;
    if (!ready) throw new Error('Khong khoi dong duoc Vite. Xem ' + log);
    console.log('Da khoi dong website: ' + address);
    console.log('Vite chay nen. Co the dong cua so nay. Log: ' + log);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
