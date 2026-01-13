.PHONY: run build install clean

run:
	@go run main.go

build:
	@go build -o mcp-control main.go

install:
	@go install .

clean:
	@rm -f mcp-control

deps:
	@go mod download
	@go mod tidy
