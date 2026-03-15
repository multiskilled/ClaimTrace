# ClaimTrace - Evidence Intelligence Platform

## Overview

ClaimTrace is a multimodal evidence-intelligence platform for ecommerce returns, warranty claims, and dispute review. Reviewers upload mixed evidence (receipts, photos, PDFs, notes), the system analyzes it using Amazon Bedrock Nova Lite, reconstructs a timeline, identifies contradictions, and recommends Approve/Reject/Human Review.

Built as a pnpm workspace monorepo using TypeScript with PostgreSQL/Drizzle for persistence, S3 presigned URLs for file storage, and a React+Vite frontend.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **AI**: Amazon Bedrock Nova Lite (`amazon.nova-lite-v1:0`)
- **Storage**: Amazon S3 (presigned URLs)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Frontend**: React 19 + Vite + TailwindCSS + shadcn/ui
- **Routing**: wouter
- **State**: TanStack React Query (generated hooks)
- **Build**: esbuild (CJS bundle for API server)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server (port 8080)
│   └── claimtrace/         # React+Vite frontend
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Database Schema

Tables in `lib/db/src/schema/`:
- **claims** - Core claim records (title, type, merchant, customer, narrative, status, recommendation, confidenceScore)
- **evidence_items** - Uploaded evidence files linked to claims (fileName, fileType, mimeType, s3Key)
- **analysis_runs** - AI analysis results (summary, recommendation, contradictions, missingEvidence, extractedFacts, timeline, confidenceScore)
- **audit_events** - Audit trail (eventType, actor, message, timestamp)
- **portal_records** - Portal sync records (claimId, decision, portalStatus, portalNotes)

## API Endpoints

All routes mounted under `/api`:
- `GET /api/claims` - List all claims
- `POST /api/claims` - Create a new claim
- `GET /api/claims/:id` - Get claim by ID
- `POST /api/claims/:claimId/evidence/upload-url` - Get S3 presigned upload URL
- `POST /api/claims/:claimId/evidence/confirm` - Confirm evidence upload
- `GET /api/claims/:claimId/evidence` - List evidence for a claim
- `POST /api/claims/:claimId/analyze` - Run AI analysis (Bedrock Nova Lite)
- `GET /api/claims/:claimId/analysis` - Get latest analysis results
- `GET /api/claims/:claimId/audit` - Get audit trail
- `POST /api/claims/:claimId/sync-portal` - Sync decision to portal
- `GET /api/portal-records` - List portal records
- `GET /api/settings/status` - Check service connectivity (S3, DB, Bedrock)
- `POST /api/seed` - Seed 3 demo claims with realistic data

## Frontend Pages

- **Landing** (`/`) - Marketing landing page
- **Dashboard** (`/dashboard`) - Claims list with search, status badges, AI recommendations
- **Create Claim** (`/claims/new`) - Form to create new dispute case
- **Claim Detail** (`/claims/:id`) - Full claim view with tabs: Overview, Evidence, AI Analysis, Timeline, Audit Trail
- **Portal Demo** (`/portal-demo`) - Internal portal sync view
- **Settings** (`/settings`) - Service status, configuration, demo seed

## Environment Variables

Required for full functionality:
- `DATABASE_URL` - PostgreSQL connection string (auto-provided by Replit)
- `AWS_ACCESS_KEY_ID` - AWS credentials for S3 and Bedrock
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `AWS_SESSION_TOKEN` - Optional, for temporary credentials
- `AWS_REGION` - AWS region (default: us-east-1)
- `S3_BUCKET_NAME` - S3 bucket for evidence storage
- `BEDROCK_MODEL_ID` - Bedrock model (default: amazon.nova-lite-v1:0)

## Key Implementation Details

- **Confidence scores** are stored as 0.0-1.0 decimals in the database, displayed as percentages in the UI
- **Evidence upload** uses a two-step flow: get presigned URL → PUT to S3 → confirm upload metadata
- **Analysis** sends claim narrative + evidence descriptions to Bedrock Nova Lite, expects structured JSON response
- **No mock/demo mode** — real AWS Bedrock integration required for AI analysis
- **Seed endpoint** creates 3 realistic demo claims with pre-computed analysis results for UI testing

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — only emit `.d.ts` files during typecheck

## Development

- `pnpm --filter @workspace/api-server run dev` — API server (port 8080)
- `pnpm --filter @workspace/claimtrace run dev` — Frontend dev server
- `pnpm --filter @workspace/api-spec run codegen` — Regenerate API client
- `pnpm --filter @workspace/db run push` — Push DB schema changes
- `POST /api/seed` — Seed demo data
