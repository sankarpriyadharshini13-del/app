# Maison — React Native (Expo) + Express + Postgres

## 1. Deploy the API (Vercel)
1. Push this repo to GitHub → Import on Vercel (no settings needed).
2. Project → Storage → Create **Postgres** → Connect. (DATABASE_URL/POSTGRES_URL auto-injected.)
3. Set the Vercel environment variable `CORS_ORIGINS` to `http://localhost:8081`
   (add your deployed website origin too, separated by commas, if applicable).
4. Redeploy. Tables + 15 products are created automatically on first request.
5. Check `https://YOUR-APP.vercel.app/api/products`.

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
