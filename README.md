## TicketBoss

Node.js + Express API for event discovery and seat reservations with JWT authentication and optimistic concurrency control on events. Backed by PostgreSQL.

### Tech Stack
- **Runtime**: Node.js, Express
- **Auth**: JWT, bcrypt
- **DB**: PostgreSQL (`pg`)
- **Other**: CORS, dotenv, nodemon

---

## Setup Instructions

### 1) Prerequisites
- Node.js 18+
- PostgreSQL 13+

### 2) Install dependencies
```bash
npm install
```

### 3) Environment variables
Create a `.env` file in the project root:
```bash
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=db-pswd
DB_NAME=ticketboss
JWT_SECRET=your-strong-secret
```

### 4) Initialize the database schema
Create the database and run the schema:
```sql
-- in psql
CREATE DATABASE ticketboss;
\c ticketboss;

-- create tables user, events, reservations
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(100) UNIQUE,
    name VARCHAR(100),
    total_seats INT,
    available_seats INT,
    version INT DEFAULT 0
);

CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    reservation_id UUID DEFAULT gen_random_uuid(),
    event_id VARCHAR(100) REFERENCES events(event_id),
    user_id INT REFERENCES users(id),
    partner_id VARCHAR(100),
    seats INT,
    status VARCHAR(20) DEFAULT 'confirmed'
);
```

Alternatively from shell:
```bash
psql -h "$DB_HOST" -U "$DB_USER" -p "$DB_PORT" -d "$DB_NAME" -f schema.sql
```

### 5) Seed some events (manual example)
```sql
INSERT INTO events (event_id, name, total_seats, available_seats)
VALUES
  ('node-meetup-2025', 'Node.js Meet-up', 500, 500)
```

### 6) Run the server
```bash
npm run dev
```
Server starts on `http://localhost:5000` by default.

---

## API Documentation

Base URL: `http://localhost:5000`

### Health/DB check
- **GET** `/`
  - Response 200: `Connected to database: <db_name>`

### Auth
Routes are mounted at `/api/user`.

- **POST** `/api/user/register`
  - Body:
    ```json
    { "email": "user@gamil.com", "password": "example" }
    ```
  - Responses:
    - 201:
      ```json
      {"user": {"id": 2,"email": "user@gmail.com","password_hash": "$2b$10$PL/K75kic0jMq.1NkXVeGOg5jii8rB1Xj6ZEGAUiwuYiCkpdfDFzu","created_at": "2025-10-29T03:41:29.781Z"}}
      ```
    - 400: `{ "error": "User already exists" }` or validation error

- **POST** `/api/user/login`
  - Body:
    ```json
    { "email": "user@example.com", "password": "example" }
    ```
  - Responses:
    - 201:
      ```json
      { "token": "<JWT>" }
      ```
    - 401: `{ "message": "Invalid email or password" }`
    - 404: `{ "message": "User not found" }`

Use the token in the `Authorization` header as `Bearer <JWT>` for protected endpoints.

### Events
Routes are mounted at `/api/event`.

- **GET** `/api/event/all`
  - Public. Returns all events.
  - 201:
    ```json
    {
    "events": [
        {
            "id": 1,
            "event_id": "node-meetup-2025",
            "name": "Node.js Meet-up",
            "total_seats": 500,
            "available_seats": 484,
            "version": 4
        }
    ]}
    ```

- **GET** `/api/event/summary/:event_id`
  - Public. Fetch a single event by `event_id`.
  - 200:
    ```json
    {
    "event": {
        "id": 1,
        "event_id": "node-meetup-2025",
        "name": "Node.js Meet-up",
        "total_seats": 500,
        "available_seats": 484,
        "version": 4
    }}
    ```
  - 400: `{ "error": "Missing event ID" }`

- **POST** `/api/event/reserve/:event_id` (Protected)
  - Headers: `Authorization: Bearer <JWT>`
  - Body:
    ```json
    { "partner_id": "abc-corp", "seats": 10 }
    ```
  - Responses:
    - 201:
      ```json
      {"reserve": {
        "id": 4,
        "reservation_id": "79418e5a-39bf-4f4f-a820-24be3bf5d2df",
        "event_id": "node-meetup-2025",
        "user_id": 1,
        "partner_id": "abc-corp",
        "seats": 10,
        "status": "confirmed"},"status": "confirmed"}
      ```
    - 400: `{ "error": "Missing required fields" }`, `{ "error": "Invalid seat count" }`, `{ "error": "Not enough seats left" }`, `{ "error": "Event already updated by another user" }`
    - 401/403: missing/invalid token

- **DELETE** `/api/event/cancel/:reservation_id` (Protected)
  - Headers: `Authorization: Bearer <JWT>`
  - Responses:
    - 200:
      ```json
      {"cancel": {
        "id": 3,
        "reservation_id": "38053d9b-e3d5-458f-b31a-b7a66135f249",
        "event_id": "node-meetup-2025",
        "user_id": 1,
        "partner_id": "abc-corp",
        "seats": 10,
        "status": "confirmed"}}
      ```
    - 400: `{ "error": "Reservation not found" }`, `{ "error": "Event not found" }`, `{ "error": "Conflict: Event updated concurrently" }`
    - 401/403: missing/invalid token

- **GET** `/api/event/reservations-by-user` (Protected)
  - Headers: `Authorization: Bearer <JWT>`
  - 201:
    ```json
    {
    "reservations": [
        {
            "id": 2,
            "reservation_id": "36c851f0-1ba1-4580-b736-f8d6d0c85591",
            "event_id": "node-meetup-2025",
            "user_id": 1,
            "partner_id": "abc-corp",
            "seats": 6,
            "status": "confirmed"
        },
        {
            "id": 3,
            "reservation_id": "38053d9b-e3d5-458f-b31a-b7a66135f249",
            "event_id": "node-meetup-2025",
            "user_id": 1,
            "partner_id": "abc-corp",
            "seats": 10,
            "status": "confirmed"
        },
        {
            "id": 4,
            "reservation_id": "79418e5a-39bf-4f4f-a820-24be3bf5d2df",
            "event_id": "node-meetup-2025",
            "user_id": 1,
            "partner_id": "abc-corp",
            "seats": 10,
            "status": "confirmed"
        }
    ]}
    ```

---

## Authorization
- Protected routes use `verifyToken` middleware.
- Provide `Authorization: Bearer <JWT>` header.
- Tokens are signed with `JWT_SECRET` and expire in 1 hour.

---

## Concurrency Control
Reservations and cancellations use optimistic concurrency via the `events.version` column. Update statements include a `WHERE version = <expected>` clause, preventing race conditions and overselling. If another update occurred, the API returns a conflict-style error (e.g., `Event already updated by another user`).

