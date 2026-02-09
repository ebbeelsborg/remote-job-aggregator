# RemoteHQ - Remote Job Aggregator

## Overview
A web application that aggregates remote/global tech job opportunities from multiple job boards and APIs. It polls sources daily and displays jobs with filtering and dashboard analytics.

## Architecture
- **Frontend**: React + TypeScript with Vite, Tailwind CSS, shadcn/ui
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Routing**: wouter (client-side), Express (server-side)

## Key Files
- `shared/schema.ts` - Data models (jobs, fetchLogs tables)
- `server/job-fetcher.ts` - Job fetching logic from APIs (Remotive, Himalayas, Jobicy, RemoteOK)
- `server/storage.ts` - Database CRUD operations
- `server/routes.ts` - API endpoints
- `client/src/pages/jobs.tsx` - Main jobs listing page
- `client/src/pages/dashboard.tsx` - Analytics dashboard
- `client/src/components/job-card.tsx` - Job card component
- `client/src/components/app-sidebar.tsx` - Navigation sidebar

## API Endpoints
- `GET /api/jobs?page=1&limit=10&search=&level=&companies=` - Paginated jobs
- `GET /api/companies` - List of unique companies
- `GET /api/stats` - Dashboard statistics
- `POST /api/jobs/fetch` - Trigger job fetching from all sources

## Job Sources (APIs)
1. Remotive - Free API, no key required
2. Himalayas - Free API, no key required
3. Jobicy - Free API, no key required
4. RemoteOK - Free JSON endpoint

## Recent Changes
- 2026-02-09: Initial implementation with 4 job source APIs, jobs page with pagination/filters, dashboard with charts
