# Notifications Guide

This app supports two kinds of notifications:

- Realtime in-app toasts via Socket.IO (when the app is open)
- Background push notifications via Expo (even when the app is not active)

## Overview

- Events are shop-scoped: clients join Socket.IO rooms per `shop_id` so only relevant users are notified.
- On the server, new Service and Request creation emits a socket event and sends Expo push notifications to users in the corresponding shop.
- On the client, authenticated users connect to the socket server, join their shops, and show a toast for incoming events. Devices also register an Expo push token that the server uses to send pushes.

## Server

- Socket.IO initialization: [server/server.js](server/server.js) loads [server/socket.js](server/socket.js).
- Room join handler: [server/socket.js](server/socket.js) listens for `join-shops` and joins rooms like `shop:<shop_id>`.
- Services route: emits to `shop:<shop_id>` and sends push
  - [server/routes/services.js](server/routes/services.js)
- Request Items route: emits to `shop:<shop_id>` and sends push
  - [server/routes/requestItems.js](server/routes/requestItems.js)
- Push utilities: Expo server SDK helpers, token pruning
  - [server/utils/push.js](server/utils/push.js)
- User model: stores Expo push tokens
  - [server/models/user.js](server/models/user.js)
- Save token endpoint: `POST /api/users/push-token`
  - [server/controllers/userController.js](server/controllers/userController.js)
  - [server/routes/users.js](server/routes/users.js)

### Emitted Events

- `service:new` → payload: `{ service: { ...populated fields } }`
- `request:new` → payload: `{ request: { ...populated fields } }`

These are emitted to rooms named `shop:<shop_id>`.

### Push Notifications

- On create, server calls `sendPushToShop(shopId, title, body)` from [server/utils/push.js](server/utils/push.js)
- Invalid tokens are removed automatically after failed sends (e.g., `DeviceNotRegistered`).
- Daily pruning removes malformed/duplicate tokens (scheduled in [server/server.js](server/server.js)).

## Client

- Socket client: [client/utils/socket.js](client/utils/socket.js)
  - Connects to the API host (derived from `API_BASE_URL`) and supports WebSocket transport.
- App hook-up: [client/App.js](client/App.js)
  - On auth + shops loaded, emits `join-shops` with user’s shop ids.
  - Listens for `service:new` and `request:new` and shows a toast.
- Toasts: [client/store/slices/toastSlice.js](client/store/slices/toastSlice.js) + [client/components/Toast.jsx](client/components/Toast.jsx)
- Expo push registration: [client/utils/notifications.js](client/utils/notifications.js)
  - Requests permissions, obtains an Expo token, and POSTs to `/api/users/push-token`.

## Configuration

- Client `.env`: [client/.env](client/.env)
  - `API_BASE_URL` (e.g., `http://192.168.1.20:5000/api`)
  - Optional `SOCKET_URL` (reserved; currently socket uses `API_BASE_URL` host)
- Babel config for env vars: [client/babel.config.js](client/babel.config.js)
- Axios base URL: [client/store/api/axiosClient.js](client/store/api/axiosClient.js)

## Install & Run

Server:

```powershell
cd E:\code\application\mobileshopmanager\server
npm i socket.io expo-server-sdk
npm run dev
```

Client:

```powershell
cd E:\code\application\mobileshopmanager\client
npx expo install expo-notifications
npm i socket.io-client
npx expo start -c
```

- ⚠️ **Push notifications don't work in Expo Go (SDK 53+)**. You need a development build or production app. See [Development Builds](https://docs.expo.dev/develop/development-builds/introduction/).
- Realtime Socket.IO toasts work fine in Expo Go.
- Set `API_BASE_URL` in `client/.env`, then restart Metro bundler.

## How It Works (Flow)

1. User logs in → client fetches shops → registers Expo token → posts token to backend.
2. Client connects Socket.IO and emits `join-shops` with the list of shop ids.
3. Staff creates a Service/Request → server saves it → emits `service:new`/`request:new` to `shop:<shop_id>` and sends push to all users in that shop.
4. Connected clients in that room show a toast instantly; devices receive an Expo push in background.

## Troubleshooting

- **No pushes in Expo Go**: Push notifications were removed from Expo Go in SDK 53. Create a development build with `npx expo run:android` or `npx expo run:ios`, or build a production app.
- No pushes on simulator: Simulators don't support push; use a physical device with a dev/prod build.
- No realtime toasts: check that the client joined rooms (network logs), and that server emits to `shop:<id>`.
- Token errors: invalid tokens are auto-pruned; re-open the app to re-register the token.
- Networking: ensure `API_BASE_URL` points to a reachable LAN IP from the device.

## Security & Scope

- Room-based scoping ensures only users of the same `shop_id` receive events.
- Push notifications are sent to users whose `shops` includes the event’s `shop_id`.

## Extensions

- Per-user preferences: store notification prefs and filter sends.
- Quiet hours: schedule or suppress pushes during certain times.
- Admin endpoint: trigger manual token pruning on-demand.