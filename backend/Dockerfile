FROM golang:1.27-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -o /server ./cmd/server
FROM alpine:3.22
RUN adduser -D -u 10001 app
WORKDIR /app
COPY --from=build /server /app/server
COPY migrations /app/migrations
USER app
EXPOSE 8080
CMD ["/app/server"]
