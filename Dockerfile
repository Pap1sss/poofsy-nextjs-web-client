FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time public env comes from .env, which `next build` reads out of the
# build context — see .dockerignore, which lets .env in and keeps every *.local
# file out, since Next loads .env.local first and a developer's overrides must
# not reach a deployed build. NEXT_PUBLIC_* values are inlined into the bundle
# here, so changing any of them requires a rebuild, not just a restart.
#
# Deliberately no ARG/ENV declarations for those values: @next/env only applies a
# key from the file when it is absent from process.env, and an unset build arg
# arrives as an empty string, which counts as present. Declaring them here would
# silently inline "" and still exit 0.
RUN test -f .env || { \
      echo "ERROR: .env is missing. Copy .env.example to .env and fill it in."; \
      exit 1; \
    }

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# next.config.ts sets output: "standalone", so the build emits a minimal server
# with only the traced dependencies. Copying that instead of the full
# node_modules keeps the runtime image small.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

ENV PORT=3000
ENV HOSTNAME=0.0.0.0
EXPOSE 3000
CMD ["node", "server.js"]
