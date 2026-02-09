# Remote Job Aggregator

A powerful, automated job search tool that aggregates remote positions from multiple major job boards into a single, clean interface. It tracks job status, handles lifecycle transitions (New/Inactive), and provides advanced filtering and sorting.

## Features

- **Multi-Source Fetching**: Automatically pulls jobs from Remotive, Himalayas, Jobicy, RemoteOK, WeWorkRemotely, WorkingNomads, DailyRemote, and TheMuse.
- **Job Lifecycle Tracking**: 
  - **New**: Highlights jobs discovered in the latest fetch.
  - **Active**: Tracks jobs that remain available.
  - **Inactive**: Marks jobs that have been removed from the source boards.
- **Status Management**: Mark jobs as "Applied" or "Ignored" to keep your search organized.
- **Advanced Sorting**:
  - **Date**: Most recent first.
  - **Pay**: Highest salary first (intelligent range parsing).
  - **Level**: Seniority-based ordering (Principal → Lead → Staff → Senior → Mid → Junior).
  - **Status**: Prioritize Applied or Ignored jobs.
- **Whitelist Filtering**: Configure whitelisted titles in Settings with support for both **Fuzzy** and **Exact** matching modes.
- **Responsive Dashboard**: Beautiful, mobile-friendly UI built with Tailwind CSS and shadcn/ui.

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, shadcn/ui, TanStack Query, Wouter.
- **Backend**: Express, Node.js.
- **Database**: PostgreSQL with Drizzle ORM.
- **Testing**: Vitest for core logic and sorting verification.

## Project Structure

- `client/`: Frontend React application
  - `src/pages/`: Main views (Jobs, Dashboard, Settings)
  - `src/components/`: Reusable UI components
  - `src/lib/`: Utilities and API client
- `server/`: Backend Express application
  - `routes.ts`: API endpoints
  - `storage.ts`: Database operations
  - `job-fetcher.ts`: Job aggregation logic
- `shared/`: Shared code between frontend and backend
  - `schema.ts`: Database schema and types

## Configuration

This application uses the following environment variables:

- `DATABASE_URL`: Connection string for PostgreSQL database
- `PORT`: Server port (default: 5000)

## Deployment

### Replit

This project is optimized for deployment on Replit.

1. Create a new Repl and import this repository.
2. Set up a PostgreSQL database within Replit.
3. The `DATABASE_URL` environment variable will be automatically configured.
4. Click "Run" to build and start the server.
5. The application handles database migrations automatically via `npm run db:push`.

## Getting Started

### Prerequisites

- Node.js (v20+)
- PostgreSQL database

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ebbeelsborg/remote-job-aggregator.git
   cd remote-job-aggregator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file with:
   ```env
   DATABASE_URL=your_postgresql_connection_string
   ```

4. Push the database schema:
   ```bash
   npm run db:push
   ```

### Running the App

- **Development**:
  ```bash
  npm run dev
  ```

- **Build**:
  ```bash
  npm run build
  ```

- **Production**:
  ```bash
  npm start
  ```

### Running Tests

```bash
npm test
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
