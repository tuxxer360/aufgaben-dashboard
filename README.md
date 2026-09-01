# Krassowski Aufgaben Dashboard

Version 2: Supabase-Backend, Row Level Security, gemeinsame Synchronisation, Rollen/Adminbereich und vorbereitete Apple-Authentifizierung.

## Sicherheit
Aufgabendaten werden nicht mehr als JavaScript-Seed ausgeliefert, sondern aus Supabase geladen. Der veröffentlichte Supabase-Key ist ein Publishable Key und darf im Client stehen; der Datenzugriff wird per Auth + RLS geschützt.

## Apple Login
Der Client ist für `signInWithOAuth({ provider: 'apple' })` vorbereitet. Vor Nutzung müssen in Apple Developer eine App ID, Services ID und ein Sign-in-with-Apple-Key erstellt und der Apple Provider in Supabase aktiviert werden. Für Web-OAuth muss der Apple Client Secret regelmäßig erneuert werden.

## iPhone / App Store
Die Website ist als PWA vorbereitet und kann über Safari „Zum Home-Bildschirm“ installiert werden. Zusätzlich ist Capacitor vorkonfiguriert. Für eine Veröffentlichung im Apple App Store ist eine Mitgliedschaft im Apple Developer Program erforderlich.

## Native iOS vorbereiten
`npm install`, dann `npm run build:ios-web`, `npm run cap:add:ios`, `npm run cap:sync`, `npm run cap:open`.
