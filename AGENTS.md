# Repository Guidelines

## Project Structure & Module Organization
`src/` contains the TypeScript sources for the VS Code participant, grouped by feature (webviews, profile handling, resource importers). Bundled assets (icons, welcome flows, tutorials) live in `resources/`, while reusable templates and default agents sit under `templates/`. Packaged skills reside in `skills/`; planning notes and design docs live in `doc/` and `docs/`. Tests belong in `tests/` (unit + integration) with ancillary fixtures in `samples/`. Generated JavaScript is emitted to `out/`; never edit those files directly.

## Build, Test, and Development Commands
- `npm run watch`: incremental TypeScript build for active development.
- `npm run compile`: one-shot TypeScript compilation; run before commits.
- `npm run lint`: ESLint over `src/` to enforce the shared TS/VS Code style.
- `npm test`: executes Jest + VS Code extension tests via `out/test/runTests.js`.
- `npm run validate`: compile → lint → test; use before PRs.
- `npm run package` / `npm run release:<semver>`: produces a `.vsix` using `vsce`.

## Coding Style & Naming Conventions
Use 4-space indentation, single quotes, and keep imports in logical blocks (VS Code APIs, Node core, project modules). Prefer descriptive camelCase functions and PascalCase classes matching their files (`ProfileManager`, `ResourceImporter`). Keep modules cohesive—webview providers, managers, and lib helpers should stay in their folders. Run `npm run lint` or rely on ESLint integration before pushing; do not disable lint rules without an issue reference.

## Testing Guidelines
Write Jest tests beside the logic they cover in `tests/` using the `FeatureName.test.ts` convention; integration helpers live in `tests/integration/`. Mock VS Code APIs via the existing harness rather than hitting the real editor. Every new capability should add at least one positive-path test plus a failure or edge assertion. Use `npm test -- <pattern>` while iterating, but execute `npm run validate` for full coverage before requesting review.

## Commit & Pull Request Guidelines
Follow conventional commits (`fix:`, `chore:`, `docs:`) as in recent history (`fix: update version…`). Commits should be scoped to one behavior change and reference relevant scripts or files in the body when non-obvious. PRs need a concise summary, testing notes (e.g., “npm run validate”), linked issues, and screenshots or screen recordings for UI-facing work (tutorials, Skills Explorer). Include rollout considerations (packaged vs personal skills) when behavior touches distribution or VSIX packaging.
