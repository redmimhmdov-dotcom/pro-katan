# Supabase setup

## CLI project link

The repository is configured for project ref `gcsrztcakpyqsqgqipcy`.
Install or run the Supabase CLI, then authenticate without pasting the token into project files:

```powershell
npx supabase login
npx supabase link --project-ref gcsrztcakpyqsqgqipcy
```

The login command opens a secure token prompt. Enter the access token directly in the terminal. Do not commit it, put it in `.env`, or send it in chat.

If the CLI is installed globally, use `supabase` instead of `npx supabase`.

## 1. Create the database schema

1. Open the Supabase project SQL Editor.
2. Open `supabase/schema.sql` from this repository.
3. Run the complete SQL script.

This creates the catalog, customers, orders, invoices, inventory, media, profiles, audit logs, storage bucket, and Row Level Security policies.

## 2. Create the first administrator

1. Open **Authentication -> Users** in Supabase.
2. Create the accountant/admin email and password.
3. Copy the created user's UUID.
4. Run this SQL, replacing the values:

```sql
insert into public.profiles (id, full_name, role, active)
values ('USER_UUID_HERE', 'Katanbuild Admin', 'admin', true);
```

Never put an admin password or a `service_role` key in this repository.

## 3. Open the dashboard

Use the deployed or local URL followed by:

```text
admin.html
```

For local testing, open the project through Live Server rather than `file://` so browser requests work consistently.

## 4. Public client configuration

The public project URL and publishable key are stored in `js/supabase-config.js`. These values are safe for browser use only because database access is protected by RLS. Keep service keys private.
