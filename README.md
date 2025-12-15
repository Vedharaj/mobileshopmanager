# Mobile Shop Manager

All-in-one mobile shop management app (Expo + React Native frontend, Node + Express + MongoDB backend). Supports sales, services, inventory, customers, staff, analytics, and notifications.

## Monorepo Structure

- `client/` — Expo React Native app (Android/iOS)
- `server/` — Express.js API with MongoDB
- `docs/` — Project documentation

## Features

- Authentication (JWT) and role-based UI (owner/staff)
- Shop, staff, categories, products, customers management
- Sales and expenses tracking; invoice generation (sales only)
- Transaction history with detail modal
- Analytics (Stats):
  - Date range (From/To) with validation and default 1-month range
  - Line chart (Sales by day)
  - Line chart (Expenses by day)
  - Bar chart (Sales count by weekday)
  - Pie chart (Top 10 products by units)
- Realtime notifications (Socket.IO)
- Push notifications (Expo) with token storage and cleanup
- Import/Export (data utilities)

## Tech Stack

- Mobile: Expo (React Native), Redux Toolkit, react-navigation
- Charts: react-native-chart-kit, react-native-svg
- Backend: Node.js, Express.js, Mongoose (MongoDB)
- Realtime: Socket.IO
- Push: Expo Notifications + expo-server-sdk

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Expo CLI (via `npx expo`)
- **For Push Notifications**: Development build or production app (push removed from Expo Go in SDK 53+)

## Setup

### 1) Server

Create `server/.env` with at least:

```
MONGO_URI=mongodb://localhost:27017/mobileshopmanager
PORT=5000
JWT_SECRET=change_me
```

Install and run:

```powershell
cd server
npm i
npm run dev
```

This starts Express on `http://<your-ip>:5000`. Health check: `GET /health`.

### 2) Client

Create `client/.env`:

```
API_BASE_URL=http://<your-ip>:5000/api
# Optional override if socket host differs from API
SOCKET_URL=
```

Install and run:

```powershell
cd client
npm i
npx expo install expo-notifications
npx expo start -c
```

Open the Expo project on a device. 

**Note**: Push notifications won't work in Expo Go (SDK 53+). To test push:
- Create a [development build](https://docs.expo.dev/develop/development-builds/introduction/) with `npx expo run:android` or `npx expo run:ios`, OR
- Build a production APK/IPA

Realtime Socket.IO toasts work fine in Expo Go.

## Environment Notes

- Client env is provided via `module:react-native-dotenv`. See `client/babel.config.js`.
- Axios base URL: `client/store/api/axiosClient.js` reads `API_BASE_URL`.

## Notifications

- Realtime toasts via Socket.IO when app is open (works in Expo Go)
- Background push via Expo, with automatic token pruning (**requires development build or production app**)

Details: see [docs/Notifications.md](docs/Notifications.md)

### How it works (brief)

- Client authenticates, fetches shops, registers Expo push token, and saves it to backend
- Client connects socket and joins rooms per `shop_id`
- On new Service/Request, server emits events to the matching shop room and sends push to users in that shop

## Analytics (Stats Screen)

- From/To pickers; scrollable screen with padding
- Sales by Day (line)
- Expenses by Day (line)
- Sales Count by Weekday (bar)
- Top 10 Products by units (pie) with unique colors

Files: `client/screens/StatsScreen.jsx`

## Developer Experience

- Redux Toolkit dev checks are disabled to avoid warnings with large payloads
- Socket hooks positioned safely to respect Rules of Hooks

## Common Issues & Fixes

- Network Error (Axios): ensure server is running and `API_BASE_URL` points to a reachable LAN IP from the device
- Push not received: use physical device; re-open app to re-register token; verify server logs
- Realtime not received: confirm socket joins rooms via `join-shops`; server emits to `shop:<id>`
- Hooks order warning: resolved by running effects before early returns

## Scripts

Server (`server/package.json`):

- `npm run dev` — nodemon on `server.js`
- `npm start` — node `server.js`

Client:

- `npx expo start` — start Expo bundler

## Security & Scope

- Socket events are scoped per shop room
- Push notifications sent only to users associated with that shop

## Next Steps

- Add admin endpoint to prune tokens on-demand
- User-level notification preferences and quiet hours
- Add screenshots and API route docs
