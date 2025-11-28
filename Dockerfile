# Use Bun official image
FROM oven/bun:1 as base
WORKDIR /app

# Copy workspace root package files
COPY package.json bun.lockb* ./

# Copy workspace packages
COPY packages/ ./packages/

# Copy API package files
COPY apps/api/package.json ./apps/api/

# Install all dependencies (handles workspace)
RUN bun install --frozen-lockfile

# Copy API source code
COPY apps/api/ ./apps/api/

# Set working directory to API
WORKDIR /app/apps/api

# Expose port (Railway will override with $PORT)
EXPOSE 8080

# Start the server
CMD ["bun", "run", "start"]
