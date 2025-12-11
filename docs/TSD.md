# FamFi - Technical Solution Document (TSD)

> **Version:** 1.0 MVP  
> **Last Updated:** 2025-12-12  
> **PRD Reference:** [PRD.md](./PRD.md)

---

## 1. System Overview

### 1.1 Architecture Diagram
📊 [View Diagram: system-architecture.puml](./diagrams/system-architecture.puml)

### 1.2 Deployment Diagram
📊 [View Diagram: deployment.puml](./diagrams/deployment.puml)

---

## 2. Database Schema

### 2.1 Entity Relationship Diagram
📊 [View Diagram: erd.puml](./diagrams/erd.puml)

### 2.2 Table Definitions

```sql
-- Users (synced from auth.users via trigger)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Families
CREATE TABLE families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    invite_code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Family Members
CREATE TABLE family_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'VIEWER')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, family_id)
);

-- Categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT '📦',
    type TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    is_default BOOLEAN DEFAULT FALSE
);

-- Transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    amount DECIMAL(15,2) NOT NULL,
    note TEXT,
    type TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.3 Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Transactions: family members can CRUD
CREATE POLICY "Family members can manage transactions" ON transactions
    FOR ALL USING (
        family_id IN (
            SELECT family_id FROM family_members WHERE user_id = auth.uid()
        )
    );
```

---

## 3. API Specification

### 3.1 Authentication Flow
📊 [View Diagram: auth-flow.puml](./diagrams/auth-flow.puml)

### 3.2 API Response Format

```typescript
// Success Response
interface SuccessResponse<T> {
  success: true;
  data: T;
}

// Error Response
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}
```

### 3.3 Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/me` | Get current user |
| GET | `/api/families/me` | Get user's family |
| POST | `/api/families` | Create family |
| POST | `/api/families/join` | Join family |
| GET | `/api/families/:id/members` | Get members |
| GET | `/api/transactions` | List transactions |
| POST | `/api/transactions` | Create transaction |
| POST | `/api/transactions/quick` | Quick input |
| PUT | `/api/transactions/:id` | Update transaction |
| DELETE | `/api/transactions/:id` | Delete transaction |
| GET | `/api/transactions/summary` | Get summary |
| GET | `/api/categories` | List categories |
| POST | `/api/categories` | Create category |
| PUT | `/api/categories/:id` | Update category |
| DELETE | `/api/categories/:id` | Delete category |
| GET | `/api/reports/category-breakdown` | Expense by category |
| GET | `/api/reports/monthly-trend` | Monthly trend |

---

## 4. Project Structure

```
famfi-v2/
├── apps/
│   ├── api/                    # Backend
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── lib/
│   │   │   │   ├── supabase.ts
│   │   │   │   └── quickInput.ts
│   │   │   ├── middleware/
│   │   │   │   └── auth.ts
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   └── database/
│   │   └── package.json
│   │
│   └── web/                    # Frontend
│       ├── src/
│       │   ├── app/            # Pages
│       │   ├── components/ui/  # shadcn
│       │   └── lib/supabase/
│       └── package.json
│
├── docs/
│   ├── diagrams/               # PlantUML files
│   │   ├── system-architecture.puml
│   │   ├── deployment.puml
│   │   ├── erd.puml
│   │   ├── auth-flow.puml
│   │   ├── quick-input-flow.puml
│   │   ├── quick-input-parser.puml
│   │   └── security-flow.puml
│   ├── PRD.md
│   └── TSD.md
├── Makefile
└── package.json
```

---

## 5. Quick Input Parser

### 5.1 Flow Diagram
📊 [View Diagram: quick-input-flow.puml](./diagrams/quick-input-flow.puml)

### 5.2 Parser Algorithm
📊 [View Diagram: quick-input-parser.puml](./diagrams/quick-input-parser.puml)

### 5.3 Amount Suffix Multipliers

| Suffix | Multiplier | Example |
|--------|------------|---------|
| k | ×1,000 | 50k → 50,000 |
| m | ×1,000,000 | 10m → 10,000,000 |
| tr | ×1,000,000 | 2tr → 2,000,000 |

### 5.4 Keyword Detection

**EXPENSE Keywords:**
- Food: ăn, breakfast, lunch, dinner, cơm, phở
- Coffee: coffee, cafe, cà phê, trà sữa
- Transport: grab, taxi, uber, xăng
- Shopping: mua, buy, chợ
- Bills: điện, internet, wifi

**INCOME Keywords:**
- Salary: lương, salary
- Bonus: thưởng, bonus
- Freelance: freelance, tiền công

---

## 6. Security Implementation

### 6.1 Request Flow with Auth
📊 [View Diagram: security-flow.puml](./diagrams/security-flow.puml)

### 6.2 JWT Verification

```typescript
async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  req.user = user;
  next();
}
```

---

## 7. Environment Variables

### 7.1 Backend (apps/api/.env)
```
PORT=3001
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_PUBLISHABLE_KEY=eyJhbG...
SUPABASE_SECRET_KEY=eyJhbG...
```

### 7.2 Frontend (apps/web/.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
```

---

## 8. Error Handling

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Missing or invalid auth token |
| `NO_FAMILY` | User not in a family |
| `NOT_FOUND` | Resource not found |
| `INVALID_INPUT` | Validation failed |
| `PARSE_ERROR` | Quick input parse failed |
| `CREATE_ERROR` | Database insert failed |
| `UPDATE_ERROR` | Database update failed |
| `DELETE_ERROR` | Database delete failed |

---

## 9. Diagrams Index

| Diagram | Path | Description |
|---------|------|-------------|
| System Architecture | [diagrams/system-architecture.puml](./diagrams/system-architecture.puml) | Overall system layers |
| Deployment | [diagrams/deployment.puml](./diagrams/deployment.puml) | Production deployment |
| ERD | [diagrams/erd.puml](./diagrams/erd.puml) | Database entities |
| Auth Flow | [diagrams/auth-flow.puml](./diagrams/auth-flow.puml) | Authentication sequence |
| Quick Input Flow | [diagrams/quick-input-flow.puml](./diagrams/quick-input-flow.puml) | Quick input processing |
| Quick Input Parser | [diagrams/quick-input-parser.puml](./diagrams/quick-input-parser.puml) | Parser algorithm |
| Security Flow | [diagrams/security-flow.puml](./diagrams/security-flow.puml) | Auth middleware |

---

**Document Owner:** FamFi Engineering Team  
**Status:** Current as of MVP 1.0
