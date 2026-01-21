# Game Haven - Cloudron Deployment
# Single-stage build optimized for Cloudron

FROM cloudron/base:4.2.0@sha256:46da2fffb36353ef714f97ae8e962bd2c212ca091108d768ba473078319a47f4

# Install Node.js 20 and nginx
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs nginx && \
    npm install -g npm@latest && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Setup nginx and startup
COPY deploy/cloudron/nginx.conf /etc/nginx/sites-available/default
COPY deploy/cloudron/start.sh /app/start.sh
RUN chmod +x /app/start.sh && \
    rm -f /etc/nginx/sites-enabled/default && \
    ln -s /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default

EXPOSE 80

CMD ["/app/start.sh"]
