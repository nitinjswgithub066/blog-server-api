# Blog Server API

A TypeScript and Express backend for a full-stack blog and technology publishing platform. It provides the administrative APIs and supporting services for authentication, content management, media handling, analytics, email delivery, and scheduled publishing.

> **Repository status:** This README describes the `feature/admin/client` branch as inspected. Features and routes can differ on other branches.

## Contents

- [Overview](#overview)
- [Features](#features)
- [Technology stack](#technology-stack)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Database and migrations](#database-and-migrations)
- [API reference](#api-reference)
- [Authentication](#authentication)
- [Background jobs](#background-jobs)
- [File uploads](#file-uploads)
- [Health check](#health-check)
- [Development scripts](#development-scripts)
- [Security notes](#security-notes)
- [CI workflow](#ci-workflow)
- [Contributing](#contributing)
- [License](#license)

## Overview

Blog Server API is the backend service for a blog/news publishing platform. The inspected branch is organized around administrative workflows: administrators can manage posts, categories, tags, dashboard data, and statistics through protected API routes.

The service uses PostgreSQL for persistent data, Prisma ORM for database access, Cloudinary for media storage, and SMTP through Nodemailer for email delivery. Scheduled tasks handle publishing, email processing, analytics rollups, and cleanup operations.

## Features

The following capabilities are represented in the inspected source code:

- **Admin authentication:** initial admin registration, login, logout, current-admin lookup, and password recovery.
- **Content management:** create drafts, edit, preview, duplicate, publish, schedule, archive, restore, and delete posts.
- **Bulk post operations:** publish, move to draft, archive, delete, and export selected posts.
- **Taxonomy management:** create and manage categories and tags.
- **Dashboard:** summary data, search trends, top-performing posts, blog performance, and topic notes.
- **Statistics:** overview, traffic trends, category performance, top posts, and report export.
- **Media handling:** upload cover images, inline images, and documents through Cloudinary-backed services.
- **Email workflows:** queued email delivery, reusable email templates, delivery attempts, and email logs.
- **Scheduled processing:** publish scheduled posts and run email, analytics, and cleanup jobs.
- **External analytics integrations:** service modules for Google Analytics and Google Search Console.

Availability and completeness of individual workflows depend on environment configuration and the current branch.

## Technology stack

| Area | Technology |
|---|---|
| Runtime | Node.js |
| Language | TypeScript |
| HTTP framework | Express 5 |
| Database | PostgreSQL |
| ORM | Prisma 7 |
| PostgreSQL driver | `pg` with `@prisma/adapter-pg` |
| Authentication | JSON Web Tokens (`jsonwebtoken`) |
| Password hashing | `bcryptjs` |
| Media storage | Cloudinary |
| File uploads | Multer |
| Email | Nodemailer / SMTP |
| Scheduled tasks | node-cron |
| HTML sanitization | sanitize-html |
| Document processing | Mammoth and PDFKit |
| Spreadsheet export | ExcelJS |
| CI | GitHub Actions |

## Architecture

The codebase uses a modular Express structure. Route modules connect HTTP endpoints to controllers, while service modules contain reusable integrations and supporting operations.

```mermaid
flowchart TD
    Client[Admin dashboard / client] --> API[Express API]
    API --> Auth[Authentication middleware]
    API --> Modules[Route modules and controllers]
    Modules --> Services[Application services]
    Services --> Prisma[Prisma ORM]
    Prisma --> DB[(PostgreSQL)]
    Services --> Cloudinary[Cloudinary media storage]
    Services --> SMTP[SMTP email provider]
    Jobs[Scheduled jobs] --> Prisma
    Jobs --> SMTP
```

### API route groups

| Route prefix | Purpose | Authentication |
|---|---|---|
| `/api/auth` | Admin registration, login, logout and password recovery | Public routes plus protected `/me` |
| `/api/dashboard` | Dashboard and topic-note operations | Admin token |
| `/api/admin/posts` | Post and media management | Admin token |
| `/api/admin/categories` | Category management | Admin token |
| `/api/admin/tags` | Tag management | Admin token |
| `/api/admin/statistics` | Analytics and report exports | Admin token |

The inspected branch does not define a separate public post-reading API route group in `src/server.ts`. Do not assume public content endpoints exist until they are implemented and mounted.

## Project structure

```text
blog-server-api/
├── .github/
│   └── workflows/
│       └── server-ci.yml
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── src/
│   ├── config/          # Prisma client and database connection
│   ├── emails/          # Email service, types and templates
│   ├── jobs/            # Scheduled publishing, email and cleanup jobs
│   ├── middlewares/     # Authentication middleware
│   ├── modules/
│   │   ├── admin-categories/
│   │   ├── admin-posts/
│   │   ├── admin-statistics/
│   │   ├── admin-tags/
│   │   ├── auth/
│   │   └── dashboard/
│   ├── services/        # Cloudinary and Google integrations
│   ├── utils/           # Tokens, hashing, response and content helpers
│   └── server.ts        # Express application and server startup
├── package.json
├── package-lock.json
├── prisma.config.ts
└── tsconfig.json
```

## Getting started

### Prerequisites

- Node.js 20 or later (the repository CI workflow uses Node.js 20).
- npm.
- A PostgreSQL database.
- Cloudinary credentials if media upload features are required.
- SMTP credentials if email delivery is required.

### 1. Clone the repository

```bash
git clone https://github.com/nitinjswgithub066/blog-server-api.git
cd blog-server-api
```

To work with the branch documented here:

```bash
git checkout feature/admin/client
```

### 2. Install dependencies

```bash
npm ci
```

### 3. Configure environment variables

Create a `.env` file in the project root. Use the variable reference below and provide values for the services you intend to run.

Never commit your real `.env` file or credentials.

### 4. Generate the Prisma client

```bash
npx prisma generate
```

### 5. Apply database migrations

For local development:

```bash
npm run prisma:migrate
```

This script runs `prisma migrate dev`. Ensure `DIRECT_URL` points to a database that can be used by Prisma migrations.

### 6. Start the development server

```bash
npm run dev
```

The server uses port `5000` by default and starts scheduled jobs after a successful database connection. Set `ENABLE_CRON_JOBS=false` to disable scheduled jobs.

### 7. Build and run

```bash
npm run build
npm start
```

The TypeScript build outputs JavaScript to `dist/`.

## Environment variables

The application reads configuration from environment variables. The following names are referenced by the inspected server, authentication, database, media, email, and job modules.

| Variable | Required when | Description |
|---|---|---|
| `PORT` | Optional | HTTP port; defaults to `5000`. |
| `NODE_ENV` | Recommended | Runtime environment, such as `development`, `production`, or `test`. |
| `DATABASE_URL` | Required | PostgreSQL connection string used by the runtime Prisma client. |
| `DIRECT_URL` | Required for Prisma CLI migrations | Direct PostgreSQL connection URL read by `prisma.config.ts`. |
| `JWT_SECRET` | Required for secure deployments | Secret used to sign and verify admin JWTs. |
| `ADMIN_FRONTEND_URL` | Optional | Admin frontend base URL used when generating authentication email links; defaults to `http://localhost:5173`. |
| `ADMIN_DASHBOARD_URL` | Optional | Allowed CORS origin for the admin dashboard. |
| `CLIENT_WEB_URL` | Optional | Allowed CORS origin for the client website. |
| `CLOUDINARY_CLOUD_NAME` | Required for Cloudinary | Cloudinary cloud name. |
| `CLOUDINARY_API_KEY` | Required for Cloudinary | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | Required for Cloudinary | Cloudinary API secret. |
| `EMAIL_PROVIDER` | Required for SMTP email | Set to `smtp` to enable the SMTP transport. |
| `SMTP_HOST` | Required for SMTP email | SMTP server hostname. |
| `SMTP_PORT` | Required for SMTP email | SMTP server port. |
| `SMTP_SECURE` | Required for SMTP email | Set to `true` when using a secure SMTP connection. |
| `SMTP_USER` | Required for SMTP email | SMTP username. |
| `SMTP_PASS` | Required for SMTP email | SMTP password or provider-specific credential. |
| `EMAIL_FROM` | Required for SMTP email | Sender address used for outgoing messages. |
| `ENABLE_CRON_JOBS` | Optional | Set to `false` to disable scheduled jobs. |
| `ENABLE_DB_KEEP_ALIVE` | Optional | Set to `true` to enable the database keep-alive job. |

Example local configuration (replace every placeholder with your own value):

```dotenv
NODE_ENV=development
PORT=5000

DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"

JWT_SECRET="replace-with-a-long-random-secret"

ADMIN_FRONTEND_URL="http://localhost:5173"
ADMIN_DASHBOARD_URL="http://localhost:5173"
CLIENT_WEB_URL="http://localhost:3000"

CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

EMAIL_PROVIDER="smtp"
SMTP_HOST=""
SMTP_PORT=""
SMTP_SECURE="false"
SMTP_USER=""
SMTP_PASS=""
EMAIL_FROM=""

ENABLE_CRON_JOBS="true"
ENABLE_DB_KEEP_ALIVE="false"
```

The example is a template, not a production configuration. Confirm the exact origins and provider settings for your deployment. Do not use example credentials.

## Database and migrations

The Prisma schema defines PostgreSQL models for:

- Admin users and roles.
- Posts, categories, tags, and media.
- Comments and settings.
- Notifications and analytics.
- Topic notes and legal pages.
- Contact messages and newsletter subscribers.
- Email queues and email logs.
- Trend snapshots.

Migration files are stored under `prisma/migrations/`.

Useful commands:

```bash
# Generate Prisma Client
npx prisma generate

# Create/apply a development migration
npm run prisma:migrate

# Open Prisma Studio
npm run prisma:studio
```

Back up your database before applying migrations to a production environment.

## API reference

Base URL for local development:

```text
http://localhost:5000
```

All routes below are mounted by the inspected branch. Protected routes require a valid admin session cookie named `admin_token`.

### Authentication — `/api/auth`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/register-admin` | Register the initial admin account | Public bootstrap route; service permits registration only when no admin exists |
| POST | `/login` | Authenticate an admin and set the session cookie | Public |
| POST | `/logout` | Clear the admin session cookie | Public |
| POST | `/forgot-password` | Request a password-reset email | Public |
| GET | `/verify-reset-token` | Verify a reset token; expects a `token` query parameter | Public |
| POST | `/reset-password` | Reset a password using the reset token and admin registration code | Public |
| GET | `/me` | Return the authenticated admin profile | Protected |

### Dashboard — `/api/dashboard`

All dashboard routes require an admin token.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/first-stage` | Initial dashboard data |
| GET | `/search-trends` | Search trend data |
| GET | `/top-performing-posts` | Top-performing posts |
| GET | `/blog-performance` | Blog performance data |
| GET | `/topic-notes` | List topic notes |
| POST | `/topic-notes` | Create a topic note |
| PUT | `/topic-notes/:id` | Update a topic note |
| DELETE | `/topic-notes/:id` | Delete a topic note |

### Posts — `/api/admin/posts`

All post routes require an admin token.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List admin posts |
| GET | `/summary` | Post summary |
| GET | `/recent` | Recent posts |
| POST | `/draft` | Create a draft |
| POST | `/upload-cover` | Upload a cover image (`image` multipart field) |
| POST | `/upload-inline-image` | Upload an inline image (`image` multipart field) |
| POST | `/upload-document` | Upload a document (`document` multipart field) |
| POST | `/bulk/publish` | Bulk publish |
| POST | `/bulk/move-to-draft` | Bulk move to draft |
| POST | `/bulk/archive` | Bulk archive |
| POST | `/bulk/delete` | Bulk delete |
| POST | `/bulk/export` | Bulk export |
| GET | `/:id/preview` | Preview a post |
| POST | `/:id/duplicate` | Duplicate a post |
| POST | `/:id/publish` | Publish a post |
| POST | `/:id/schedule` | Schedule a post |
| POST | `/:id/move-to-draft` | Move a post to draft |
| POST | `/:id/restore` | Restore a post |
| POST | `/:id/archive` | Archive a post |
| GET | `/:id` | Get a post by ID |
| PUT | `/:id` | Update a post |
| DELETE | `/:id` | Delete a post |

### Categories — `/api/admin/categories`

All category routes require an admin token.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List categories |
| POST | `/` | Create a category |
| DELETE | `/:id` | Delete a category |

### Tags — `/api/admin/tags`

All tag routes require an admin token.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List tags |
| POST | `/` | Create a tag |

### Statistics — `/api/admin/statistics`

All statistics routes require an admin token.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/export` | Export a statistics report |
| GET | `/` | Get statistics |
| GET | `/overview` | Get statistics overview |
| GET | `/traffic-trend` | Get traffic trends |
| GET | `/category-performance` | Get category performance |
| GET | `/top-posts` | Get top post performance |

For request body schemas, response examples, pagination parameters, and error codes, consult the corresponding controller and validation code. They are intentionally not guessed in this README.

## Authentication

The current admin authentication flow uses JWTs stored in an `admin_token` cookie.

- Login issues a token and sets the cookie.
- Protected route groups use `verifyAdminToken` middleware.
- The cookie is configured as HttpOnly.
- In production, the cookie is configured with `secure: true` and `sameSite: 'none'`.
- Passwords and password-reset values are processed using the project's hashing utilities.
- Password-reset tokens have a 15-minute expiry.

**Deployment requirements:** Set a strong, unique `JWT_SECRET` in every environment. The inspected middleware currently contains a fallback development secret; remove that fallback and fail startup when the secret is missing before deploying to production. Review CSRF protections and cookie/CORS settings for the actual deployment topology.

## Background jobs

Scheduled jobs are initialized after the database connection succeeds. They are skipped in the test environment and can be disabled with `ENABLE_CRON_JOBS=false`.

The inspected jobs include:

- Pending email processing.
- Scheduled post publishing.
- Temporary media cleanup.
- Deleted-post cleanup.
- Analytics rollups.
- Dashboard trend snapshots.
- Blog performance rollups.
- Optional database keep-alive (`ENABLE_DB_KEEP_ALIVE=true`).

The scheduler runs within the API process. If multiple API instances are deployed, review job coordination to prevent the same scheduled work from running concurrently on multiple instances.

## File uploads

The admin post router uses Multer memory storage and sets a 10 MB file-size limit for the upload middleware.

Upload endpoints accept multipart form data:

- `POST /api/admin/posts/upload-cover` — field name `image`.
- `POST /api/admin/posts/upload-inline-image` — field name `image`.
- `POST /api/admin/posts/upload-document` — field name `document`.

Cloudinary credentials are required for Cloudinary-backed uploads. Before production use, validate allowed MIME types and file signatures, enforce appropriate per-format limits, and avoid trusting client-supplied filenames or content types.

## Health check

Use the health endpoint to check the API and its database connection:

```http
GET /api/health
```

The response reports the API status, database connectivity, Cloudinary configuration status, timestamp, and runtime environment. A database connectivity failure returns HTTP 503.

## Development scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the development server with ts-node-dev |
| `npm run build` | Compile TypeScript into `dist/` |
| `npm start` | Run the compiled server |
| `npm run type-check` | Run TypeScript without emitting files |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run prisma:migrate` | Run Prisma development migrations |

**Current tooling note:** In the inspected `package.json`, `lint`, `format:check`, and `test` are placeholder scripts. They do not currently run a real linter, formatter, or test suite. Add and configure those tools before treating these checks as quality gates.

## Security notes

Security is an ongoing responsibility. The inspected source includes several useful controls, but this README is not a security certification or a substitute for a full audit.

Before production deployment, prioritize:

1. Remove the fallback JWT secret and require `JWT_SECRET` at startup.
2. Strengthen the password policy and consider a secure password-length policy that supports passphrases.
3. Review role and permission enforcement for every administrative operation; token verification alone is not a complete authorization policy.
4. Add and verify rate limits for login, registration, password recovery, and other abuse-sensitive endpoints.
5. Review CSRF protections for cookie-authenticated state-changing requests.
6. Validate upload MIME types, file signatures, sizes, and document-processing paths.
7. Ensure secrets are stored only in deployment secret management and never committed.
8. Add automated tests for authentication, authorization, input validation, uploads, and critical content workflows.
9. Review dependency alerts and keep production dependencies updated.
10. Review logs to ensure passwords, tokens, reset links, and other secrets are never recorded.

Please report suspected vulnerabilities privately to the maintainer rather than publishing exploit details in a public issue.

## CI workflow

The repository contains a GitHub Actions workflow at `.github/workflows/server-ci.yml`. It is configured for pull requests and pushes targeting `main`, and manual dispatch.

The workflow installs dependencies with `npm ci`, then invokes the lint, type-check, format, test, and build scripts.

Because the lint, format, and test scripts are currently placeholders, those steps do not yet provide real linting, formatting, or test coverage. The TypeScript type-check and build are the meaningful configured checks at present. The workflow should be updated as the quality tooling is implemented.

## Contributing

Contributions, bug reports, and suggestions are welcome.

1. Open an issue describing the bug or proposed change.
2. Fork the repository and create a focused branch.
3. Follow the existing TypeScript and module structure.
4. Include tests for new behavior and bug fixes as test infrastructure becomes available.
5. Run the type-check and build before opening a pull request.
6. Explain the change, its motivation, and any configuration or migration impact in the pull request.

Do not include credentials, production data, or private user information in issues, commits, or pull requests.

## License

The package metadata currently declares the `ISC` license, but a repository-level `LICENSE` file was not present in the inspected branch. Add the appropriate license file and confirm the intended licensing before inviting external reuse or contributions.

---

Maintained by [nitinjswgithub066](https://github.com/nitinjswgithub066).
