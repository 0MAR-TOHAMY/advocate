# ================= base =================
FROM node:20-bookworm AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# ================= builder =================
FROM base AS builder
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY web/package.json web/package.json
COPY database/package.json database/package.json
COPY tokens/package.json tokens/package.json
COPY storage/package.json storage/package.json

# Install dependencies (install all workspace packages to ensure lockfile consistency)
RUN pnpm install --no-frozen-lockfile

# Copy the rest of the application
COPY . .

# Set environment variables for build
ENV NODE_ENV=production
ENV AWS_ACCESS_KEY_ID=build_mock_key
ENV AWS_SECRET_ACCESS_KEY=build_mock_secret
ENV DATABASE_URL=postgresql://mock:mock@localhost:5432/mock
ENV NEXT_TELEMETRY_DISABLED=1

# Build the web application
RUN cd web && pnpm build

# ================= runner =================
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 nextjs

# The standalone output includes only the necessary files for production
COPY --from=builder --chown=nextjs:nodejs /app/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/web/.next/static ./web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/web/public ./web/public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "web/server.js"]

