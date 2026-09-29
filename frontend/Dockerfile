FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
ARG NEXT_PUBLIC_WA_NUMBER
ARG NEXT_PUBLIC_DIETICIAN
ARG API_INTERNAL_URL
ENV NEXT_PUBLIC_WA_NUMBER=$NEXT_PUBLIC_WA_NUMBER \
    NEXT_PUBLIC_DIETICIAN=$NEXT_PUBLIC_DIETICIAN \
    API_INTERNAL_URL=$API_INTERNAL_URL
RUN mkdir -p public && npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
