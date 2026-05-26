# Contributing

Thank you for your interest in improving this project.

## Development workflow

1. Create a branch from `main`.
2. Make focused changes.
3. Run the quality checks locally.
4. Open a pull request with a clear description.

## Local checks

Before submitting changes, run:

```bash
npm install
npm run build
npm run lint
npm run typecheck
```

## Commit style

Prefer clear conventional-style commits:

```txt
feat: add territory filters
fix: correct map layer state
docs: improve architecture notes
refactor: simplify local client layer
```

## Pull request checklist

- [ ] The project builds successfully
- [ ] No credentials or sensitive data were added
- [ ] Real addresses or private data were anonymized
- [ ] Documentation was updated when needed
- [ ] Screenshots were added for visual changes when possible

## Code standards

- Keep components small and purposeful
- Keep map and data logic separated where possible
- Prefer readable naming over clever abstractions
- Avoid hardcoded sensitive data
- Use consistent formatting and project conventions
