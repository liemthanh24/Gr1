# Build stage
FROM golang:1.25-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o /api ./cmd/api
RUN CGO_ENABLED=0 GOOS=linux go build -o /worker ./cmd/worker

# Runtime stage
FROM alpine:3.21

RUN apk --no-cache add ca-certificates

COPY --from=builder /api /api
COPY --from=builder /worker /worker
COPY --from=builder /app/migrations /migrations

EXPOSE 3000

# Default: run API (override with CMD for worker)
CMD ["/api"]
