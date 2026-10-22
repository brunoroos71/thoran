#!/usr/bin/env node
// Grava KEY=valor em .env.production.local sem mostrar o valor. Uso: echo -n "valor" | node scripts/env-set.mjs KEY
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const file = new URL('../.env.production.local', import.meta.url);
const key = process.argv[2];
const value = readFileSync(0, 'utf8').trim();
if (!key || !value) process.exit(1);
let s = existsSync(file) ? readFileSync(file, 'utf8') : '';
const line = `${key}=${value}`;
s = new RegExp(`^${key}=.*$`, 'm').test(s) ? s.replace(new RegExp(`^${key}=.*$`, 'm'), line) : `${s.replace(/\n?$/, '\n')}${line}\n`;
writeFileSync(file, s, { mode: 0o600 });
console.log(`✓ ${key} gravado`);
