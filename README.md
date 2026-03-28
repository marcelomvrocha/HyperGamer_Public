# HyperGamer

Public standalone release: March 28, 2026

HyperGamer is a progression-focused workout tracker built for lifters who train with limited equipment and still want disciplined overload, clear performance trends, and a practical training log.

This public repository is the standalone open-source version of the app. It ships without private user data, local build artifacts, or website-only deployment assumptions.

## Highlights

- Next.js 14 App Router with TypeScript
- Prisma + SQLite for a lightweight local-first setup
- Workout logging with reps, load, RIR, tempo, pauses, and techniques
- Progression logic for capped dumbbells and limited-equipment training
- Weekly biometrics tracking and trend review
- Optional SMTP-backed welcome emails and issue-report forwarding

## Quick Start

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Install dependencies:

```bash
npm install
```

3. Generate the Prisma client and create the SQLite schema:

```bash
npm run db:generate
npm run db:push
```

4. Start the app:

```bash
npm run dev
```

5. Open [http://127.0.0.1:3001](http://127.0.0.1:3001).

## Environment

The standalone repo defaults to running at the site root:

- `NEXT_PUBLIC_BASE_PATH=""`
- `DATABASE_URL="file:./muscle_app.db"`
- `HOSTNAME=0.0.0.0`
- `PORT=3001`

Optional email settings:

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`
- `EMAIL_FROM`
- `EMAIL_REPLY_TO`
- `APP_PUBLIC_URL`
- `REPORT_EMAIL_TO`
- `REPORT_EMAIL_SUBJECT_PREFIX`

If SMTP is not configured, welcome emails and in-app reports are logged to the server console instead of being sent.

## Available Scripts

- `npm run dev` starts local development on port `3001`
- `npm run dev:lan` starts development on `0.0.0.0`
- `npm run build` builds the standalone production bundle
- `npm run start` runs the standalone server build
- `npm run lint` runs ESLint
- `npm run db:generate` generates the Prisma client
- `npm run db:push` pushes the schema to SQLite
- `npm run db:studio` opens Prisma Studio

## Privacy

This repository intentionally excludes:

- personal biometric history
- personal workout logs
- local `.env` files
- local SQLite database files
- generated `.next` output
- installed `node_modules`

The import flow includes a generic example table only. Bring your own data when you run the app.

## Deployment Notes

- Default deployment target is the root of a standalone host
- Set `NEXT_PUBLIC_BASE_PATH` only if you mount the app under a subpath
- Persistent writable storage is required for SQLite in production
- A Node-capable runtime is required because the app uses server routes, Prisma, auth sessions, and a writable database

## Open Source

- License: [MIT](./LICENSE)
- Changelog: [CHANGELOG.md](./CHANGELOG.md)
- Contributing guide: [CONTRIBUTING.md](./CONTRIBUTING.md)
- Security policy: [SECURITY.md](./SECURITY.md)
- Code of conduct: [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)

## Support

If HyperGamer is useful and you want to support continued work, donations are appreciated.
