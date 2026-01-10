## Mobile Shop Manager — Version 1.0

### 1. Document Control
- Application Name: Mobile Shop Manager
- Version: 1.0 (MVP)
- Document Type: Product specification / SRS-lite
- Prepared By: Core team
- Date: 2025-12-23
- Platform: Expo (React Native) + Node/Express + MongoDB
- Status: Draft

### 2. Introduction
- Purpose: Describe scope, capabilities, and constraints for the first public release of Mobile Shop Manager.
- Scope: Expo mobile client and Express/MongoDB backend covering authentication, shop operations, sales, services, inventory, staff, analytics, and notifications.

### 3. Application Overview
- Application Description: Mobile-first shop management app for small-to-mid retail/service shops to handle sales, services, inventory, staff, customers, and analytics with realtime and push notifications.
- Objectives: Reduce manual tracking, centralize inventory and sales, speed up checkout/service flows, and provide clear operational analytics.
- Target Users: Shop owners/managers (full access) and staff (role-scoped access); secondary: accountants/admins needing reports.

### 4. Features (Version 1.0)
#### 4.1 Core Features
- User Registration: Account creation with role assignment (owner/staff).
- User Login / Logout: JWT authentication; session renewal via stored token; logout clears token and socket session.
- Dashboard: Home screen with quick links to sales, services, products, and notifications.
- Primary Functional Module: Shop operations (products, categories, services, sales/expenses, customers, staff, notifications, analytics).

#### 4.2 Functional Features
- Create / Read / Update / Delete (CRUD) Operations: Shops, staff, categories, products, customers, services, requests, and sales items; soft validation on required fields.
- Search and Filter: Product search modal, service search, date-range filters for stats, and list filtering in screens.
- Data Validation: Client-side validation on required fields, date ranges, and numeric inputs; server-side schema validation via Mongoose.

#### 4.3 Security Features
- Password Encryption: Passwords hashed before storage.
- Token-Based Authentication: JWT for API access; tokens stored client-side and attached via Axios interceptor.
- Role-Based Access Control: Owner vs staff permissions; server routes gated via middleware and client UI scoped per role/shop.

#### 4.4 Performance & Usability
- Fast Load Time: API base URL configured; cached shop list; reduced dev-time warnings for Redux.
- Responsive Design: React Native layouts tuned for common phone sizes; scrollable/stat cards responsive.
- Error Handling & Alerts: Toast notifications, form validation errors, and socket error toasts; retries where feasible.

### 5. System Architecture
- Architecture Type: Client–server with RESTful API plus Socket.IO for realtime events; stateless JWT auth.
- High-Level Flow Diagram (textual):
	1) Client authenticates → obtains JWT.
	2) Client fetches shops, products, staff, customers, services.
	3) Client registers push token and joins socket rooms per shop.
	4) User performs sales/service actions → API persists to MongoDB → socket broadcasts → push optional.
	5) Client renders updated lists/stats; errors surfaced via toasts.

### 6. Technology Stack
- Frontend: Expo (React Native), React Navigation, Redux Toolkit, react-native-chart-kit, react-native-svg.
- Backend: Node.js 18+, Express.js, Socket.IO.
- Database: MongoDB (Mongoose ODM).
- Tools & Libraries: Axios, JWT, bcrypt (password hashing), Expo Notifications, EAS/Gradle build, Nodemon for dev.

### 7. System Requirements
- Hardware Requirements: Mobile device running Android 8+ (3 GB RAM recommended); development laptop; server with 1 vCPU/1 GB RAM+ for small deployments.
- Software Requirements: Node.js 18+, MongoDB instance, Expo CLI (via npx), Git; Android/iOS device for running the app.

### 8. Installation & Setup
- Installation Steps:
	- Server: create `server/.env` with `MONGO_URI`, `PORT`, `JWT_SECRET`; run `npm install` then `npm run dev`.
	- Client: create `client/.env` with `API_BASE_URL` (and optional `SOCKET_URL`); run `npm install`, `npx expo install expo-notifications`, then `npx expo start -c`.
- Configuration: Ensure API base URL and socket host point to reachable LAN IP; push notifications require development or production build (not Expo Go for SDK 53+).

### 9. User Interface Overview
- Screen List: Home, Login, Register, Dashboard, Products, Categories, Services, Sales, Transactions, Customers, Staff, Import/Export, Notifications, Scanner, Stats, Profile/Settings, Theme settings, QR Generator.
- Navigation Flow: Auth stack (Login/Register) → main tabs/drawers → stack screens for detail views and modals (search modals, transaction detail, QR generator).

### 10. Security
- Authentication: JWT-based login; tokens attached via Axios interceptor; logout clears token.
- Authorization: Role-based middleware on server; UI hides restricted actions for staff; socket joins scoped per shop.
- Data Protection: Hashed passwords; scoped socket rooms; minimal PII stored; push tokens pruned; HTTPS recommended in production.