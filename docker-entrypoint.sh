#!/bin/sh
set -e

echo "➡️  Datenbank-Schema synchronisieren..."
npx prisma db push --skip-generate

echo "➡️  Slash-Commands bei Discord registrieren..."
node dist/deploy-commands.js

echo "➡️  Bot starten..."
node dist/index.js
