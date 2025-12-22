# Mirrorball

Simple image upload and listing site with role-based access, built as an Nx monorepo. Frontend (Vite) and backend (Deno) share Zod schemas. Infra is provisioned with Pulumi on AWS (S3, CloudFront, Cognito, DynamoDB, App Runner).

## Docs
- [Initial plan](docs/initial-plan.md)
- [Infra setup](docs/infra-setup.md)
- [CI/CD](docs/ci-cd.md)
- [API — local development](docs/api-local-dev.md)
- [API — deploy](docs/api-deploy.md)
- [Frontend — local development](docs/frontend-local-dev.md)
- [Frontend — deploy](docs/frontend-deploy.md)
- [Runbook](docs/runbook.md)

## Workspace
- Nx monorepo using pnpm
- Apps:
  - `apps/frontend` — Vite + React
  - `apps/api` — Deno HTTP service
- Libs:
  - `libs/shared-schemas` — Zod schemas and inferred types
- Infra:
  - `apps/infra/` — Pulumi TypeScript program

See the docs above for details. 
