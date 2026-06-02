# Quickstart

Ten-minute path from clone to working demo.

## 1. Prereqs

- Docker Desktop installed and running
- Port 8000 (web) and 5432 (Postgres) free

## 2. First-time setup

When you download and unzip this folder, you should see these visible
files at the top level:

- `Dockerfile`
- `QUICKSTART.md` (this file)
- `README.md`
- `docker-compose.yml`
- `env.example.txt`
- `gitignore.txt`
- `manage.py`
- `requirements.txt`
- folders: `config`, `documents`, `fixtures`, `frontend`, `parcels`,
  `records`, `scripts`

If you don't see `env.example.txt`, you're missing files. Re-download
the zip and unzip it again, making sure to extract the whole folder.

## 3. Create your environment file

Open Terminal. Navigate into the folder. On Mac that's usually:

```
cd ~/Documents/civic_records
```

(Adjust the path to wherever you put it.)

Then copy the example file to a real environment file:

```
cp env.example.txt .env
```

This creates a hidden `.env` file with the database password and other
configuration. The hidden file is intentional — it keeps your local
credentials separate from the source code. You won't see it in Finder
unless you press Cmd+Shift+. (period) to toggle hidden files.

## 4. Start everything

```
docker compose up --build
```

The first run takes 5–10 minutes because Docker downloads PostgreSQL,
Python, and the GeoDjango libraries. Subsequent runs take 10–20 seconds.

Wait until you see this line in the terminal:

```
web-1  | Starting development server at http://0.0.0.0:8000/
```

If the web container crashes the first time because the database wasn't
ready yet, that's a normal race condition. Run `docker compose up` again
(without `--build`) and it will succeed.

## 5. Create the database tables

Open a **second** terminal window. Navigate to the same folder again:

```
cd ~/Documents/civic_records
```

Then run migrations:

```
docker compose exec web python manage.py migrate
```

You'll see lines like `Applying parcels.0001_initial... OK`. This builds
the database tables. Takes about 30 seconds.

## 6. Create an admin login

Still in the second terminal:

```
docker compose exec web python manage.py createsuperuser
```

It prompts for username, email, and password. Use anything you'll
remember. The password won't show as you type — that's normal.

## 7. Load the demo data

```
docker compose exec web python scripts/seed_demo_data.py
```

You should see "Done. Visit /parcel/6207103015/ for the Federal Drive
example."

## 8. See it work

Open these in your browser:

- `http://localhost:8000/` — the search interface
- `http://localhost:8000/parcel/6207103015/` — 9805 Federal Drive
- `http://localhost:8000/parcel/5421203009/` — 1826 Wooten Road
- `http://localhost:8000/parcel/6401303008/` — Lorson Ranch sample
- `http://localhost:8000/admin/` — Django admin (use the superuser
  credentials from step 6)
- `http://localhost:8000/api/parcels/` — REST API
- `http://localhost:8000/api/records/` — records API

## 9. Try a search

From the home page, search for:

- `Federal` — finds 9805 Federal Drive and its records
- `9805` — same parcel
- `pothole` — finds pothole-related records across parcels
- `80921` — finds Federal Drive by zip
- `6401303008` — the Lorson Ranch parcel ID

## 10. Add a record via admin

1. Go to `http://localhost:8000/admin/`
2. Click **Records** → **Add record**
3. Pick a parcel (start typing the parcel ID)
4. Fill in title, type, status, owner
5. Save — it appears immediately on the parcel detail page

## 11. Stopping

```
docker compose down            # stop containers, keep data
docker compose down -v         # stop and wipe the database volume
```

## About gitignore.txt

The file `gitignore.txt` is here for reference. If and when you push
this project to GitHub, rename it to `.gitignore` (with the leading
dot). That tells git which files to skip when tracking changes. You
don't need to rename it for Docker to work.

## Common issues

**`db: connection refused`.** Postgres takes 5–10 seconds to initialize
on first run. If `docker compose up` crashes the web container during
that window, run `docker compose up` again. It will work the second
time because the database is already initialized.

**`relation "parcels_parcel" does not exist`.** You haven't run
migrations yet. Run step 5 (`docker compose exec web python manage.py
migrate`) and then refresh the browser.

**`createsuperuser` fails with `relation "auth_user" does not exist`.**
Migrations didn't run yet. Run step 5 first.

**Docker says "compose file not found".** You're in the wrong folder.
`cd` into the civic_records folder before running any `docker compose`
command. Test with `pwd` to see where you are.

**Build hangs forever during step 4.** Slow internet. First-time builds
download about 500 MB of base images. Let it run.

## What to do next

Once you can see records on a parcel detail page in your browser, the
foundation is working. Tell me which of these to build next and I'll
send a single drop-in script:

- **Parcel loader** — imports real El Paso County parcel polygons
  (~250,000 parcels) from the County GIS shapefile.
- **2026 2C paving list parser** — reads the City's published PDF,
  extracts street segments, and creates Records.
- **BoardDocs scraper** — pulls meeting agenda items and links them to
  parcels by extracted addresses.
