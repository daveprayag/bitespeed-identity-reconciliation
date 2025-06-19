# 🔗 Bitespeed Identity Reconciliation

This is a backend service built to solve the [Bitespeed Backend Task: Identity Reconciliation](https://bitespeed.notion.site/Bitespeed-Backend-Task-Identity-Reconciliation-1fb21bb2a930802eb896d4409460375c).

It takes a user's `email` and/or `phoneNumber` and returns a consolidated identity based on existing records — while intelligently linking primary and secondary contacts.

---

## ✨ Features

-   🔍 Identity reconciliation based on shared `email` and/or `phoneNumber`
-   🗃️ Deduplication of contacts via `primary` and `secondary` linking
-   ✅ Fully tested against official requirements
-   🛡️ Rate-limited API using `express-rate-limit`
-   🔒 Input validation using `joi`
-   🚀 Ready to deploy on Render / Docker
-   🧪 Test suite using `vitest` (lightweight Jest alternative)

---

## 📦 Tech Stack

-   **Node.js** with **Express.js**
-   **Prisma ORM** with **PostgreSQL**
-   **Vitest** for testing
-   **Joi** for input schema validation
-   **Express-rate-limit** for abuse protection

---

## ⚙️ Why Prisma?

-   Prisma makes querying the database type-safe and intuitive.
-   Easily manage relationships (like `linkedId` foreign key).
-   The Prisma Client auto-generates types and reduces query errors.
-   Supports migrations and seeding during development.

---

## 🧪 Why Tests?

-   Tests validate all the complex cases mentioned in the Notion spec.
-   Every scenario (new user, merging primaries, linking secondaries) is covered.
-   We used **Vitest** because it’s fast, simple to configure, and integrates cleanly with modern TypeScript setups.

### ✅ To run tests:

```bash
pnpm test
# or
npx vitest
```

---

## 📥 Input Validation (Joi)

We use `joi` to:

-   Ensure at least one of `email` or `phoneNumber` is present.
-   Reject malformed requests early.
-   Keep validation logic cleanly separated from business logic.

---

## 🚨 Rate Limiting

We added `express-rate-limit` middleware to:

-   Prevent abuse of the `/identify` endpoint.
-   Limit to **20 requests per minute** per IP address.

This helps keep the server safe from spam and brute force attempts.

---

## 🔧 Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/daveprayag/bitespeed-identity-reconciliation.git
cd bitespeed-identity-reconciliation
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment

Create a `.env` file:

```
DATABASE_URL=postgresql://username:password@localhost:5432/dbname
PORT=3000
NODE_ENV=development
```

### 4. Migrate & generate Prisma

```bash
pnpm prisma:migrate
pnpm prisma:generate
```

### 5. Start dev server

```bash
pnpm dev
```

---

## 🐳 Docker (Coming Soon)

We will dockerize the application to make it deployment-ready for containerized environments like AWS, GCP, or Docker Hub.

---

## 🚀 Deployment (Render)

-   `build` script ensures the Prisma client and TypeScript build are generated properly.
-   `start` script runs the compiled code.

## 📬 API Endpoint

### POST `/identify`

#### Payload:

```json
{
    "email": "john@example.com",
    "phoneNumber": "9999999999"
}
```

#### Response:

```json
{
    "contact": {
        "primaryContactId": 1,
        "emails": ["john@example.com"],
        "phoneNumbers": ["9999999999"],
        "secondaryContactIds": [2, 3]
    }
}
```

---

## 🧹 Scripts

```bash
pnpm dev               # Run in development (nodemon + ts-node)
pnpm build             # Build TypeScript project
pnpm start             # Run built JS project
pnpm test              # Run test suite
pnpm prisma:migrate    # Apply DB migration
pnpm prisma:generate   # Generate Prisma Client
```

---

## 👨‍💻 Author

Made by **Prayag Dave** — [github.com/daveprayag](https://github.com/daveprayag)
