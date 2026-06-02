FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# System dependencies for GeoDjango: GDAL, GEOS, PROJ, plus client libs
RUN apt-get update && apt-get install -y --no-install-recommends \
    binutils \
    libgdal-dev \
    libgeos-dev \
    libproj-dev \
    gdal-bin \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

# Playwright browser + system libs for the Spatialest assessor scraper
# (enrich_epc_assessor). Chromium only — we don't need Firefox/WebKit.
RUN python -m playwright install --with-deps chromium

COPY . .

EXPOSE 8000

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
