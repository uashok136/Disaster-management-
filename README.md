# Disaster Realtime Application

This project runs fully in local realtime mode.

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Create local env file:

```powershell
Copy-Item .env.example .env.local
```

3. Start development server:

```bash
npm run dev
```

4. Open:

```text
http://localhost:5173
```

## Build and typecheck

```bash
npm run typecheck
npm run build
```

## Notes

- Data is stored in browser local storage.
- Realtime updates are propagated across tabs using browser events/BroadcastChannel.
