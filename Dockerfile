FROM node:12-alpine
ENV PORT 8080
ENV NODE_ENV=production

WORKDIR /app

COPY src/package.json src/
COPY src/package-lock.json src/

WORKDIR /app/src
RUN npm install --production

WORKDIR /app
COPY . .


CMD ["node", "src/server.js"]