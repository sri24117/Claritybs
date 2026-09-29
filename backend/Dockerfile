FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY tsconfig.json ./
COPY schema.sql ./
COPY src ./src
COPY templates ./templates
COPY scripts ./scripts
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production PYTHONUNBUFFERED=1
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm install --no-save tsx@4
COPY --from=build /app/dist ./dist
COPY --from=build /app/schema.sql ./schema.sql
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/templates ./templates
EXPOSE 8000
CMD ["node", "dist/server.js"]
