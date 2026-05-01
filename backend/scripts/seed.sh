#!/bin/bash

# Load environment variables from .env
if [ -f ".env" ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Default values if not in .env
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-LTIdb}

echo "Seeding database $DB_NAME with initial data..."

# Run the seed SQL script
PGPASSWORD="$DB_PASSWORD" ON_ERROR_STOP=1 psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" --single-transaction -f "prisma/seed.sql"

if [ $? -eq 0 ]; then
  echo "✅ Database seeding completed successfully!"
else
  echo "❌ Database seeding failed!"
  exit 1
fi
