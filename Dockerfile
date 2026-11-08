FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:24-alpine
ENV NODE_ENV=production
ENV DASKALOV_SAFE_DEMO_ONLY=1
ENV DASKALOV_DB_PATH=/data/daskalov.sqlite
WORKDIR /app
COPY --from=build /app/server ./server
COPY --from=build /app/shared ./shared
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
RUN mkdir -p /data && chown node:node /data
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node","server/main.mjs"]
