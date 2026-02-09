# RemoteHQ - Remote Job Aggregator

## Overview
A web application that aggregates remote/global tech job opportunities from multiple job boards and APIs. It polls sources daily and displays jobs with filtering and dashboard analytics.

## Architecture
- **Frontend**: React + TypeScript with Vite, Tailwind CSS, shadcn/ui
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Replit Auth (OIDC) with passport, session storage in PostgreSQL
- **Routing**: wouter (client-side), Express (server-side)

## Key Files
- `shared/schema.ts` - Data models (jobs, fetchLogs, users, sessions tables)
- `shared/models/auth.ts` - Auth schema (users, sessions)
- `server/replit_integrations/auth/` - Auth module (OIDC setup, middleware, routes)
- `server/job-fetcher.ts` - Job fetching logic from APIs (Remotive, Himalayas, Jobicy, RemoteOK)
- `server/storage.ts` - Database CRUD operations
- `server/routes.ts` - API endpoints (all protected with isAuthenticated)
- `client/src/pages/landing.tsx` - Landing page for unauthenticated users
- `client/src/pages/jobs.tsx` - Main jobs listing page
- `client/src/pages/dashboard.tsx` - Analytics dashboard
- `client/src/components/job-card.tsx` - Job card component
- `client/src/components/app-sidebar.tsx` - Navigation sidebar
- `client/src/hooks/use-auth.ts` - React hook for authentication state

## Auth Flow
- Unauthenticated users see landing page at `/`
- Login via `/api/login` (Replit OIDC, supports Google/GitHub/email)
- Logout via `/api/logout`
- All API endpoints require authentication (isAuthenticated middleware)
- User profile shown in header with avatar and name

## API Endpoints (all require authentication)
- `GET /api/jobs?page=1&limit=10&search=&level=&companies=` - Paginated jobs
- `GET /api/companies` - List of unique companies
- `GET /api/stats` - Dashboard statistics
- `POST /api/jobs/fetch` - Trigger job fetching from all sources
- `GET /api/auth/user` - Get current authenticated user

## Job Sources
### API Sources
1. Remotive - Free API, no key required
2. Himalayas - Free API, no key required
3. Jobicy - Free API, no key required
4. RemoteOK - Free JSON endpoint
5. TheMuse - Free public API, no key required

### Scraped Job Boards
6. WeWorkRemotely - RSS feed parsing
7. WorkingNomads - JSON API
8. DailyRemote - HTML scraping with detail page company extraction

## Recent Changes
- 2026-02-09: Added TheMuse as 8th job source (free public API, ~100 remote software engineering jobs)
- 2026-02-09: Added 3 scraped sources (WeWorkRemotely, WorkingNomads, DailyRemote) with cheerio
- 2026-02-09: Fixed DailyRemote company extraction via detail page JSON-LD structured data
- 2026-02-09: Initial implementation with 4 job source APIs, jobs page with pagination/filters, dashboard with charts
