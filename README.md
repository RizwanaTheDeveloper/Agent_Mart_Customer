# Parcel — Property Workspace

React Native/Expo Router frontend and NestJS/Prisma/PostgreSQL backend scaffold. Parcel gives the existing property workflows a new interface: role-specific Today dashboards, task-based navigation, property discovery with grid/list views, comparisons, visit agendas, a research workspace, tabbed Property Decision Files and a guided seller editor. `/dashboard` opens the buyer demo; `/seller-dashboard` opens the seller demo; `/apk` opens the workspace chooser. These screens use offline demo data; the redesign does not implement missing live backend business endpoints.

## Start frontend
```bash
cd frontend
npm install
npx expo install --fix
npm start
```

## Start backend
```bash
cd backend
npm install
cp .env.example .env
# Edit DATABASE_URL in .env and create the PostgreSQL database
npx prisma generate
npx prisma migrate dev --name init
npm run start:dev
```

Health check: http://localhost:4000/api/health

Set EXPO_PUBLIC_API_URL to your computer's LAN IP when testing on a physical device.

Do not commit secrets. Authentication and other business endpoints are not implemented yet.
