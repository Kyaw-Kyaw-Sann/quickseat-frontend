# QuickSeat Frontend Contract

This document is the frontend-facing contract for the existing QuickSeat backend. Use it when building the Next.js application. It describes current API behavior; it does not replace [API_Documentation.md](API_Documentation.md), which contains request and response examples for every endpoint.

## API Documentation Style — Frontend Primary APIs

This section deliberately follows the project documentation style: endpoint, access, request, response, and frontend behavior. It covers the APIs required for the first customer-facing Next.js implementation. For every remaining staff/admin request body, use [API_Documentation.md](API_Documentation.md) as the exact reference.

### Health

```text
>>> GET /health
Access: Public
response
{
  "success": true,
  "message": "QuickSeat API is running",
  "data": {
    "status": "UP",
    "timestamp": "2026-09-12T09:00:00Z"
  }
}
```

Use this only for an application availability check.

### Authentication

```text
>>> POST /auth/register
Access: Public
request
{
  "name": "Aung Aung",
  "email": "aung.aung@example.com",
  "password": "Password123",
  "phone": "09123456789"
}
response
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "userId": 3,
    "name": "Aung Aung",
    "email": "aung.aung@example.com",
    "role": "CUSTOMER",
    "accessToken": "access-token",
    "refreshToken": "refresh-token",
    "tokenType": "Bearer"
  }
}
```

Register then guide the customer to verify email. Do not show real token values in UI or documentation.

```text
>>> POST /auth/login
Access: Public
request
{
  "email": "aung.aung@example.com",
  "password": "Password123"
}
response
{
  "success": true,
  "message": "Login successful",
  "data": {
    "userId": 3,
    "name": "Aung Aung",
    "email": "aung.aung@example.com",
    "role": "CUSTOMER",
    "accessToken": "access-token",
    "refreshToken": "refresh-token",
    "tokenType": "Bearer"
  }
}
```

Save authentication state, then route by returned `role`.

```text
>>> POST /auth/refresh
Access: Public
request
{
  "refreshToken": "current-refresh-token"
}
response
{
  "success": true,
  "message": "Token refreshed",
  "data": {
    "userId": 3,
    "name": "Aung Aung",
    "email": "aung.aung@example.com",
    "role": "CUSTOMER",
    "accessToken": "new-access-token",
    "refreshToken": "new-refresh-token",
    "tokenType": "Bearer"
  }
}
```

Use once after a protected API returns `401`, then retry the original request once.

```text
>>> POST /auth/logout
Access: Public
request
{
  "refreshToken": "current-refresh-token"
}
response
{
  "success": true,
  "message": "Logout successful",
  "data": null
}
```

Clear local authentication state even if a network error occurs after the user explicitly logs out.

```text
>>> GET /auth/verify-email?token=verification-token
Access: Public
response
{
  "success": true,
  "message": "Email verified successfully",
  "data": null
}
```

This is the email-link endpoint. Create a frontend result page that shows either the success message or the backend error for invalid, expired, or used tokens.

```text
>>> POST /auth/resend-verification
>>> POST /auth/forgot-password
Access: Public
request
{
  "email": "aung.aung@example.com"
}
```

```text
>>> POST /auth/verify-reset-otp
Access: Public
request
{
  "email": "aung.aung@example.com",
  "otp": "123456"
}
```

```text
>>> POST /auth/reset-password
Access: Public
request
{
  "email": "aung.aung@example.com",
  "otp": "123456",
  "newPassword": "NewPassword123"
}
```

All three return the standard successful response wrapper. Display their returned `message`; do not disclose whether an account exists during forgot-password/resend flows.

### Public movie, cinema, and showtime discovery

```text
>>> GET /movies?search=Avatar&status=NOW_SHOWING&page=0&size=20
Access: Public
response
{
  "success": true,
  "message": "Movies retrieved successfully",
  "data": {
    "content": [],
    "page": 0,
    "size": 20,
    "totalElements": 0,
    "totalPages": 0,
    "last": true
  }
}
```

Use this for the movie-list page. `GET /movies/now-showing`, `GET /movies/upcoming`, and `GET /movies/{movieId}` are also public.

```text
>>> GET /cinemas?search=QuickSeat&city=Yangon&page=0&size=20
Access: Public
response
{
  "success": true,
  "message": "Cinemas retrieved successfully",
  "data": {
    "content": [],
    "page": 0,
    "size": 20,
    "totalElements": 0,
    "totalPages": 0,
    "last": true
  }
}
```

`GET /cinemas/{cinemaId}` returns one active cinema. Inactive/missing cinemas return `404`.

```text
>>> GET /showtimes?movieId=1&cinemaId=1&date=2026-09-15&page=0&size=20
Access: Public
response
{
  "success": true,
  "message": "Showtimes retrieved successfully",
  "data": {
    "content": [
      {
        "showtimeId": 1,
        "movieId": 1,
        "movieTitle": "Movie title",
        "cinemaId": 1,
        "cinemaName": "QuickSeat Yangon",
        "screenId": 1,
        "screenName": "Screen 1",
        "startTime": "2026-09-15T08:00:00Z",
        "endTime": "2026-09-15T10:15:00Z",
        "normalPrice": 5000.00,
        "couplePrice": 9000.00
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 1,
    "totalPages": 1,
    "last": true
  }
}
```

The frontend must send the date as `YYYY-MM-DD`, display times in `Asia/Yangon`, and let backend availability rules decide what is returned.

```text
>>> GET /showtimes/{showtimeId}/seats
Access: Public
response
{
  "success": true,
  "message": "Showtime seat map retrieved successfully",
  "data": {
    "showtimeId": 1,
    "movieTitle": "Movie title",
    "screenName": "Screen 1",
    "startTime": "2026-09-15T08:00:00Z",
    "seats": [
      {
        "showtimeSeatId": 10,
        "seatId": 3,
        "rowName": "A",
        "seatNumber": 1,
        "seatType": "NORMAL",
        "price": 5000.00,
        "status": "AVAILABLE"
      }
    ]
  }
}
```

Only `AVAILABLE` seats are selectable. Render `HELD`, `BOOKED`, and `UNAVAILABLE` as unavailable.

### Customer hold, booking, payment, and ticket

```text
>>> POST /customer/seat-holds
Access: CUSTOMER token required; verified customer required
request
{
  "showtimeId": 1,
  "showtimeSeatIds": [10, 11]
}
response
{
  "success": true,
  "message": "Seats held successfully",
  "data": {
    "bookingId": 20,
    "bookingReference": "QS-ABC123",
    "status": "PENDING",
    "totalAmount": 10000.00,
    "expiresAt": "2026-09-15T08:05:00Z",
    "remainingSeconds": 300,
    "selectedSeats": []
  }
}
```

Before calling it, re-fetch the seat map. On `409`, refresh the seat map and ask the user to choose another seat. The backend, not the browser countdown, decides whether a hold has expired.

```text
>>> GET /customer/seat-holds/{bookingReference}
>>> DELETE /customer/seat-holds/{bookingReference}
Access: CUSTOMER token required; own booking only
```

Use `GET` on the temporary checkout/countdown page. Use `DELETE` when abandoning an eligible pending hold. It releases seats and cancels the pending booking; it is not the general confirmed-booking cancellation endpoint.

```text
>>> GET /customer/bookings?status=PENDING&page=0&size=20
>>> GET /customer/bookings?category=UPCOMING&page=0&size=20
Access: CUSTOMER token required; own bookings only
```

Use booking `status` for tabs: `PENDING`, `CONFIRMED`, `CANCELLED`, `EXPIRED`, `USED`. Use `category=UPCOMING` or `category=PAST` for time-based lists.

```text
>>> GET /customer/bookings/{bookingReference}
Access: CUSTOMER token required; own booking only
```

Use this for the normal booking detail page.

```text
>>> PATCH /customer/bookings/{bookingReference}/cancel
Access: CUSTOMER token required; own eligible booking only
response
{
  "success": true,
  "message": "Booking cancelled successfully",
  "data": {}
}
```

Use for lifecycle cancellation. The backend determines eligibility and releases held/booked seats where allowed.

```text
>>> GET /customer/bookings/{bookingReference}/payment-summary
Access: CUSTOMER token required; own pending booking only

>>> POST /customer/bookings/{bookingReference}/payments
Access: CUSTOMER token required; own pending booking only
request
{
  "successful": true
}
```

Successful mock payment confirms the booking and books the seats. Failed payment leaves a valid unexpired booking pending, so frontend may offer retry. Never allow frontend UI to mark a booking confirmed before the backend response.

```text
>>> POST /customer/bookings/{bookingReference}/ticket
>>> GET /customer/bookings/{bookingReference}/ticket
Access: CUSTOMER token required; own confirmed booking/ticket only
```

Ticket generation is idempotent. Use the returned `ticketToken` for QR and PDF actions.

```text
>>> GET /customer/tickets/{ticketToken}/qr
>>> GET /customer/tickets/{ticketToken}/qr?download=true
Access: CUSTOMER token required; own ACTIVE ticket only
response: image/png

>>> GET /customer/tickets/{ticketToken}/pdf
Access: CUSTOMER token required; own ACTIVE ticket only
response: application/pdf
Content-Disposition: attachment; filename="quickseat-ticket-{bookingReference}.pdf"
```

Use authenticated binary fetch/blob handling for QR/PDF if the token is not available to an ordinary image URL request.

## 1. Connection

```text
Development API base URL: http://localhost:8080/api/v1
Suggested Next.js environment variable: NEXT_PUBLIC_API_BASE_URL
Local frontend origin: http://localhost:3000
```

Example `.env.local` for Next.js:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
```

The backend allows `http://localhost:3000` by default through CORS. A deployed backend must set `CORS_ALLOWED_ORIGINS` to the deployed frontend origin(s).

Never put database credentials, `JWT_SECRET`, Gmail credentials, OAuth client secrets, or Cloudinary secrets in the frontend.

## 2. Common HTTP rules

All paths in this document are relative to `NEXT_PUBLIC_API_BASE_URL`.

For protected endpoints, send:

```http
Authorization: Bearer <accessToken>
Content-Type: application/json
```

File uploads use `multipart/form-data`; do not manually set its `Content-Type` header in the browser because the browser must add the multipart boundary.

### Successful JSON response

```json
{
  "success": true,
  "message": "Human-readable result message",
  "data": {}
}
```

### Error response

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

Frontend behavior:

- Show `message` in a toast, alert, or page-level error area.
- Show each `fieldErrors[field]` below its corresponding form field.
- `401` means unauthenticated/expired access token: attempt token refresh once, then redirect to login if it fails.
- `403` means the user has a token but lacks the required role.
- `404` means unavailable/missing resource; use a not-found state.
- `409` means a valid business conflict, especially a seat that was just held/booked by someone else. Refresh affected data instead of retrying blindly.
- Do not reveal raw backend stack traces to users.

### Pagination

List endpoints that support pagination return this shape in `data`:

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

Use zero-based `page`. Default `size` is usually 20 and the maximum is 100 where supported.

## 3. Roles and frontend access

| Role | Frontend access |
| --- | --- |
| Public | Browse movies, cinemas, showtimes, and seat maps; register/login/reset password |
| CUSTOMER | Hold seats, pay, manage own bookings, retrieve own QR/PDF ticket |
| STAFF | Assigned-cinema operations and ticket validation only |
| ADMIN | System-wide cinema, screen, seat, movie, showtime, user, booking, and dashboard management |

Do not rely on route hiding alone. Route guards improve UX, but the backend remains the authority for every role and ownership check.

## 4. Authentication and token lifecycle

### Relevant endpoints

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

Login/register/refresh return auth data containing:

```text
userId, name, email, role, accessToken, refreshToken, tokenType
```

Recommended client flow:

1. Store the access token according to the frontend security policy.
2. Keep the refresh token available only to the client-side authentication layer; never include it in ordinary API calls.
3. Send only the access token as `Authorization: Bearer ...`.
4. When a protected request returns `401`, call `/auth/refresh` once using the refresh token.
5. Replace both tokens with the refresh response, retry the original request once, and log out if refresh fails.
6. Call `/auth/logout` with the refresh token when the user signs out, then clear local authentication state.

Email verification is a browser-friendly link:

```text
GET /auth/verify-email?token=<verification-token>
```

The frontend should show a clear success/failure page after opening this URL. A customer must have `emailVerified=true` before creating a seat hold.

## 5. Time, money, and enums

- Backend date-times are UTC ISO-8601 values, for example `2026-09-12T09:00:00Z`.
- Display them in Myanmar time (`Asia/Yangon`) in the UI. Keep UTC values when sending date-times back to the backend.
- Default currency is MMK. Amounts are JSON numbers derived from backend `BigDecimal`; format them with an MMK formatter and do not use JavaScript floating-point arithmetic for totals.
- A COUPLE seat is one selectable/bookable seat unit with capacity two.

Current enums:

```text
Role: CUSTOMER, STAFF, ADMIN
MovieStatus: UPCOMING, NOW_SHOWING, ENDED
ShowtimeStatus: ACTIVE, CANCELLED, COMPLETED
SeatType: NORMAL, COUPLE
SeatInventoryStatus: AVAILABLE, HELD, BOOKED, UNAVAILABLE
BookingStatus: PENDING, CONFIRMED, CANCELLED, EXPIRED, USED
PaymentStatus: PENDING, SUCCESS, FAILED
TicketStatus: ACTIVE, USED, CANCELLED
```

## 6. Customer experience flow

```text
Browse Movies
→ Movie Details
→ Select Cinema
→ Select Date and Showtime
→ View Seat Map
→ Select Seats
→ Login/Register only when holding seats
→ Verified customer creates seat hold
→ Backend-driven countdown
→ Mock payment
→ CONFIRMED booking
→ Generate/view QR ticket
→ Download PDF ticket
→ Staff validates ticket
→ Ticket and booking become USED
```

### Important UX decisions

- Public users may browse all discovery data and seat maps before logging in.
- Redirect to login only when a user presses the hold/continue button.
- After login, return the user to the same showtime with their locally selected seat IDs. Re-fetch the seat map before requesting a hold because availability can change.
- If the user is logged in but not verified, guide them to resend/complete verification rather than showing a generic failure.
- Use backend `expiresAt` and `remainingSeconds` from the hold response as the authoritative countdown source. The browser countdown is display-only.
- When a hold expires, disable payment and return the user to an updated seat map.
- When a hold returns `409`, show “This seat was just taken. Please choose another seat.” and refresh the seat map.

## 7. Public discovery contract

| Purpose | Endpoint | Key query parameters |
| --- | --- | --- |
| API availability | `GET /health` | none |
| Browse movies | `GET /movies` | `search`, `status`, `page`, `size` |
| Now showing movies | `GET /movies/now-showing` | `page`, `size` |
| Upcoming movies | `GET /movies/upcoming` | `page`, `size` |
| Movie detail | `GET /movies/{movieId}` | none |
| Browse cinemas | `GET /cinemas` | `search`, `city`, `page`, `size` |
| Cinema detail | `GET /cinemas/{cinemaId}` | none |
| Browse showtimes | `GET /showtimes` | `movieId`, `cinemaId`, `date=YYYY-MM-DD`, `page`, `size` |
| Seat map | `GET /showtimes/{showtimeId}/seats` | none |

Public discovery only exposes operationally available data: inactive cinemas/screens/movies and past/cancelled/inactive showtimes are excluded where applicable.

### Seat map data

`GET /showtimes/{showtimeId}/seats` returns:

```json
{
  "showtimeId": 1,
  "movieTitle": "Movie title",
  "screenName": "Screen 1",
  "startTime": "2026-09-12T09:00:00Z",
  "seats": [
    {
      "showtimeSeatId": 10,
      "seatId": 3,
      "rowName": "A",
      "seatNumber": 1,
      "seatType": "NORMAL",
      "price": 5000.00,
      "status": "AVAILABLE"
    }
  ]
}
```

Seat-map UI rules:

- Sort/render using the backend order: row then seat number.
- Enable selection only for `AVAILABLE` seats.
- Render `HELD`, `BOOKED`, and `UNAVAILABLE` as non-selectable.
- Clearly distinguish NORMAL and COUPLE seats and show their prices.
- Use a sticky desktop summary or mobile bottom sheet for selected seats, total, and Continue button.

## 8. Customer booking, payment, and ticket contract

All endpoints in this section require a CUSTOMER token and enforce ownership.

| Purpose | Endpoint | Notes |
| --- | --- | --- |
| Create hold | `POST /customer/seat-holds` | Requires verified customer; accepts `showtimeId` and `showtimeSeatIds` |
| Read hold | `GET /customer/seat-holds/{bookingReference}` | Pending-hold detail/countdown |
| Release hold | `DELETE /customer/seat-holds/{bookingReference}` | Manual release of eligible pending hold |
| Booking list | `GET /customer/bookings` | `status`, `category`, `page`, `size` |
| Booking detail | `GET /customer/bookings/{bookingReference}` | Only own booking |
| Cancel booking | `PATCH /customer/bookings/{bookingReference}/cancel` | Eligible status/showtime only |
| Payment summary | `GET /customer/bookings/{bookingReference}/payment-summary` | Use before payment screen |
| Mock payment | `POST /customer/bookings/{bookingReference}/payments` | Body: `{ "successful": true }` or `false` |
| Generate ticket | `POST /customer/bookings/{bookingReference}/ticket` | Confirmed + successful payment only; idempotent |
| Get ticket | `GET /customer/bookings/{bookingReference}/ticket` | Own ticket only |
| QR image | `GET /customer/tickets/{ticketToken}/qr` | PNG; append `?download=true` for attachment behavior |
| PDF download | `GET /customer/tickets/{ticketToken}/pdf` | `application/pdf`, attachment filename provided by backend |

### Hold request and response

```json
{
  "showtimeId": 1,
  "showtimeSeatIds": [10, 11]
}
```

Important hold response fields:

```json
{
  "bookingId": 20,
  "bookingReference": "QS-ABC123",
  "status": "PENDING",
  "totalAmount": 10000.00,
  "expiresAt": "2026-09-12T09:05:00Z",
  "remainingSeconds": 300,
  "selectedSeats": []
}
```

The backend releases expired holds automatically. Never assume a local countdown alone keeps a hold valid.

### Booking page categories

Use these values for `GET /customer/bookings?category=...`:

```text
UPCOMING
PAST
```

Use booking statuses for tabs or filters:

```text
PENDING, CONFIRMED, CANCELLED, EXPIRED, USED
```

Recommended actions:

| Booking state | Typical customer action |
| --- | --- |
| `PENDING` and unexpired | Continue payment or cancel/release |
| `CONFIRMED` | View/generate ticket; cancel only when backend permits it |
| `CANCELLED`, `EXPIRED`, `USED` | Read-only history |

## 9. File, QR, and PDF behavior

### Media uploads for admin screens

```text
POST /admin/movies/poster
POST /admin/cinemas/image
```

Both need an ADMIN token and a multipart field named `file`. The backend returns Cloudinary `url` and `publicId`. Put the returned `url` in `posterUrl` or `imageUrl` when creating/updating the movie or cinema. Movie trailers remain normal URL input through `trailerUrl`; there is no video upload API.

### Ticket assets

- QR endpoint returns a PNG binary response. Use the endpoint directly as an authenticated fetch/blob or image request according to the token-storage approach.
- PDF endpoint returns a PDF binary response with `Content-Disposition: attachment; filename="quickseat-ticket-{bookingReference}.pdf"`.
- Only the ticket owner may retrieve ticket assets, and only active tickets can produce the PDF.

## 10. Staff frontend contract

All staff endpoints require a STAFF token. The backend restricts the staff user to their assigned cinema.

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

Ticket validation request:

```json
{
  "ticketToken": "secure-ticket-token"
}
```

After valid validation, ticket and booking status become `USED`. Repeated scans, wrong-cinema tickets, cancelled tickets, and non-confirmed bookings are rejected. The scanner UI should display the returned backend result rather than deciding ticket validity itself.

## 11. Admin frontend contract

All endpoints below require an ADMIN token.

```text
# Cinema, screen, seat
POST  /admin/cinemas/image
POST  /admin/cinemas
PUT   /admin/cinemas/{cinemaId}
GET   /admin/cinemas
GET   /admin/cinemas/{cinemaId}
PATCH /admin/cinemas/{cinemaId}/status
POST  /admin/cinemas/{cinemaId}/screens
GET   /admin/cinemas/{cinemaId}/screens
PUT   /admin/screens/{screenId}
PATCH /admin/screens/{screenId}/status
POST  /admin/screens/{screenId}/seats/layout
GET   /admin/screens/{screenId}/seats
PUT   /admin/seats/{seatId}
PATCH /admin/seats/{seatId}/status

# Movies and showtimes
POST  /admin/movies/poster
POST  /admin/movies
PUT   /admin/movies/{movieId}
GET   /admin/movies
GET   /admin/movies/{movieId}
PATCH /admin/movies/{movieId}/active
PATCH /admin/movies/{movieId}/status
POST  /admin/showtimes
PUT   /admin/showtimes/{showtimeId}
PATCH /admin/showtimes/{showtimeId}/cancel
GET   /admin/showtimes
GET   /admin/showtimes/{showtimeId}
POST  /admin/showtimes/{showtimeId}/seats/generate

# Customers, staff, bookings
GET   /admin/customers
GET   /admin/customers/{userId}
PATCH /admin/customers/{userId}/active
POST  /admin/staff
GET   /admin/staff
GET   /admin/staff/{staffId}
PUT   /admin/staff/{staffId}
PATCH /admin/staff/{staffId}/active
PATCH /admin/staff/{staffId}/cinema
GET   /admin/bookings
GET   /admin/bookings/{bookingReference}
PATCH /admin/bookings/{bookingReference}/cancel

# Dashboard
GET /admin/dashboard/summary
GET /admin/dashboard/movies
GET /admin/dashboard/movies/top
GET /admin/dashboard/cinemas
GET /admin/dashboard/revenue/daily
GET /admin/dashboard/revenue/monthly
```

Use [API_Documentation.md](API_Documentation.md) for each management request body, filter, and response example. Staff creation requires a cinema assignment; CUSTOMER and ADMIN accounts do not have a cinema assignment.

## 12. Suggested Next.js pages

```text
Public
/                         Home / now showing / upcoming
/movies                   Movie list and search
/movies/[movieId]         Movie detail, trailer, showtime entry
/cinemas                  Cinema list and city filter
/cinemas/[cinemaId]       Cinema detail
/showtimes                Movie/cinema/date showtime discovery
/showtimes/[showtimeId]   Seat map and selected seats

Authentication
/login
/register
/verify-email/result
/forgot-password
/reset-password

Customer
/checkout/hold
/checkout/payment/[bookingReference]
/bookings
/bookings/[bookingReference]
/tickets/[ticketToken]

Staff
/staff
/staff/showtimes
/staff/bookings
/staff/ticket-validation

Admin
/admin
/admin/cinemas
/admin/movies
/admin/showtimes
/admin/users
/admin/bookings
/admin/dashboard
```

Exact frontend route names are flexible; endpoint paths are not.

## 13. Integration checklist for frontend agents

- [ ] Read this file and [API_Documentation.md](API_Documentation.md) before adding API client code.
- [ ] Centralize `NEXT_PUBLIC_API_BASE_URL`, JSON response parsing, error parsing, and bearer-token header generation.
- [ ] Add route-level UX guards for CUSTOMER, STAFF, and ADMIN, while preserving backend authorization as authority.
- [ ] Implement refresh-once behavior for `401`; prevent refresh loops.
- [ ] Re-fetch seat map before every hold attempt and after `409`/hold expiration.
- [ ] Build payment/ticket actions from the returned booking status, not from frontend assumptions.
- [ ] Use `Asia/Yangon` formatting for display and MMK formatting for money.
- [ ] Use browser `FormData` for image uploads.
- [ ] Test the complete flow: register → verify → login → browse → hold → pay → ticket → PDF → staff validate.
