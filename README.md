# Kurs Boshqaruv Tizimi

Production-style Education CRM / Learning Center Management System monorepo.

## Stack

- Frontend: React, Vite, TypeScript, TailwindCSS, React Router, Zustand, React Hook Form, Zod, TanStack Query
- Backend: NestJS, TypeScript, PostgreSQL, Prisma ORM
- Auth: JWT + refresh token + RBAC
- Notifications: Telegram Bot API ready service layer

## Folder Structure

```text
.
├─ apps
│  ├─ api
│  │  ├─ prisma
│  │  │  ├─ schema.prisma
│  │  │  └─ seed.ts
│  │  └─ src
│  │     ├─ common
│  │     ├─ config
│  │     ├─ modules
│  │     │  ├─ auth
│  │     │  ├─ users
│  │     │  ├─ students
│  │     │  ├─ teachers
│  │     │  ├─ parents
│  │     │  ├─ groups
│  │     │  ├─ courses
│  │     │  ├─ attendance
│  │     │  ├─ payments
│  │     │  ├─ notifications
│  │     │  ├─ reports
│  │     │  ├─ settings
│  │     │  └─ dashboard
│  │     └─ prisma
│  └─ web
│     └─ src
│        ├─ app
│        ├─ components
│        ├─ features
│        │  ├─ admin
│        │  ├─ teacher
│        │  ├─ student
│        │  └─ shared
│        ├─ providers
│        ├─ routes
│        ├─ services
│        ├─ store
│        ├─ styles
│        └─ types
├─ .env.example
├─ docker-compose.yml
└─ package.json
```

## Main Features

- Premium landing page and role-based dashboards
- Admin modules for students, teachers, groups, courses, payments, reports, notifications, settings
- Teacher attendance workflow with notes and parent alert modal
- Student portal for attendance, payments, schedule, profile
- Prisma schema with relationships for users, students, teachers, parents, groups, courses, attendance, payments, notifications, templates, notes, schedules, audit logs
- Demo seed data and mock frontend data flow
- Swagger-ready backend bootstrap

## Local Run

1. Copy `.env.example` to `.env`
2. Start PostgreSQL

```bash
docker compose up -d
```

3. Install dependencies

```bash
npm install
```

4. Generate Prisma client and migrate database

```bash
npm run prisma:generate --workspace @kurs/api
npm run prisma:migrate --workspace @kurs/api
```

5. Seed demo data

```bash
npm run db:seed
```

If you want a stable local demo password, set `DEMO_USER_PASSWORD` and `VITE_DEMO_PASSWORD` in `.env` before seeding. Public repo files intentionally do not store real passwords, bot tokens, or local secrets.

6. Start both apps

```bash
npm run dev
```

## Important Routes

- Frontend: `http://localhost:5173`
- API: `http://localhost:4000/api`
- Swagger: `http://localhost:4000/api/docs`

## Verification

Verified locally:

- `npx tsc -p apps/api/tsconfig.json --pretty false`
- `npx tsc -b apps/web/tsconfig.json --pretty false`
- `npm run build --workspace @kurs/api`
- `npm run build --workspace @kurs/web`

## Notes

- Frontend currently uses production-style mock service data for demo UX speed; routes and structure are ready to switch to real API calls.
- `VITE_USE_MOCK_API=true` bo'lsa demo rejim ishlaydi, `false` bo'lsa auth oqimi real NestJS API bilan ishlaydi.
- Prisma client generation required network access for engine download the first time.
- `npm install` reported dependency vulnerabilities from upstream packages; they were not remediated in this pass.
