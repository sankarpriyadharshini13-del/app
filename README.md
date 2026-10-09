# Maison — React Native (Expo) + Express + Postgres

## 1. Deploy the API (Vercel)
1. Push this repo to GitHub → Import on Vercel (no settings needed).
2. Connect a **Postgres** database to the Vercel project. Ensure either
   `DATABASE_URL` or `POSTGRES_URL` is present in the project's Environment Variables.
3. Set `CORS_ORIGINS` to `http://localhost:8081,http://localhost:8082`
   for local web development (add your deployed website origin too, comma-separated).
4. Redeploy. Tables are created automatically on the first request, and any
   missing demo products are added without duplicating existing products.
5. Check `https://YOUR-APP.vercel.app/api/health/db`, then
   `https://YOUR-APP.vercel.app/api/products`.

## 2. Run the mobile app
```
cd mobile
npm install
cp .env.example .env     # set EXPO_PUBLIC_API_URL=https://YOUR-APP.vercel.app
npx expo start           # scan the QR with Expo Go (SDK 52)
```

## 3. Run in a web browser
Deploy the API as described above and set `EXPO_PUBLIC_API_URL` in `mobile/.env`
to your Vercel app URL. Then, from the `mobile` directory, run:
```
npm install
npm run web
```
Expo will open the app in your default browser. On Windows PowerShell, create the
environment file with `Copy-Item .env.example .env` before editing the API URL.
The database URL belongs in Vercel's API environment variables, not in
`mobile/.env`; that local file should contain only `EXPO_PUBLIC_API_URL`.
