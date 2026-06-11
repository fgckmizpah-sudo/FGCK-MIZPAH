# Mizpah Church Management

React + Node church member and giving management system.

## Setup

1. Open the workspace in a terminal.
2. Run:

```bash
npm install --workspaces
```

3. Start the backend and frontend together:

```bash
npm run dev
```

## Backend

- Server runs on `http://localhost:4000`
- Default admin credentials:
  - username: `pastor`
  - password: `password123`
- The backend now uses PostgreSQL instead of local JSON storage.
- Set `DATABASE_URL` in `server/.env` before running.

## Frontend

- Client runs on `http://localhost:5173`
- Login as admin, then manage members, giving records, and reports.

## Notes

- The backend now uses PostgreSQL and reads `DATABASE_URL` from `server/.env` or Railway environment.
- Add `JWT_SECRET` to `server/.env` or to Railway environment variables for a custom auth key.
- Use `client/.env.example` and `server/.env.example` as templates.

## Deployment

### Railway

1. Push this repo to GitHub.
2. Create a new Railway project and connect the GitHub repository.
3. Add a PostgreSQL plugin in Railway and copy its `DATABASE_URL` value.
4. Set Railway environment variables:
   - `DATABASE_URL` (from Railway Postgres plugin)
   - `JWT_SECRET` (any secure value)
   - `PORT=4000`
   - `VITE_API_BASE_URL=/api`
5. Railway will build using `Dockerfile` and `railway.json`.
6. After deployment, Railway assigns a public URL such as:

```bash
https://<your-project>.railway.app
```

### Local production preview

1. Install dependencies:

```bash
npm install --workspaces
```

2. Build the frontend:

```bash
npm --workspace client run build
```

3. Start the server in production mode:

```bash
cd server
NODE_ENV=production npm start
```

4. Open the app at:

```bash
http://localhost:4000
```

The server serves the frontend from `client/dist` and exposes the API at `/api`.
