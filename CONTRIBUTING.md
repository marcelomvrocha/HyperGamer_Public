# Contributing

## Ground Rules

- Keep changes focused and easy to review
- Avoid mixing refactors with unrelated feature work
- Do not commit secrets, private data, generated `.next` output, or SQLite files
- Preserve the standalone deployment assumption unless the change explicitly improves subpath support

## Local Setup

1. Copy `.env.example` to `.env`
2. Install dependencies with `npm install`
3. Run `npm run db:generate`
4. Run `npm run db:push`
5. Start the app with `npm run dev`

Recommended baseline:

- Node.js 20 or newer
- npm 10 or newer

## Before Opening a Pull Request

- Run `npm run lint`
- Run `npm run build`
- Test the flows you touched locally
- Update docs if setup, environment variables, or behavior changed

## Pull Request Expectations

- Explain the user-visible change clearly
- Mention any schema, environment, or deployment impact
- Keep screenshots or recordings focused on the affected UI
- Call out follow-up work instead of bundling speculative changes into the same PR

## Issues

- Use issues for bugs, feature requests, and documentation gaps
- For sensitive security reports, follow [SECURITY.md](./SECURITY.md)
