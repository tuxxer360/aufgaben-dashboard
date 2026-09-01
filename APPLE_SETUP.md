# Apple Login und iOS-App – Setup

Die Anwendung ist technisch für Apple Login und eine spätere native iOS-App vorbereitet. Die folgenden Apple-Account-Schritte müssen im Apple Developer Portal vom Accountinhaber ausgeführt werden, weil dafür persönliche Entwickler-Zugangsdaten und ein privater Sign-in-Key erforderlich sind.

## Vorgesehene Kennungen
- App ID / Bundle ID: `net.krassowski.aufgaben`
- Services ID für Web: `net.krassowski.aufgaben.web`
- Web-App: `https://tuxxer360.github.io/aufgaben-dashboard/`
- Supabase Auth Callback: `https://mpzrkjxpabayevslssap.supabase.co/auth/v1/callback`

## Apple Developer
1. App ID `net.krassowski.aufgaben` anlegen und „Sign in with Apple“ aktivieren.
2. Services ID `net.krassowski.aufgaben.web` anlegen und mit der App ID verknüpfen.
3. Bei der Services ID die Website/Return URL konfigurieren. Der Return-Callback für Supabase ist `https://mpzrkjxpabayevslssap.supabase.co/auth/v1/callback`.
4. Einen privaten Sign-in-with-Apple-Key erstellen und die Key ID sowie Team ID notieren. Die `.p8`-Datei sicher und nicht im GitHub-Repository speichern.
5. Aus Key, Team ID, Key ID und Services ID den Apple Client Secret erzeugen.

## Supabase
Im Projekt `Krassowski Aufgaben Dashboard` unter Authentication > Providers > Apple:
- Apple Provider aktivieren
- Client ID: `net.krassowski.aufgaben.web`
- Apple Client Secret eintragen

Unter Authentication > URL Configuration:
- Site URL: `https://tuxxer360.github.io/aufgaben-dashboard/`
- Redirect URL zusätzlich erlauben: `https://tuxxer360.github.io/aufgaben-dashboard/`

Danach funktioniert der bereits eingebaute Button „Mit Apple anmelden“ ohne weitere Codeänderung.

## Sicherheit
- Private `.p8`-Keys und Apple Client Secrets niemals in GitHub committen.
- Der Apple OAuth Client Secret für Web muss regelmäßig erneuert werden. Supabase weist für Apple Web-OAuth auf eine Rotation spätestens alle sechs Monate hin.
- Neue Apple-Nutzer ohne bestehende Einladung landen in der Zugriffsprüfung. Ein Admin kann sie anschließend in der App freigeben.

## iOS / Capacitor
Die native Hülle ist über `capacitor.config.ts` vorbereitet.

1. `npm install`
2. `npm run build:ios-web`
3. `npm run cap:add:ios`
4. `npm run cap:sync`
5. `npm run cap:open`

Anschließend kann das Projekt in Xcode signiert und auf einem iPhone getestet werden. Für eine dauerhafte Verteilung über den App Store ist eine Apple Developer Program Mitgliedschaft erforderlich.
