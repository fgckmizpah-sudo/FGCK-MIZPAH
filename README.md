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
- The backend uses PostgreSQL via `DATABASE_URL`.
- For shared, cross-device access, use an external free Postgres provider (Supabase, Neon, ElephantSQL, etc.).
- Set `DATABASE_URL` in `server/.env` before running locally.

## Frontend

- Client runs on `http://localhost:5173`
- Login as admin, then manage members, giving records, and reports.

## Notes

- The backend reads `DATABASE_URL` from `server/.env` or the deployment environment.
- Add `JWT_SECRET` to `server/.env` or the deployment environment for auth.
- Use `client/.env.example` and `server/.env.example` as templates.

## Deployment

### Deploy to Railway with Neon Postgres

This app is configured to deploy on Railway with a free Neon Postgres database for cross-device shared data.

**Prerequisites:**
- Railway account (sign up at https://railway.app)
- GitHub repository connected to Railway
- Neon Postgres connection string (from https://neon.tech)

**Steps:**

1. Create a free Neon project (if not already done):
   - Sign in at https://neon.tech
   - Create a new project and branch
   - Copy the database connection string

2. Push your code to GitHub:
   ```bash
   git push origin main
   ```

3. In the Railway dashboard:
   - Create a new project from your GitHub repository
   - Add a web service pointing to this repository
   - Set environment variables:
     - `DATABASE_URL` = your Neon connection string
     - `JWT_SECRET` = a secure random value
     - `PORT` = `4000` (optional, defaults to 4000)
     - `NODE_ENV` = `production`

4. Railway will automatically detect the `Dockerfile` and `railway.json` and deploy the app.

5. After deployment, Railway assigns a public URL such as:
   ```
   https://<project-name>-prod.up.railway.app
   ```

6. The app is now accessible at `https://<project-name>-prod.up.railway.app/` with the backend at `/api`.

**Notes:**

- The `Dockerfile` contains the complete build and runtime setup.
- `railway.json` configures the web service and required environment variables.
- Neon provides a free shared Postgres database accessible from Railway.
- The backend serves the frontend from `client/dist` in production mode.

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
