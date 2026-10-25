# EcoMap — partial Create React App edition

EcoMap remains a multi-page project. **Only the dashboard uses Create React App (CRA)**. The home, map, report, about, admin, login/register, report-details, and my-reports pages remain ordinary HTML/CSS/JavaScript. The existing Node.js/Express API and MySQL database are retained.

## Technology
- Most pages: HTML, CSS, plain JavaScript
- Dashboard only: React 18 with Create React App (`frontend-react-dashboard`)
- Backend: Node.js + Express
- Database: MySQL
- Map: Leaflet + OpenStreetMap

## 1. Database
For a fresh database, use `database.sql` in MySQL Workbench. If your current `ecomap` database is already set up and working, do not re-run the full SQL file because it may duplicate demo reports. Keep your existing schema.

## 2. Backend setup (Windows PowerShell)
Open a terminal in the project folder:
```powershell
cd backend
copy .env.example .env
```
Edit `backend/.env` and enter your MySQL password and a long random `JWT_SECRET`. Do not share or commit this file.
Then run:
```powershell
npm.cmd install
npm.cmd start
```
The backend serves the existing HTML pages and API at `http://localhost:5000`.

Create an admin only if you need one and do not already have one:
```powershell
node createAdmin.js admin choose_a_strong_password
```

## 3. Start the CRA dashboard (separate terminal)
From the project root:
```powershell
cd frontend-react-dashboard
npm.cmd install
npm.cmd start
```
Open `http://localhost:3000` for the React dashboard. Keep both the backend (port 5000) and CRA development server (port 3000) running while using the dashboard. The dashboard requests its data from the backend on port 5000.

## Main pages
- Home: `http://localhost:5000/`
- Map: `http://localhost:5000/map.html`
- Report issue: `http://localhost:5000/report.html`
- Dashboard (CRA): `http://localhost:3000`
- About: `http://localhost:5000/about.html`
- Admin login: `http://localhost:5000/admin-login.html`
- User login/register: `http://localhost:5000/login.html` and `http://localhost:5000/register.html`

## Why CRA is only used for one page
The college requirement to use Create React App is met by the dashboard folder, which has the standard CRA files: `package.json`, `public/index.html`, and `src/index.js` / `src/App.js`. Other pages are intentionally left as plain HTML/CSS/JavaScript.

## API routes
The existing backend includes stats, reports, report submission, user registration/login/profile/report history, admin login, status updates, and report deletion.

## Notes
- `.env` is intentionally not included in this ZIP. Create your own from `.env.example`.
- Report image uploads accept JPG, PNG, or WEBP up to 2 MB.
- Leaflet map tiles and the CRA React packages need internet access.
