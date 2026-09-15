# AGENTS.md — QuickSeat Frontend

## Interaction Rules

- The user may ask questions in English, but always respond in Myanmar language.

- Never add, update, remove, rename, move, fix, or modify any code, file, folder, configuration, dependency, or project structure without explicit permission.

- Do not make any project changes unless the user explicitly says the exact phrase:

  "Build Now"

- Before the phrase "Build Now" is given, only:
  - discuss
  - explain
  - review
  - plan
  - suggest
  - provide commands or code snippets without applying them

- When the user says "Build Now", you may make only the changes that were discussed or explicitly requested.

- Do not interpret similar phrases such as "go ahead", "continue", "start", "do it", or "proceed" as permission to modify the project.

- If "Build Now" has not been explicitly provided, do not modify the project.


## Purpose

This file gives AI coding agents (especially Codex in VS Code) the full working context for building the QuickSeat frontend.

Use this document as the primary frontend implementation guide together with:

- `FRONTEND_CONTRACT.md` — authoritative frontend/backend integration contract.
- `API_Documentation.md` — authoritative endpoint request/response examples.
- The existing backend codebase — final authority for actual runtime behavior.

Do not invent backend features, fields, endpoints, roles, or business rules that are not supported by the current backend.

---

# 1. Project Summary

QuickSeat is a multi-cinema ticket booking platform.

Core customer flow:

```text
Browse Movies
→ View Movie Details
→ Choose Cinema
→ Choose Date
→ Choose Showtime
→ View Seat Map
→ Select Seats
→ Login/Register only when continuing to hold seats
→ Verify Email if needed
→ Hold Seats Temporarily
→ Create PENDING Booking
→ Backend-Controlled Countdown
→ Mock Payment
→ Booking becomes CONFIRMED
→ Seats become BOOKED
→ Generate QR Ticket
→ View / Download Ticket
→ Booking History
→ Staff Validates QR
→ Booking and Ticket become USED
```

Core staff flow:

```text
Login
→ View Assigned Cinema
→ View Assigned Cinema Showtimes / Bookings
→ Scan QR or Enter Ticket Token
→ Backend Validates
→ Valid Ticket becomes USED
```

Core admin flow:

```text
Movies
→ Cinemas
→ Screens
→ Seats
→ Showtimes
→ Customers / Staff
→ Bookings
→ Dashboard / Analytics
```

QuickSeat's technical core is:

```text
Seat Concurrency
+ Booking Lifecycle
+ Scheduling Rules
+ Role Authorization
+ QR Validation
```

The frontend must make these backend strengths visible through clear UX.

---

# 2. Product Scope

## Included

### Authentication
- Customer register
- Login / logout
- Email verification
- Resend verification
- Forgot password
- OTP verification
- Reset password
- Google login
- JWT access / refresh token lifecycle
- Role-based frontend UX for `CUSTOMER`, `STAFF`, `ADMIN`

### Movies
- Browse all active movies
- Now showing
- Upcoming
- Search
- Filter
- Pagination
- Movie details
- Poster
- Trailer URL
- Director
- Cast text
- Genre
- Language
- Age rating
- Duration

### Cinemas
- Browse cinemas
- Search
- City filter
- Cinema detail
- Address
- Phone
- Cinema image

### Showtimes
- Browse active future showtimes
- Filter by movie
- Filter by cinema
- Filter by date
- Normal / couple price display

### Seat Inventory
- Showtime-specific seat map
- `AVAILABLE`
- `HELD`
- `BOOKED`
- `UNAVAILABLE`
- `NORMAL`
- `COUPLE`

### Seat Hold
- Temporary seat reservation
- Default hold duration: 5 minutes
- Countdown
- Auto-expiry
- Automatic release
- Concurrency conflict handling
- Prevent double booking

### Booking
- PENDING booking
- CONFIRMED booking
- CANCELLED booking
- EXPIRED booking
- USED booking
- Booking history
- Booking detail
- Customer cancellation where backend permits

### Payment
- Mock payment only
- Simulate success
- Simulate failure
- Retry before expiry
- Payment summary

### Ticket
- Ticket generation after confirmed successful payment
- QR image
- PDF ticket download
- Single-use validation
- Ticket status

### Staff
- Assigned cinema only
- Assigned cinema showtimes
- Assigned cinema bookings
- Showtime seat status
- Ticket lookup
- QR/token validation

### Admin
- Cinemas
- Screens
- Seats
- Movies
- Showtimes
- Customers
- Staff
- Bookings
- Dashboard analytics
- Media upload

---

# 3. Explicitly Out of Scope

Do not implement these unless the backend is intentionally extended first:

```text
❌ Real payment gateway
❌ Real refunds / settlement
❌ WebSockets
❌ Dynamic pricing
❌ AI movie recommendations
❌ Chat
❌ Loyalty points
❌ Favourites / watchlist
❌ Multi-tenant cinema companies
❌ Mobile app
❌ PWA
❌ Get Directions / map integration
```

Do not fabricate UI for unsupported functionality.

---

# 4. Business Rules

The frontend must respect these backend rules:

1. Only verified customers may create seat holds.
2. Roles are `CUSTOMER`, `STAFF`, `ADMIN`.
3. Staff belongs to one cinema and may access only that cinema's data.
4. Inactive cinema/screen/seat/user records must not be used in new operational flows.
5. Same screen showtimes cannot overlap.
6. Showtime end time is derived from movie duration + cleaning buffer.
7. Seat availability is per-showtime.
8. Selected seats are temporarily held.
9. Same showtime + same seat cannot be held/booked by two users concurrently.
10. One booking belongs to one showtime.
11. Booking seat prices are snapshotted at booking time.
12. Expired bookings cannot be paid.
13. Successful payment changes booking to `CONFIRMED`.
14. One confirmed booking produces one QR ticket.
15. QR tickets are single-use.
16. Staff may validate only tickets for their assigned cinema.
17. Successful ticket validation changes booking + ticket to `USED`.
18. `USED` booking cannot be cancelled.
19. Operational records are soft-managed with status/active flags.
20. Revenue counts successful/confirmed business outcomes only.
21. Backend timestamps are UTC; frontend displays Myanmar time.
22. Currency is MMK.

---

# 5. Time, Currency, and Data Rules

## Time

Backend date-times are UTC ISO-8601:

```text
2026-09-12T09:00:00Z
```

Frontend display timezone:

```text
Asia/Yangon
```

Always display dates/times in Myanmar time unless a specific internal/admin debugging view intentionally shows raw UTC.

Do not mutate backend timestamps before storing them in client state.

## Currency

Default currency:

```text
MMK
```

Format amounts for display.

Avoid doing important monetary calculations with JavaScript floating-point arithmetic. Prefer backend totals and snapshot values.

## Couple Seat Rule

A `COUPLE` seat is:

```text
one selectable/bookable seat unit
with capacity for two people
```

Do not render it as two independent seats.

---

# 6. Backend Connection

Development backend:

```text
http://localhost:8080/api/v1
```

Suggested Next.js environment variable:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
```

Frontend dev origin:

```text
http://localhost:3000
```

The backend allows this origin by default.

Never put backend secrets into the frontend:

```text
JWT_SECRET
database credentials
Gmail credentials
OAuth client secrets
Cloudinary secret
```

---

# 7. Common API Response Contract

## Success

```json
{
  "success": true,
  "message": "Human-readable result message",
  "data": {}
}
```

## Error

```json
{
  "success": false,
  "timestamp": "2026-09-12T09:00:00Z",
  "status": 400,
  "error": "VALIDATION_FAILED",
  "message": "Validation failed",
  "path": "/api/v1/auth/register",
  "fieldErrors": {
    "email": "must be a well-formed email address"
  }
}
```

Frontend rules:

- Show `message` using an appropriate toast, alert, or page-level error.
- Show `fieldErrors[field]` under the corresponding form control.
- Never expose raw stack traces.

### HTTP Handling

```text
401 → refresh access token once, retry original request once, then logout if refresh fails
403 → token exists but role / permission is insufficient
404 → not-found state
409 → business conflict; refresh affected data instead of blind retry
```

Most important `409` use case:

```text
Seat was held/booked by another customer.
```

UX message should be specific:

```text
This seat was just taken. Please choose another seat.
```

Then refresh the seat map.

---

# 8. Pagination

Typical list shape:

```json
{
  "content": [],
  "page": 0,
  "size": 20,
  "totalElements": 0,
  "totalPages": 0,
  "last": true
}
```

Rules:

- Page index is zero-based.
- Default size is usually 20.
- Use backend pagination rather than pretending all records are client-side.

---

# 9. Current Enums

```text
Role:
CUSTOMER
STAFF
ADMIN

MovieStatus:
UPCOMING
NOW_SHOWING
ENDED

ShowtimeStatus:
ACTIVE
CANCELLED
COMPLETED

SeatType:
NORMAL
COUPLE

SeatInventoryStatus:
AVAILABLE
HELD
BOOKED
UNAVAILABLE

BookingStatus:
PENDING
CONFIRMED
CANCELLED
EXPIRED
USED

PaymentStatus:
PENDING
SUCCESS
FAILED

TicketStatus:
ACTIVE
USED
CANCELLED
```

Frontend-only state may include:

```text
SELECTED
```

for currently selected seat UI.

---

# 10. Authentication Lifecycle

Relevant endpoints:

```text
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout

GET  /auth/verify-email?token=...
POST /auth/resend-verification

POST /auth/forgot-password
POST /auth/verify-reset-otp
POST /auth/reset-password

GET  /oauth2/authorization/google
```

Login/register/refresh return:

```text
userId
name
email
role
accessToken
refreshToken
tokenType
```

Recommended behavior:

1. Store auth state according to chosen security approach.
2. Send only access token in normal protected requests.
3. Keep refresh token limited to auth logic.
4. On protected `401`, refresh once.
5. Replace both tokens with refreshed tokens.
6. Retry the original request once.
7. If refresh fails, clear auth state and redirect to login.
8. On logout, call backend logout with refresh token then clear local state.
9. Prevent infinite refresh loops.

Frontend route guards improve UX only.

Backend authorization remains authoritative.

---

# 11. Customer UX Principle

Public users should be able to browse:

```text
Movies
Cinema details
Showtimes
Seat maps
```

without logging in.

Require authentication only when the user attempts to create a seat hold / continue booking.

Ideal flow:

```text
Browse
→ Movie
→ Showtime
→ Select Seats
→ Continue
→ Login/Register if needed
→ Return to same showtime
→ Re-fetch seat map
→ Restore locally selected seat IDs if still available
→ Attempt hold
```

Do not force login at the beginning of browsing.

---

# 12. Email Verification UX

If a logged-in customer is not verified:

Do not show a generic `403`.

Show a dedicated verification state:

```text
Verify your email to reserve seats
[Resend Verification Email]
[Try Again]
```

Backend remains final authority.

---

# 13. Seat Hold UX

Create hold:

```text
POST /customer/seat-holds
```

Request:

```json
{
  "showtimeId": 1,
  "showtimeSeatIds": [10, 11]
}
```

Important response fields:

```text
bookingId
bookingReference
status
totalAmount
expiresAt
remainingSeconds
selectedSeats
```

Default hold duration:

```text
5 minutes
```

Backend is source of truth.

Frontend countdown is display-only.

Use:

```text
expiresAt
remainingSeconds
```

to establish timer state.

When hold expires:

```text
disable payment
show expiry message
return customer to refreshed seat map
```

Suggested UX:

```text
Your seat reservation expired.
We released these seats so other customers can book them.
[Choose Seats Again]
```

---

# 14. Seat Map UX

Public endpoint:

```text
GET /showtimes/{showtimeId}/seats
```

Seat map fields include:

```text
showtimeSeatId
seatId
rowName
seatNumber
seatType
price
status
```

Rules:

- Preserve backend order: row, then seat number.
- Only `AVAILABLE` is selectable.
- `HELD`, `BOOKED`, `UNAVAILABLE` are disabled.
- `NORMAL` and `COUPLE` must look visibly different.
- Show price.
- Show clear legend.
- Desktop: sticky summary panel.
- Mobile: sticky bottom summary / bottom sheet.

Visual states:

```text
AVAILABLE     → neutral outline
SELECTED      → cinema red
HELD          → amber
BOOKED        → disabled gray
UNAVAILABLE   → low-opacity / crossed
COUPLE        → wider unit with unique visual
```

---

# 15. Payment UX

QuickSeat uses mock payment only.

Relevant endpoints:

```text
GET  /customer/bookings/{bookingReference}/payment-summary
POST /customer/bookings/{bookingReference}/payments
```

Payment request:

```json
{
  "successful": true
}
```

or:

```json
{
  "successful": false
}
```

UI must clearly identify mock payment.

Recommended design:

```text
Demo Payment
This project uses a mock payment system.

[Simulate Successful Payment]
[Simulate Failed Payment]
```

Do not add:

```text
credit-card number
expiry field
CVV field
Visa/Mastercard fake checkout UI
```

because the backend does not support real card payment.

---

# 16. Booking UX

Customer endpoints:

```text
GET    /customer/bookings
GET    /customer/bookings/{bookingReference}
PATCH  /customer/bookings/{bookingReference}/cancel
```

List filters:

```text
status
category
date
page
size
```

Categories:

```text
UPCOMING
PAST
```

Recommended booking actions:

```text
PENDING + unexpired
→ Continue Payment
→ Cancel / Release

CONFIRMED
→ View / Generate Ticket
→ Cancel only if backend permits

CANCELLED
→ Read-only detail

EXPIRED
→ Read-only detail

USED
→ Read-only detail
```

Do not infer cancellability from status alone. Backend response is final authority.

---

# 17. Ticket UX

Relevant endpoints:

```text
POST /customer/bookings/{bookingReference}/ticket
GET  /customer/bookings/{bookingReference}/ticket

GET /customer/tickets/{ticketToken}/qr
GET /customer/tickets/{ticketToken}/qr?download=true
GET /customer/tickets/{ticketToken}/pdf
```

Ticket generation is idempotent.

Ticket page should prioritize:

```text
QR
Movie
Cinema
Screen
Showtime
Seats
Booking Reference
Ticket Status
```

Recommended actions:

```text
Download Ticket PDF
Download QR
Back to My Bookings
```

Do not make the raw ticket token the primary user-facing identifier.

Use booking reference as the human-friendly identifier.

Only ACTIVE ticket PDFs are downloadable per backend rules.

---

# 18. Staff Rules

Endpoints:

```text
GET  /staff/cinema

GET  /staff/showtimes
GET  /staff/showtimes/{showtimeId}
GET  /staff/showtimes/{showtimeId}/seats

GET  /staff/bookings
GET  /staff/bookings/{bookingReference}

GET  /staff/tickets/{ticketToken}
POST /staff/tickets/validate
```

Staff frontend must not decide validity.

Flow:

```text
scan / enter token
→ send token to backend
→ render backend result
```

Successful validation:

```text
Ticket ACTIVE → USED
Booking CONFIRMED → USED
```

Backend rejects:

```text
repeat scan
wrong cinema
cancelled ticket
invalid ticket
non-confirmed booking
```

---

# 19. Admin Rules

Admin endpoint groups include:

```text
Cinemas
Screens
Seats
Movies
Showtimes
Customers
Staff
Bookings
Dashboard
```

Admin UI should be productivity-focused rather than cinematic-heavy.

Customer UI:

```text
brand-heavy
visual
cinematic
consumer-oriented
```

Admin UI:

```text
table-heavy
forms
filters
dialogs
fast management
clear status controls
```

---

# 20. Media Upload Flow

## Movie poster

```text
POST /admin/movies/poster
```

## Cinema image

```text
POST /admin/cinemas/image
```

Both:

- Require ADMIN token.
- Use `multipart/form-data`.
- Field name is `file`.
- Do not manually set multipart `Content-Type`; browser must add boundary.

Frontend flow:

```text
Admin selects image
→ local preview
→ upload endpoint
→ receive Cloudinary URL
→ store URL internally
→ submit movie/cinema create/update JSON
```

Do not ask admin to manually copy/paste Cloudinary URLs.

Movie trailer remains:

```text
normal URL input
```

No video upload endpoint.

---

# 21. Public API Endpoints

```text
GET /health

GET /movies
GET /movies/now-showing
GET /movies/upcoming
GET /movies/{movieId}

GET /cinemas
GET /cinemas/{cinemaId}

GET /showtimes
GET /showtimes/{showtimeId}/seats
```

---

# 22. Customer API Endpoints

```text
POST   /customer/seat-holds
GET    /customer/seat-holds/{bookingReference}
DELETE /customer/seat-holds/{bookingReference}

GET    /customer/bookings
GET    /customer/bookings/{bookingReference}
PATCH  /customer/bookings/{bookingReference}/cancel

GET    /customer/bookings/{bookingReference}/payment-summary
POST   /customer/bookings/{bookingReference}/payments

POST   /customer/bookings/{bookingReference}/ticket
GET    /customer/bookings/{bookingReference}/ticket

GET    /customer/tickets/{ticketToken}/qr
GET    /customer/tickets/{ticketToken}/pdf
```

---

# 23. Admin API Groups

Use `API_Documentation.md` for exact request bodies and examples.

```text
/admin/cinemas
/admin/screens
/admin/seats
/admin/movies
/admin/showtimes
/admin/customers
/admin/staff
/admin/bookings
/admin/dashboard
```

Do not guess request bodies.

---

# 24. Frontend Page Scope

## Public / Customer Pages

```text
/
Home

/movies
Movies List

/movies/[movieId]
Movie Detail

/cinemas
Cinema List

/cinemas/[cinemaId]
Cinema Detail

/showtimes
Showtime Discovery

/showtimes/[showtimeId]
Seat Selection

/login
Login

/register
Register

/forgot-password
Forgot Password

/reset-password
Reset Password

/verify-email/result
Email Verification Result

/checkout/payment/[bookingReference]
Checkout / Mock Payment

/bookings
My Bookings

/bookings/[bookingReference]
Booking Detail

/tickets/[ticketToken]
Ticket
```

Auth route names may vary slightly if implementation needs it.

Endpoint paths may not vary.

## Staff Pages

Suggested:

```text
/staff
/staff/showtimes
/staff/showtimes/[showtimeId]
/staff/bookings
/staff/bookings/[bookingReference]
/staff/ticket-validation
```

## Admin Pages

Suggested:

```text
/admin
/admin/dashboard
/admin/cinemas
/admin/movies
/admin/showtimes
/admin/customers
/admin/staff
/admin/bookings
```

Add nested edit/create/detail routes where useful.

---

# 25. Customer UI / UX Direction

QuickSeat customer UI uses a premium cinema identity.

Primary theme:

```text
deep black / near-black background
charcoal surfaces
neon cinema red primary accent
warm amber/gold secondary accent
soft white primary text
muted gray secondary text
green success
amber warning
red danger
```

Style:

```text
premium
cinematic
dark
clean
modern
glossy but not excessive
high contrast
minimal clutter
```

Avoid:

```text
overly busy dashboards
heavy gradients everywhere
fake streaming features
fake recommendations
fake payments
map/directions buttons
```

The supplied QuickSeat logo is a glowing red ticket + cinema-seat mark.

Use the logo consistently in:

```text
navbar
footer
ticket branding
major branded states
```

---

# 26. Customer UI Reference Set

Part One customer UI references were created for:

```text
Home
Movies
Movie Detail
Cinemas
Cinema Detail
```

Part Two customer UI references were created for:

```text
Showtime Discovery
Seat Selection
Checkout / Mock Payment
My Bookings
Booking Detail
Ticket
```

These mockups are design references, not strict pixel-perfect specifications.

When coding:

- preserve brand system
- preserve hierarchy
- preserve key interactions
- keep backend-compatible content
- remove any visual concept that conflicts with actual backend behavior

Do not blindly reproduce any mockup text that conflicts with the backend contract.

---

# 27. Customer Navbar Guidance

Typical desktop nav:

```text
[QuickSeat Logo]

Home
Movies
Cinemas
Showtimes

Search
Login / Profile
```

Logged out:

```text
Login
Register
```

Logged in:

```text
My Bookings
Profile / account menu
Logout
```

Ticket should not be a top-level nav item.

Preferred flow:

```text
My Bookings
→ Booking Detail
→ Ticket
```

---

# 28. Home Page Structure

Recommended:

```text
Navbar

Hero / Featured Movie

Now Showing

Upcoming

Browse by Cinema

Footer
```

Do not invent:

```text
Trending AI
Recommended for You
Top Picks Based on History
```

unless backed by API support.

---

# 29. Movie UI

## Movie Card

Show:

```text
poster
title
genre
duration
age rating if useful
View Details
Showtimes / Book Tickets
```

## Movie Detail

Use backend-supported fields:

```text
poster
title
description
duration
release date
language
genres
age rating
director
cast text
trailer URL
status
```

Primary actions:

```text
Book Tickets
Watch Trailer
```

Showtime selection can live on the detail page or link into `/showtimes`.

---

# 30. Cinema UI

Cinema list card:

```text
image
name
city
address
phone
View Cinema
See Showtimes
```

Cinema detail:

```text
hero image
name
city
address
phone
now showing / related showtimes
```

Do not add:

```text
Get Directions
Map
Distance from user
```

without backend/location support.

---

# 31. Showtime Discovery UI

Preferred user mental model:

```text
Movie
→ Cinema
→ Date
→ Time
```

Use filters:

```text
movieId
cinemaId
date
page
size
```

Showtime card should focus on:

```text
start time
cinema
screen
normal price
couple price
```

---

# 32. Checkout Countdown UX

Checkout becomes time-sensitive after successful hold.

Prominently display:

```text
Reservation expires in 04:36
```

Suggested visual urgency:

```text
> 2:00 remaining → normal
1:59–1:00 → amber
< 1:00 → stronger danger state
```

But backend expiry always wins.

Do not let the user pay after backend says hold expired.

---

# 33. UX Error Strategy

Create a reusable error model.

## Validation

Display field-level errors.

## 401

Refresh once.

## 403

Display role/verification-specific state where possible.

## 404

Display contextual not-found state.

## 409

Show business-specific explanation.

Examples:

```text
Seat taken
Showtime overlap
Duplicate entity
Invalid lifecycle transition
```

Avoid generic:

```text
Something went wrong
Conflict
Unknown error
```

when backend message provides actionable context.

---

# 34. Loading UX

Avoid unnecessary full-page spinners.

Use:

```text
movie card skeletons
cinema card skeletons
showtime row skeletons
seat map skeleton
booking list skeleton
ticket loading placeholder
button loading states
```

Disable mutation buttons during submission to prevent accidental duplicates.

---

# 35. Responsive Strategy

Customer frontend should be mobile-friendly.

Highest-priority mobile screens:

```text
Movie Detail
Showtime Selection
Seat Selection
Checkout
Ticket
My Bookings
```

Seat map on mobile:

```text
scrollable seat canvas
sticky bottom summary
```

Ticket:

```text
QR visible without excessive scrolling
```

Admin may be desktop-first but should remain usable on tablet.

---

# 36. Recommended Frontend Stack

Preferred stack for this project:

```text
Next.js
TypeScript
Tailwind CSS
TanStack Query
React Hook Form
Zod
Axios or a centralized fetch wrapper
Lucide Icons
```

Do not add libraries unnecessarily.

Prefer a small, maintainable dependency set.

---

# 37. Suggested Frontend Architecture

Example:

```text
src/
├── app/
│   ├── (public)/
│   ├── (auth)/
│   ├── customer/
│   ├── staff/
│   └── admin/
│
├── components/
│   ├── ui/
│   ├── layout/
│   ├── movies/
│   ├── cinemas/
│   ├── showtimes/
│   ├── seats/
│   ├── bookings/
│   └── tickets/
│
├── features/
│   ├── auth/
│   ├── movies/
│   ├── cinemas/
│   ├── showtimes/
│   ├── seat-holds/
│   ├── bookings/
│   ├── tickets/
│   ├── staff/
│   └── admin/
│
├── lib/
│   ├── api/
│   ├── auth/
│   ├── query/
│   ├── formatters/
│   └── utils/
│
├── hooks/
├── types/
├── constants/
└── assets/
```

Exact structure may be adjusted to the chosen Next.js version.

Do not over-engineer folders before real feature needs appear.

---

# 38. Recommended API Module Structure

```text
lib/api/
├── client.ts
├── errors.ts
├── auth.ts
├── movies.ts
├── cinemas.ts
├── showtimes.ts
├── seat-holds.ts
├── bookings.ts
├── tickets.ts
├── staff.ts
└── admin.ts
```

Centralize:

```text
base URL
bearer token injection
JSON parsing
error parsing
401 refresh
retry-original-request
blob handling
multipart handling
```

---

# 39. Binary Asset Handling

QR:

```text
image/png
```

PDF:

```text
application/pdf
```

Authenticated binary requests may need:

```text
fetch/axios blob handling
object URLs
download helpers
```

Respect `Content-Disposition` filename when possible.

---

# 40. Final Frontend Development Roadmap

Use this phase order.

```text
Phase 1  — Project Foundation
Phase 2  — Design System
Phase 3  — API Client Foundation
Phase 4  — Authentication
Phase 5  — Public Layout & Navigation
Phase 6  — Customer Home
Phase 7  — Movies
Phase 8  — Cinemas
Phase 9  — Showtime Discovery
Phase 10 — Seat Selection

Phase 11 — Login Interruption & Verification UX
Phase 12 — Seat Hold & Concurrency
Phase 13 — Checkout & Mock Payment
Phase 14 — Booking Confirmation
Phase 15 — Ticket
Phase 16 — My Bookings
Phase 17 — Booking Detail

Phase 18 — Staff Frontend

Phase 19 — Admin Layout
Phase 20 — Admin Cinema / Screen / Seat Management
Phase 21 — Admin Movie Management
Phase 22 — Admin Showtime Management
Phase 23 — Admin Users

Phase 24 — Admin Bookings
Phase 25 — Admin Dashboard & Analytics

Phase 26 — Responsive Polish
Phase 27 — UX Edge Cases
Phase 28 — Testing
Phase 29 — Performance & Accessibility
Phase 30 — Final Integration & Handoff
```

Preferred milestone sequence:

```text
Foundation
→ Design System
→ Auth / API
→ Customer Discovery
→ Showtime / Seat Selection
→ Hold / Payment
→ Booking / Ticket
→ Staff
→ Admin
→ Testing
→ Finalization
```

Finish the customer booking flow end-to-end before spending significant time on admin polish.

---

# 41. Testing Priorities

Highest-value E2E flow:

```text
Register
→ Verify Email
→ Login
→ Browse Movie
→ Choose Cinema
→ Choose Date
→ Choose Showtime
→ Select Seats
→ Hold Seats
→ Payment
→ Generate Ticket
→ Download PDF
→ Staff Validate
→ Ticket + Booking become USED
```

Also test:

```text
401 refresh
403 role denial
404 resource
409 seat conflict
hold expiry
payment failed
payment retry
duplicate ticket generation
cancel booking
USED ticket rejection
wrong-cinema staff validation
```

---

# 42. Performance Guidance

Use:

```text
Next/Image where appropriate
lazy loading
query caching
prefetch where useful
skeletons
route-level loading states
dynamic import for heavy modules
```

Avoid unnecessary repeated requests.

Seat availability and booking status must still be refreshed when correctness matters.

---

# 43. Accessibility Guidance

Must include:

```text
keyboard navigation
visible focus states
form labels
ARIA labels for icon buttons
accessible dialogs
focus trapping
sufficient contrast
seat state labels
screen-reader seat descriptions
```

Seat selection should ideally be keyboard-operable.

Do not rely on color alone to distinguish seat states.

---

# 44. Admin Cancellation Note

An admin may cancel an eligible confirmed/paid booking.

Current MVP behavior:

```text
Booking → CANCELLED
Ticket → CANCELLED
Booked seats → AVAILABLE
Payment record remains historical
```

This is not a real refund.

Frontend must make this clear.

Recommended warning:

```text
This cancels the booking and ticket access.
QuickSeat MVP does not process a real payment refund.
```

---

# 45. Important Source-of-Truth Rules for Agents

When implementing any feature:

1. Read `FRONTEND_CONTRACT.md`.
2. Read the relevant section in `API_Documentation.md`.
3. Inspect existing frontend code before adding new abstractions.
4. If docs and code differ, do not silently guess.
5. Prefer actual backend behavior when verified.
6. Do not create new backend contracts unless explicitly requested.
7. Do not invent fields, enums, endpoints, or statuses.
8. Do not hardcode demo API data into final integration.
9. Use backend totals, availability, statuses, and expiry as authoritative.
10. Keep customer UX polished but technically honest.

---

# 46. AI Agent Working Style

For Codex / AI agents:

- Make incremental changes.
- Reuse existing components before creating duplicates.
- Keep type definitions aligned with backend DTOs.
- Avoid broad refactors while implementing a small feature.
- Do not change endpoint paths.
- Do not rename backend fields in API transport types unless mapping explicitly.
- Prefer typed API functions.
- Keep mutations idempotency-safe at the UI level by disabling repeated submits.
- Handle loading, empty, error, and success states.
- Preserve responsive behavior.
- Avoid adding unsupported mock features just to make UI look richer.
- Keep the QuickSeat visual identity consistent.

When uncertain, prefer the smallest implementation that faithfully matches the backend contract.

---

# 47. Definition of Done

A frontend feature is not complete just because the happy-path UI renders.

It is done when:

```text
UI matches QuickSeat design system
API integration works
loading state exists
empty state exists where relevant
error state exists
auth rules are respected
status transitions are correct
mobile layout is usable
backend conflicts are handled
timezone is correct
MMK is formatted
types are accurate
no unsupported feature was invented
```

---

# 48. Final Product Goal

The completed QuickSeat frontend should demonstrate:

```text
a polished customer cinema experience
+
correct transactional booking behavior
+
clear lifecycle visibility
+
robust seat concurrency UX
+
secure role-based operations
+
practical admin tooling
```

The frontend should make it easy for an interviewer or developer to understand that QuickSeat is more than CRUD.

Its standout flow is:

```text
Movie Discovery
→ Showtime
→ Seat Map
→ Concurrent Seat Hold
→ Expiring Booking
→ Mock Payment
→ Confirmed Booking
→ QR Ticket
→ Single-Use Staff Validation
```

Build around that.
