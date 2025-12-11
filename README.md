# FamFi - Family Finance App

Ứng dụng quản lý tài chính gia đình.

## Tech Stack

- **Frontend**: Next.js 15 (App Router) + Tailwind CSS + shadcn/ui
- **Backend**: Node.js + Express + TypeScript
- **Database/Auth**: Supabase (PostgreSQL + Auth)

## Project Structure

```
famfi-v2/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # Express backend
├── package.json      # Monorepo root
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Supabase account

### Installation

```bash
# Install dependencies
npm install

# Copy environment files
cp apps/api/.env.example apps/api/.env
# Edit .env with your Supabase credentials
```

### Development

```bash
# Run both frontend and backend
npm run dev

# Or run separately
npm run dev:web   # Next.js on http://localhost:3000
npm run dev:api   # Express on http://localhost:3001
```

## Features (MVP)

- [ ] Authentication (Google + Email)
- [ ] Family management (Create/Join)
- [ ] Transaction CRUD (Income/Expense)
- [ ] Quick Input (chat-like)
- [ ] Categories management
- [ ] Dashboard & Reports
