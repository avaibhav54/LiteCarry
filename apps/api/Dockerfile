# Use Bun official image
FROM oven/bun:1 as base
WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Expose port (Railway will override with PORT env var)
EXPOSE 3001

# Start the server
CMD ["bun", "run", "start"]
