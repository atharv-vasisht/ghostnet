#!/bin/bash
set -e

# Ensure we run from project root
cd "$(dirname "$0")/.."

echo "🕸️  GHOSTNET Setup"
echo "=================="

# Copy env if not exists
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✓ Created .env from .env.example"
  echo "  Edit .env to configure email (RESEND_API_KEY) and change secrets before production use"
fi

# Build and start services
echo "→ Starting services..."
docker compose -f infra/docker-compose.yml up --build -d

# Wait for database
echo "→ Waiting for database..."
until docker compose -f infra/docker-compose.yml exec -T postgres pg_isready -U ghostnet; do
  sleep 2
done

# Run migrations
echo "→ Running database migrations..."
docker compose -f infra/docker-compose.yml exec api npx prisma migrate deploy

# Seed demo data
echo "→ Seeding demo data..."
docker compose -f infra/docker-compose.yml exec api npx tsx ../../scripts/seed-demo.ts

# Create default admin
ADMIN_EMAIL=${ADMIN_EMAIL:-admin@example.com}
ADMIN_PASSWORD=${ADMIN_PASSWORD:-$(openssl rand -base64 12)}

docker compose -f infra/docker-compose.yml exec api npx tsx ../../scripts/create-admin.ts \
  --email "$ADMIN_EMAIL" \
  --password "$ADMIN_PASSWORD" \
  --org "My Organization"

echo ""
echo "✅ GHOSTNET is running!"
echo ""
echo "  Dashboard:        http://localhost:5173"
echo "  Demo:             http://localhost:5173/demo"
echo "  API:              http://localhost:3000"
echo "  Deception Layer:  http://localhost:4000"
echo "  MinIO Console:    http://localhost:9001"
echo ""
echo "  Admin Email:    $ADMIN_EMAIL"
echo "  Admin Password: $ADMIN_PASSWORD"
echo ""
echo "  Next steps:"
echo "  1. Open the dashboard and complete onboarding"
echo "  2. Run ./scripts/simulate-agent.sh to see your first session"
echo "  3. Check the README for AWS deployment instructions"
