.PHONY: setup up down logs test test-integration test-e2e dev
setup:
	sh scripts/setup.sh
up:
	docker compose up -d --build
down:
	docker compose down
logs:
	docker compose logs -f --tail=100
dev:
	docker compose -f compose.yaml -f compose.dev.yaml up --build --watch
test:
	sh scripts/test-lifecycle.sh
	cd backend && go test ./...
	cd frontend && npm test -- --run && npm run build
test-integration:
	@test -n "$$TEST_DATABASE_URL" || (echo 'Set TEST_DATABASE_URL to a disposable PostgreSQL test database' >&2; exit 1)
	cd backend && go test ./... -run 'TestPlanImagePostgres|TestUnifilarPostgres' -count=1 -v
test-e2e:
	sh scripts/test-e2e.sh
