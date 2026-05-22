.PHONY: dev build docker test tidy

dev:
	go run ./cmd/server/

build:
	CGO_ENABLED=0 go build -o bin/server ./cmd/server/

docker:
	docker build -t niatbaik-api .

test:
	go test ./...

tidy:
	go mod tidy
