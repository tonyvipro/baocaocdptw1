import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('../../frontend/node_modules/.audit-browser/node_modules/playwright');
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:3000', { waitUntil: 'domcontentloaded' });
  await page.locator('main h3').first().waitFor({ timeout: 60000 });
  console.log(JSON.stringify({ title: await page.title(), scripts: await page.locator('script[src]').evaluateAll(ns => ns.map(n => n.src)), inputs: await page.locator('input').evaluateAll(ns => ns.map(n => ({ name: n.name, placeholder: n.placeholder, type: n.type }))), selects: await page.locator('select').evaluateAll(ns => ns.map(n => ({ name: n.name, options: [...n.options].map(o => ({ text: o.text, value: o.value })) }))), buttons: await page.locator('button').evaluateAll(ns => ns.slice(0, 55).map(n => ({ title: n.title, text: n.innerText, aria: n.getAttribute('aria-label') }))), main: (await page.locator('main').innerText()).slice(0, 2500), errors }, null, 2));
} finally { await browser.close(); }
