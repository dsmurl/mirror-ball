### Mirrorball — Initial Project Plan (for Junie AI agent)

#### 1) Objectives and Scope
- Build a simple website where authenticated users can:
  - Upload images to S3 (role: dev and admin)
  - List/search images stored in S3 (both roles)
  - Delete images (role: admin only)
- Each image has: owner (user id or username), upload time, dev name, and a public URL.
- Keep database and API as simple as possible.
- Infrastructure provisioned with Pulumi on AWS.
- Static website built with Vite and served via the same S3 bucket and a CloudFront distribution (site + images).
- Define users, roles (dev, admin), and required permissions in-repo (AWS permissions file + Pulumi wiring).
- Prefer no serverless functions. If an API is needed, implement it as a long-running Deno service deployed as a container (no Lambdas).

Notes
- Monorepo: Nx will manage the workspace, tasks, and caching for frontend, API, and infra.
- Pulumi is the IaC tool. The frontend will still use a JS/TS package manager (pnpm/npm/yarn); Deno will manage backend code where used. This plan uses Pulumi to orchestrate infra, not as an app package manager.

#### 2) High-Level Architecture (Nx monorepo, Deno API service, no Lambdas)
- Auth: Amazon Cognito Hosted UI + Cognito User Pool. Two groups: dev, admin.
- API: Single Deno web service (containerized) exposes minimal endpoints. No API Gateway, no Lambda. Deployed on AWS App Runner (preferred) or ECS Fargate.
- Uploads: Frontend calls the Deno API to obtain pre-signed S3 PUT URLs. API validates JWT (Cognito) and role (group claim).
- Metadata: DynamoDB single-table for image metadata (owner, uploadTime, devName, s3Key, publicUrl). API performs writes/reads.
- Public URL: CloudFront distribution with two origins: S3 (site + images prefixes) and API origin (App Runner/ECS). CloudFront routes `/api/*` to the API origin and everything else to S3. S3 remains private using CloudFront OAC.

#### 3) Roles & Authorization Model
- Roles: dev, admin.
- Both can list and search images.
- dev can upload; admin can upload and delete.
- Cognito groups are carried as JWT claims. The Deno API validates tokens (User Pool JWKS) and authorizes by `cognito:groups` claim.
- Keep S3 bucket private; access via CloudFront (public read) and pre-signed URLs for uploads; deletes only by admin via API call.

#### 4) Data Model (DynamoDB single-table)
Table: Images
- PK: `imageId` (ULID)
- SK: none (simple primary key)
- Attributes:
  - `owner` (string)
  - `devName` (string)
  - `uploadTime` (ISO 8601 string)
  - `s3Key` (string; folder + filename)
  - `publicUrl` (string; CloudFront URL)
  - Optional: `tags` (string array) for basic search; else search on owner/devName/s3Key prefix.

Indexes (only if needed for search):
- GSI1: `owner` (PK) with `uploadTime` (SK) for listing by owner, newest-first.
- GSI2: `devName` (PK) with `uploadTime` (SK) for listing by dev name.
Keep it minimal initially: implement GSI1 only; add GSI2 if necessary.

#### 5) API Design (minimal)
Base path: `/api`
- `POST /api/presign-upload` → returns `{ uploadUrl, objectKey, publicUrl, imageId }`
  - Auth: dev, admin
  - Input: `{ contentType, fileName, devName }`
  - Side effects: creates metadata stub (imageId, s3Key, owner, devName, uploadTime=now, publicUrl) in DynamoDB (status: "pending")
- `POST /api/confirm-upload` → marks metadata as "complete" after client confirms upload success
  - Auth: dev, admin
  - Input: `{ imageId }`
- `GET /api/images` → list/search images
  - Auth: dev, admin
  - Query params: `owner?`, `devName?`, `prefix?`, `limit?`, `cursor?`
- `DELETE /api/images/:imageId` → delete image object and metadata
  - Auth: admin only

Implementation: Deno HTTP service (e.g., using `std/http`, Hono, or Oak) running as a container. Verifies Cognito JWT (via JWKS). Uses AWS SDK v3 for JavaScript (via npm specifier under Deno) for S3 pre-sign and DynamoDB access. Exposed through CloudFront path routing to App Runner/ECS service.

#### 6) Frontend (Vite)
- Tech: Vite + React (or vanilla) + TypeScript.
- Auth: Cognito Hosted UI or Amplify Auth minimal wrapper (only client-side OAuth flow); alternatively use AWS SDK + cognito-auth-js.
- Features:
  - Login/Logout, show role in UI.
  - Upload form: file selector, devName field, calls `presign-upload`, PUT to S3, then call `confirm-upload`.
  - Images list: infinite scroll/pagination; filters by owner/devName/prefix; show thumbnail (CloudFront URL) + metadata; search field.
  - Delete button for admin only.
- Build: emitted assets uploaded to the same S3 bucket under `site/` prefix; images under `images/` prefix. Prefer one bucket with prefixes.
- Nx: Frontend is an Nx app (`apps/frontend`), with tasks `nx serve frontend` and `nx build frontend`.

#### 7) Infrastructure (Pulumi, AWS)
Stacks: `dev` (default)
Resources:
- S3 bucket: `mirrorball-bucket`
  - Folders (prefixes): `site/`, `images/`
  - Block public access; enforce CloudFront OAC for reads
- CloudFront distribution
  - Origin: S3 (OAC)
  - Behaviors:
    - Default: serve `site/` prefix (SPA fallback to index.html)
    - Path pattern `/images/*`: serve images path
    - Path pattern `/api/*`: route to API origin (App Runner/ECS), disable caching for auth-protected endpoints
  - Cache policies: standard static; set proper content types
- Cognito
  - User Pool + App Client (Hosted UI)
  - User Groups: `dev`, `admin`
  - (Optional) Identity Pool not required; tokens validated by API directly
- DynamoDB: `Images` table (on-demand capacity)
- Containerized Deno API Service
  - Container registry: ECR repository
  - Service platform: App Runner (simpler) or ECS Fargate (if needed). Prefer App Runner.
  - Networking: Public HTTPS endpoint; CloudFront routes `/api/*` to this origin
- IAM roles and policies
  - Service execution role with least-privilege access to S3 bucket (scoped to `images/*`), DynamoDB table, and CloudWatch Logs
  - ECR pull permissions for the service
  - CloudFront OAC permissions to S3

Outputs:
- `cloudFrontDomainName`, `bucketName`, `userPoolId`, `userPoolClientId`, `apiBaseUrl`, `tableName`.

#### 8) AWS Permissions File (in-repo)
Create `infra/permissions/policies.json` containing:
- Managed policies JSON for:
  - `ServiceImagesRWPolicy` (S3 images prefix R/W, DynamoDB R/W)
  - `ServiceLogsPolicy` (CloudWatch Logs)
  - `CloudFrontOACReadPolicy` (S3 GetObject via OAC principal)
- Reference them in Pulumi program when creating roles.

#### 9) Local Development
- Nx workspace at repo root. Use `pnpm`.
- Frontend: `nx serve frontend` with environment variables `VITE_API_BASE_URL`, `VITE_USER_POOL_ID`, `VITE_USER_POOL_CLIENT_ID`, `VITE_CLOUDFRONT_DOMAIN`.
- Deno API service: `nx serve api` (wrapper for `deno task dev`), runs on localhost with JWT validation against Cognito JWKS. Configure local `.env` for AWS creds or use a named AWS profile.
- Pulumi: `nx run infra:up` (wrapper around `pulumi up`) against `dev` stack.

#### 10) CI/CD (minimal)
- GitHub Actions (or none to start). Optional initial workflow:
  - Lint/build frontend
  - Build and push API Docker image to ECR
  - `pulumi preview` on PR
  - On main: build site, push API image, `pulumi up` (updates infra/service), sync `site/` to S3

#### 11) Non-Functional Requirements
- Simplicity first; prefer minimal code and least AWS services needed.
- Least-privilege IAM for all services.
- Idempotent Pulumi deployments.
- Reasonable costs: on-demand DynamoDB, App Runner (or minimal ECS), CloudFront.

#### 12) Milestones & Deliverables
M1 — Repo bootstrap
- Folder structure:
  - Nx workspace with:
    - `apps/frontend` (Vite app)
    - `apps/api` (Deno API service)
    - `infra/` (Pulumi program, permissions)
    - `docs/` (this plan)
- Pulumi project + stack initialized

M2 — Infra MVP
- S3 bucket, CloudFront with OAC, basic distribution
- Cognito User Pool + App Client + groups (dev, admin)
- DynamoDB table
- Outputs exported

M3 — API Service MVP
- Deno service endpoints: `presign-upload`, `confirm-upload`, `list-images`, `delete-image`
- Containerization: Dockerfile for Deno API, ECR repo, App Runner service created via Pulumi
- IAM roles/policies attached from `infra/permissions/policies.json`

M4 — Frontend MVP
- Login/logout UI using Cognito Hosted UI
- Upload flow with pre-signed URL + confirm
- List/search page
- Delete (admin-only)

M5 — Deploy & Verify
- Build site and sync to S3 `site/`
- Build and push API image; `pulumi up`
- Manual verification: login as dev/admin; upload, list/search, delete

#### 13) Acceptance Criteria
- Auth works via Cognito Hosted UI; dev/admin groups enforced by API
- Upload succeeds; image publicly viewable through CloudFront
- Metadata persisted in DynamoDB with correct fields
- List/search returns expected results and is fast enough for initial scale
- Delete restricted to admin; removes S3 object and DB entry
- All resources created/updated via Pulumi; permissions defined in-repo

#### 14) Tasks for Junie (step-by-step)
1. Initialize repo structure
   - Scaffold Nx workspace at repo root (pnpm)
   - Create apps: `frontend` (Vite + React + TS), `api` (Deno HTTP service)
   - Create `infra/` (Pulumi TS program) and `infra/permissions/`
   - Add `.gitignore`, basic README
2. Pulumi setup
   - Init Pulumi project in `infra/` (TypeScript program)
   - Define config schema for stack (region, domain optional)
3. Permissions
   - Create `infra/permissions/policies.json` with the managed policies outlined
4. Core infra
   - Create S3 bucket with prefixes and block public access
   - Create CloudFront distribution with OAC; behaviors for `site/*`, `images/*`, and route `/api/*` to API origin; SPA rewrite
   - Export `cloudFrontDomainName`, `bucketName`
5. Auth
   - Create Cognito User Pool, App Client, Hosted UI domain (random), groups `dev` and `admin`
   - Export `userPoolId`, `userPoolClientId`
6. Data
   - Create DynamoDB table `Images` (on-demand); optionally GSI1 for owner+time
   - Export `tableName`
7. API Service (Deno container)
   - Implement endpoints in `apps/api`
   - Add Dockerfile for Deno API; create ECR repo; build and push image
   - Create App Runner service (or ECS Fargate) with execution role attached
   - Export `apiBaseUrl`
8. IAM wiring
   - Create execution role for the service and attach policies from `infra/permissions/policies.json`
   - Configure CloudFront OAC permissions for bucket
9. Frontend app
   - Scaffold Vite + React + TS in `frontend/`
   - Env config: `.env` with outputs from Pulumi
   - Implement auth flow (Hosted UI), read groups from ID token
   - Implement upload + confirm, list/search, admin delete
   - Build script to publish to S3 `site/`
10. Deploy & test
   - Build and push API image; `pulumi up` for `dev`
   - Upload site assets to S3 `site/`
   - Manual test scenarios for dev and admin

#### 15) Open Questions / Decisions to Confirm
- Keep single bucket with `site/` and `images/` prefixes vs separate buckets? (Plan assumes single bucket.)
- Use Hosted UI redirect URIs tied to CloudFront domain only, or also localhost for dev? (Recommend both.)
- Do we need full-text search on metadata? (Plan assumes simple filters/prefix scans.)
- Prefer App Runner in target region; fallback to ECS Fargate if App Runner is unavailable.

#### 16) Next Action for Junie
- Proceed with M1 and M2: scaffold Nx workspace, Pulumi project, S3 + CloudFront (with API route) + Cognito + DynamoDB, and export stack outputs.
