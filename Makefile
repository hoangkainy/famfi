.PHONY: dev dev-web dev-api install build clean

# Start both API and Web servers concurrently
dev:
	npm run dev

# Start only the Web server
dev-web:
	npm run dev:web

# Start only the API server
dev-api:
	npm run dev:api

# Install all dependencies
install:
	npm install

# Build all packages
build:
	npm run build

# Clean node_modules
clean:
	rm -rf node_modules apps/*/node_modules
