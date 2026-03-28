#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require('fs');
const path = require('path');

const databaseUrl = process.env.DATABASE_URL || 'file:./muscle_app.db';

if (!databaseUrl.startsWith('file:')) {
  process.exit(0);
}

const sqliteTarget = databaseUrl.slice('file:'.length);
if (!sqliteTarget || sqliteTarget === ':memory:') {
  process.exit(0);
}

const resolvedPath = path.isAbsolute(sqliteTarget)
  ? sqliteTarget
  : path.resolve(process.cwd(), 'prisma', sqliteTarget);

fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });

if (!fs.existsSync(resolvedPath)) {
  fs.closeSync(fs.openSync(resolvedPath, 'w'));
}
