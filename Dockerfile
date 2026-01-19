# Development Dockerfile - Generates React app and runs dev server
FROM node:20-alpine AS development

WORKDIR /app

# Copy package.json if exists, otherwise we'll generate it
COPY package*.json ./

# Install dependencies if package.json exists
RUN if [ -f package.json ]; then npm ci; fi

# Copy all source files
COPY . .

# Expose development port
EXPOSE 5173

# Development command
CMD ["sh", "-c", "if [ ! -f package.json ]; then echo 'Generating React app...'; npm create vite@latest . --template react-ts && npm install; fi && echo 'Starting development server...' && npm run dev"]


# Production Dockerfile - Multi-stage build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies needed for build: TypeScript, Vite)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

FROM node:20-alpine AS production

WORKDIR /srv/app

# Install a tiny static server and dumb-init
RUN apk add --no-cache dumb-init && \
    npm install -g serve && \
    rm -rf /var/cache/apk/*

# Copy build files from builder stage
COPY --from=builder /app/dist /srv/app/dist

EXPOSE 80

ENTRYPOINT ["dumb-init", "--"]
CMD ["serve", "-s", "dist", "-l", "80"]