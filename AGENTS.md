# EmonPlan conventions

- Keep the Go API a modular monolith; separate HTTP parsing, rules and database access.
- Validate at the API boundary and enforce relational integrity in PostgreSQL.
- SQL migrations are versioned and applied at startup; never rewrite an applied migration.
- Money is integer centavos, quantities use explicit precision. Issued quotes preserve historical snapshots.
- Electrical values are user supplied. Never claim regulatory compliance or add undocumented formulas.
- Read modern-web-guidance and retrieve relevant guides before UI changes. Keep labels, focus and keyboard navigation accessible.
- For every functional change or bug fix, write a meaningful test first, run it and confirm it fails for the intended reason; then implement the smallest change that makes it pass. Keep the regression test in the suite.
- Run backend tests, frontend tests/build and the real Docker end-to-end flow before declaring completion.
- Never commit .env, credentials or generated artifacts. No external deployment without authorization.
