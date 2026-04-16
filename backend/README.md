# FastAPI Backend

## Stack

- FastAPI
- SQLAlchemy
- PostgreSQL
- JWT access/refresh tokens

## Run

1. Install Python 3.11+.
2. Create a virtual environment.
3. Install dependencies:

```bash
pip install -r backend/requirements.txt
```

4. Install local Postgres dev cluster for this project:

```powershell
cd backend
"C:\Program Files\PostgreSQL\18\bin\initdb.exe" -D ".pgdata" -U postgres -A trust --encoding=UTF8
```

5. Start the full local backend stack:

```powershell
powershell -ExecutionPolicy Bypass -File .\backend\dev-local.ps1
```

Alternative API-only run:

```bash
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```

6. Start the frontend with real API mode enabled:

```bash
npm run dev --workspace @kurs/web
```

The web app already points to `http://localhost:8000/api` through `apps/web/.env`.

## Database

- If `DATABASE_URL` ends with `/` and no database name is given, the app defaults to `kurs_boshqaruv`.
- On startup the backend creates the database if it does not exist, creates tables, and seeds demo data.
- Configure `DATABASE_URL` and `DEMO_USER_PASSWORD` in your local `.env` before startup if you want predictable local credentials.

## Local Security Note

- Checked-in examples intentionally avoid real passwords, bot tokens, and local secrets.
- If `DEMO_USER_PASSWORD` is omitted, seed routines may generate a local-only password during initialization and print it to the local console.
