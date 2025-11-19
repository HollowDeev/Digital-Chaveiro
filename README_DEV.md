Development notes — how to configure Supabase keys for local dev

This project requires the Supabase service role key for server-side admin actions
(creating users in Supabase Auth). The service role key must NOT be committed.

1) Create a `.env.local` file in the project root (this file is gitignored).

Example `.env.local` (replace with your real values):

NEXT_PUBLIC_SUPABASE_URL='https://<your-project>.supabase.co'
NEXT_PUBLIC_SUPABASE_ANON_KEY='your-anon-key'
SUPABASE_SERVICE_ROLE_KEY='your-service-role-key'

2) Restart the dev server:

PowerShell:
```powershell
npm run dev
```

3) Test the flow that creates employee credentials. If you still see a 500, open the server console — the API will now return a JSON object listing any missing env variables and a helpful `help` string.

Security note: keep the service role key secret. Do not expose it as NEXT_PUBLIC in production.
