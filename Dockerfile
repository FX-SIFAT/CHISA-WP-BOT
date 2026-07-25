FROM node:20-slim

# System dependencies needed by Baileys / sharp / canvas
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        ffmpeg \
        wget \
        curl \
        ca-certificates \
        git \
        python3 \
        build-essential && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Copy local packages that npm needs before install
COPY src/core/ ./src/core/

# Install dependencies
RUN npm install --legacy-peer-deps --no-audit --no-fund

# Copy rest of application
COPY . .

# Ensure runtime directories exist
RUN mkdir -p session data public

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
    CMD curl -fs http://localhost:5000/api/status || exit 1

CMD ["node", "chisa.js"]
