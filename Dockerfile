# Discord Verwaltungsbot – Container-Image
FROM node:22-alpine

WORKDIR /app

# Abhängigkeiten (inkl. dev, da für Build & Prisma-CLI benötigt)
COPY package*.json ./
RUN npm ci

# Prisma-Client generieren
COPY prisma ./prisma
RUN npx prisma generate

# Quellcode kopieren und bauen
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Startskript
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

ENV NODE_ENV=production
CMD ["./docker-entrypoint.sh"]
