---
name: testing-kp-pakse-pos
description: Test kp-pakse-pos unit coverage and production compatibility. Use when adding or validating Vitest tests in this repository.
---

# Testing kp-pakse-pos

## Devin Secrets Needed

None for local unit tests, coverage, lint, or production builds.

## Environment

Use Node.js 22.23.1 or newer within the Node 22 release line:

```bash
. "$HOME/.nvm/nvm.sh"
nvm use 22.23.1
npm install
```

## Unit tests and coverage

```bash
npm test
npm run test:coverage
```

Coverage is written to `coverage/coverage-summary.json` and `coverage/index.html`. Confirm the report includes production source files rather than only test files.

## Lint

Run ESLint directly on changed test/config files before relying on the repository-wide command:

```bash
npx eslint <changed-test-and-config-paths>
```

`npm run lint` might report existing violations in production, server, or scratch files. If it does, distinguish unchanged-file findings from errors introduced by the current diff.

## Production compatibility

```bash
npm run build
```

The build is complete only when Vite emits assets and the post-build obfuscator reports successful completion.

## Evidence

For shell-only testing, save command output as text. Open `coverage/index.html` locally for a visual coverage artifact; browser interaction is evidence gathering rather than application UI testing, so a recording is unnecessary.
