# Build stage
FROM golang:1.22-alpine AS builder

WORKDIR /app
COPY go.mod ./
COPY go.sum* ./

COPY . .
RUN go mod tidy && CGO_ENABLED=0 GOOS=linux go build -o /app/server ./cmd/server/

# Runtime stage
FROM alpine:3.20

RUN apk --no-cache add ca-certificates tzdata
ENV TZ=Asia/Jakarta

WORKDIR /app
COPY --from=builder /app/server .

RUN mkdir -p /app/uploads && chown -R 65534:65534 /app
USER 65534

EXPOSE 8080
CMD ["./server"]
