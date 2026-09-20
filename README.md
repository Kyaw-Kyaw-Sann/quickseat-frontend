# QuickSeat Frontend

QuickSeat is a full-featured cinema ticket booking frontend built with Next.js. It provides public movie discovery, concurrent seat reservation, mock payment, QR tickets, staff ticket validation, and an administrative workspace for managing cinema operations.

This repository contains the frontend application only. It expects the QuickSeat Spring Boot API to be running separately.

## Core workflow

```text
Movie discovery
-> Showtime selection
-> Seat selection
-> Temporary seat hold
-> Mock payment
-> Confirmed booking
-> QR ticket
-> Staff validation
```

Seat availability, booking status, payment status, hold expiry, and ticket validity are always controlled by the backend.

## Features

### Customer

- Email/password and Google authentication
- Email verification and password reset
- Movies, cinemas, and showtime discovery
- Responsive seat map with normal and couple seats
- Temporary seat holds with an authoritative countdown
- Mock payment and booking confirmation
- Booking history and booking details
- QR ticket display and QR/PDF downloads

### Staff

- Assigned-cinema workspace
- Read-only showtime, seat inventory, and booking views
- Manual ticket-token entry
- USB QR scanner support
- QR image upload and browser camera scanning
- Preview-before-confirm ticket validation flow

### Admin

- Operational dashboard and analytics
- Cinema, screen, and seat management
- Movie and poster management
- Showtime scheduling and lifecycle management
- Customer and staff management
- Booking inspection and eligible cancellation

## Technology

- Next.js 16 with App Router
- React 19
- TypeScript with strict checking
- Tailwind CSS 4
- Native `fetch` through a centralized API client
- ZXing for browser-side QR decoding

The project intentionally keeps its dependency set small and does not require a separate frontend state-management library.

## Prerequisites

Install the following before starting:

- Node.js 20.9 or newer
- npm
- Git
- A running QuickSeat backend API

The default local URLs are:

```text
Frontend: http://localhost:3000
Backend:  http://localhost:8080/api/v1
```

## Clone and set up

1. Clone the repository:

   ```bash
   git clone <frontend-repository-url>
   cd quickseat-frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create the local environment file:

   macOS/Linux:

   ```bash
   cp .env.example .env.local
   ```

   Windows PowerShell:

   ```powershell
   Copy-Item .env.example .env.local
   ```

4. Confirm that `.env.local` points to the backend:

   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
   ```

5. Start the QuickSeat backend before using API-dependent pages.

6. Start the frontend development server:

   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000).

## Available commands

```bash
npm run dev      # Start the development server
npm run lint     # Run ESLint
npm run build    # Create and type-check a production build
npm run start    # Run the previously built application
```

To verify a fresh clone before development:

```bash
npm run lint
npm run build
```

## Environment configuration

The frontend currently requires one public environment value:

| Variable | Purpose | Example |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | QuickSeat API base URL | `http://localhost:8080/api/v1` |

The application fails with a clear startup error if this variable is missing.

Do not place database credentials, JWT secrets, mail credentials, OAuth client secrets, or Cloudinary secrets in frontend environment files. Those values belong to the backend only.

## Backend and authentication notes

- The backend must allow the frontend origin, normally `http://localhost:3000`.
- Google OAuth credentials and redirect URIs are configured in the backend and Google Cloud Console.
- The frontend sends access tokens to protected API endpoints.
- A failed protected request can refresh the session once and retry once.
- Customer, staff, and admin route guards improve the UX, but backend authorization remains authoritative.
- Staff accounts must be assigned to a cinema by the backend.
- Only verified customer accounts can create seat holds.

## Camera and QR scanning

Staff camera scanning uses the browser camera APIs.

- Camera permission is requested only after the user starts the scanner.
- `localhost` is accepted as a secure development context by modern browsers.
- On another device or hostname, camera access normally requires HTTPS.
- Manual entry, USB scanners, and QR image uploads remain available without camera permission.
- A scan previews the ticket first; it never validates a ticket automatically.

## Project structure

```text
src/
|-- app/                # App Router routes and layouts
|-- components/
|   |-- layout/         # Shared public layout components
|   `-- ui/             # Shared UI primitives
|-- features/
|   |-- auth/
|   |-- movies/
|   |-- cinemas/
|   |-- showtimes/
|   |-- seat-holds/
|   |-- bookings/
|   |-- tickets/
|   |-- staff/
|   `-- admin/
`-- lib/
    |-- api/            # Typed API transport and endpoint modules
    |-- config/         # Environment configuration
    |-- formatters/     # MMK and Asia/Yangon formatters
    `-- utils/          # Shared non-feature utilities
```

## Application conventions

- Backend pages use zero-based pagination.
- Backend UTC timestamps are displayed in the `Asia/Yangon` timezone.
- Monetary values are displayed in MMK using shared formatters.
- Backend totals, lifecycle states, expiry values, and seat inventory are authoritative.
- A couple seat is one backend seat and one selectable booking unit.
- HTTP `409` responses represent business conflicts and are not blindly retried.
- Binary QR and PDF requests use the authenticated API lifecycle.

## Main routes

| Area | Routes |
| --- | --- |
| Public | `/`, `/movies`, `/cinemas`, `/showtimes` |
| Authentication | `/login`, `/register`, `/forgot-password`, `/reset-password` |
| Customer | `/bookings`, `/checkout/*`, `/tickets/*` |
| Staff | `/staff`, `/staff/showtimes`, `/staff/bookings`, `/staff/ticket-validation` |
| Admin | `/admin`, `/admin/cinemas`, `/admin/movies`, `/admin/showtimes`, `/admin/customers`, `/admin/staff`, `/admin/bookings` |

## Troubleshooting

### The frontend reports a missing API base URL

Create `.env.local`, set `NEXT_PUBLIC_API_BASE_URL`, and restart the development server.

### API requests fail

Confirm that:

- The Spring Boot backend is running.
- The URL in `.env.local` is correct.
- The backend accepts requests from `http://localhost:3000`.
- The backend database and required services are available.

### Port 3000 is already in use

Stop the existing process or accept the alternate port selected by Next.js. If the frontend origin changes, update the backend CORS and OAuth configuration accordingly.

### Camera access fails

Check browser permission settings and use `localhost` or HTTPS. Staff can still upload a QR image or enter/scan the token with a USB scanner.

## Reference documentation

- `AGENTS.md` — product scope, business rules, and development conventions
- `FRONTEND_CONTRACT.md` — frontend/backend integration contract
- `API_Documentation.md` — endpoint request and response documentation
