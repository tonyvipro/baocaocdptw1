import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const rootEnv = fileURLToPath(new URL('../.env', import.meta.url));
const backendEnv = fileURLToPath(new URL('../backend/.env', import.meta.url));
const source = existsSync(rootEnv) ? readFileSync(rootEnv, 'utf8') : '';
const existing = source.match(/^MEILI_MASTER_KEY=(.+)$/m)?.[1]?.trim().replace(/^(['"])(.*)\1$/, '$2');
const key = existing || randomBytes(32).toString('hex');
if (key.length < 16) throw new Error('MEILI_MASTER_KEY must be at least 16 characters; update the root .env.');

function update(path, initial, entries) {
  let text = initial;
  for (const [name, value] of Object.entries(entries)) {
    const pattern = new RegExp(`^${name}=.*$`, 'm');
    text = pattern.test(text) ? text.replace(pattern, `${name}=${value}`) : `${text.trimEnd()}\n${name}=${value}\n`;
  }
  writeFileSync(path, text, 'utf8');
}

update(rootEnv, source, { MEILI_MASTER_KEY: key });
const backendSource = existsSync(backendEnv) ? readFileSync(backendEnv, 'utf8') : readFileSync(new URL('../backend/.env.example', import.meta.url), 'utf8');
update(backendEnv, backendSource, {
  SCOUT_DRIVER: 'meilisearch', SCOUT_QUEUE: 'false', SCOUT_PREFIX: '3tvland_',
  MEILISEARCH_HOST: 'http://127.0.0.1:7700', MEILISEARCH_KEY: key,
});
console.log('Configured root .env and backend/.env. The secret was not printed. Existing database settings were preserved.');
