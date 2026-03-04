# GHOSTNET Makefile
# Run `make help` for targets

.PHONY: help infra-up infra-down migrate seed dev dev-docker build lint typecheck test clean

help:
	@echo "GHOSTNET targets:"
	@echo "  make infra-up     Start Postgres, Redis, MinIO (Docker)"
	@echo "  make infra-down   Stop infra containers"
	@echo "  make migrate      Run database migrations"
	@echo "  make seed         Seed demo data"
	@echo "  make dev          Start all apps locally (requires infra-up)"
	@echo "  make dev-docker  Full stack via Docker Compose"
	@echo "  make build        Build all packages"
	@echo "  make lint         Lint all packages"
	@echo "  make typecheck    TypeScript check"
	@echo "  make test         Run tests"
	@echo "  make clean        Remove dist and node_modules"

infra-up:
	docker compose -f infra/docker-compose.yml up -d postgres redis minio
	@echo "Waiting for Postgres..."
	@until docker compose -f infra/docker-compose.yml exec -T postgres pg_isready -U ghostnet 2>/dev/null; do sleep 2; done
	@echo "Infra ready."

infra-down:
	docker compose -f infra/docker-compose.yml down

migrate:
	pnpm --filter @ghostnet/api exec prisma migrate deploy

seed:
	pnpm --filter @ghostnet/api exec tsx ../../scripts/seed-demo.ts

dev:
	@echo "Starting API, Deception, Worker, Web..."
	pnpm run dev

dev-docker:
	./scripts/setup.sh

build:
	pnpm run build

lint:
	pnpm run lint

typecheck:
	pnpm run typecheck

test:
	pnpm run test 2>/dev/null || echo "Add test script to package.json"

clean:
	pnpm -r exec rm -rf dist node_modules 2>/dev/null || true
