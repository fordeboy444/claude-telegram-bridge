FROM node:22-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive
ENV NPM_CONFIG_PREFIX=/opt/node-global
ENV PATH=/opt/node-global/bin:$PATH

# Install tmux, git, curl, ca-certificates
RUN apt-get update && apt-get install -y --no-install-recommends \
    tmux \
    git \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Setup non-root orca user matching Coolify volume ownership (UID 1000)
RUN usermod -l orca -d /home/orca -m node \
    && groupmod -n orca node \
    && mkdir -p /opt/node-global /app \
    && chown -R orca:orca /opt/node-global /app

# Install claude-code CLI globally
USER orca
RUN npm install -g @anthropic-ai/claude-code

# Copy application files and install production dependencies
WORKDIR /app
COPY --chown=orca:orca package*.json ./
RUN npm ci --omit=dev

COPY --chown=orca:orca . .

ENV HOME=/home/orca
ENV PROJECTS_DIR=/home/orca
ENV TMUX_PATH=tmux
ENV POLL_INTERVAL_MS=1000

CMD ["node", "src/index.js"]
