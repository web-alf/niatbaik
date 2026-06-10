.PHONY: dev build docker test test-docker tidy

dev:
	go run ./cmd/server/

build:
	CGO_ENABLED=0 go build -o bin/server ./cmd/server/

docker:
	docker build -t niatbaik-api .

test:
	go test ./...

# Run build/vet/test inside a container when Go isn't installed on the host.
# Uses cached module + build volumes so reruns are fast.
test-docker:
	docker volume create nb-gomod >/dev/null
	docker volume create nb-gocache >/dev/null
	docker run --rm -v "$(CURDIR)":/app -w /app \
		-v nb-gomod:/go/pkg/mod -v nb-gocache:/root/.cache/go-build \
		-e GOFLAGS=-mod=mod golang:1.22-alpine \
		sh -c 'go build ./... && go vet ./... && go test ./...'

tidy:
	go mod tidy
