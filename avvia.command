#!/bin/bash
# Aggiorna i dati e apre il sito in locale (doppio clic dal Finder).
cd "$(dirname "$0")"
for d in "$HOME/App Zaino/.tools/node/bin" "$(pwd)/.tools/node/bin"; do [ -x "$d/node" ] && export PATH="$d:$PATH"; done
command -v node >/dev/null || { echo "Node.js non trovato: installalo da https://nodejs.org"; exit 1; }
[ -d node_modules ] || npm install
npm run data
(sleep 2 && open "http://127.0.0.1:5174") &
npx vite --port 5174 --host 127.0.0.1
