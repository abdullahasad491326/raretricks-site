# raretricks-proxy

Minimal server+frontend that proxies calls to `data-api.impossible-world.xyz` so client-side does not hold secrets.

1. Copy `.env.example` → `.env`, set variables if needed.
2. `npm install`
3. `npm start`
4. Open `http://localhost:3000`

Deploy on Render:
- Create a new Web Service (Node).
- Set build/start command: `npm start`
- Add environment variables in Render settings (do NOT push your .env to GitHub).
