FROM node:26-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund


FROM node:26-alpine
ENV NODE_ENV=production

WORKDIR /app
COPY --from=dependencies --chown=0:0 /app/node_modules ./node_modules
COPY --chown=0:0 --chmod=444 package.json ./
COPY --chown=0:0 src/ ./src/

RUN chmod -R a-w /app \
    && find / -xdev -type f \( -perm -4000 -o -perm -2000 \) -exec chmod a-s '{}' +

USER 1000:1000
EXPOSE 8000
STOPSIGNAL SIGTERM

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 8000) + '/health', {signal: AbortSignal.timeout(3000)}).then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "src/server.ts"]
