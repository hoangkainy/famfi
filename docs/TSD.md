# FamFi - Technical Solution Document (TSD)

> **Version:** 1.0 MVP  
> **Last Updated:** 2025-12-12  
> **PRD Reference:** [PRD.md](./PRD.md)

---

## 1. System Overview

### 1.1 Architecture Diagram

```plantuml
@startuml System Architecture
!theme plain

skinparam componentStyle rectangle
skinparam backgroundColor white

package "Client Layer" {
  [Next.js 15\nApp Router] as Frontend
  [shadcn/ui + Tailwind] as UI
  [Recharts] as Charts
  [Supabase Client] as SupaClient
  
  Frontend --> UI
  Frontend --> Charts
  Frontend --> SupaClient
}

package "API Layer" {
  [Express.js] as API
  [Auth Middleware] as AuthMW
  
  package "Routes" {
    [auth.ts] as AuthRoute
    [family.ts] as FamilyRoute
    [transaction.ts] as TxRoute
    [category.ts] as CatRoute
    [report.ts] as ReportRoute
  }
  
  package "Services" {
    [family.ts] as FamilyService
    [transaction.ts] as TxService
    [category.ts] as CatService
    [report.ts] as ReportService
  }
  
  API --> AuthMW
  AuthMW --> Routes
  Routes --> Services
}

package "Database Layer" {
  database "Supabase PostgreSQL" as DB {
    [users]
    [families]
    [family_members]
    [transactions]
    [categories]
  }
  [Row Level Security] as RLS
  [Supabase Auth] as SupaAuth
  
  DB --> RLS
}

Frontend --> API : HTTP + Bearer Token
SupaClient --> SupaAuth : OAuth / JWT
Services --> DB : Supabase JS Client

@enduml
```

### 1.2 Deployment Diagram

```plantuml
@startuml Deployment
!theme plain

node "Vercel" {
  [Next.js Frontend] as Web
}

node "Railway" {
  [Express API] as API
}

cloud "Supabase" {
  database "PostgreSQL" as DB
  [Auth Service] as Auth
}

Web --> API : HTTPS
API --> DB
Web --> Auth : OAuth
API --> DB

@enduml
```

---

## 2. Database Schema

### 2.1 Entity Relationship Diagram

```plantuml
@startuml ERD
!theme plain

entity "auth.users" as auth_users {
  * id : UUID <<PK>>
  --
  email : TEXT
  ...
}

entity "public.users" as users {
  * id : UUID <<PK, FK>>
  --
  email : TEXT
  full_name : TEXT
  avatar_url : TEXT
  created_at : TIMESTAMPTZ
}

entity "families" as families {
  * id : UUID <<PK>>
  --
  name : TEXT
  invite_code : TEXT <<UK>>
  created_at : TIMESTAMPTZ
}

entity "family_members" as members {
  * id : UUID <<PK>>
  --
  * user_id : UUID <<FK>>
  * family_id : UUID <<FK>>
  role : TEXT
  joined_at : TIMESTAMPTZ
}

entity "categories" as categories {
  * id : UUID <<PK>>
  --
  * family_id : UUID <<FK>>
  name : TEXT
  icon : TEXT
  type : TEXT
  is_default : BOOLEAN
}

entity "transactions" as transactions {
  * id : UUID <<PK>>
  --
  * family_id : UUID <<FK>>
  category_id : UUID <<FK>>
  * created_by : UUID <<FK>>
  amount : DECIMAL
  note : TEXT
  type : TEXT
  transaction_date : DATE
  created_at : TIMESTAMPTZ
}

auth_users ||--o| users : syncs
users ||--o{ members : joins
families ||--o{ members : has
families ||--o{ categories : has
families ||--o{ transactions : has
categories ||--o{ transactions : categorizes

@enduml
```

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

-- Users: can only view/edit own profile
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

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

```plantuml
@startuml Auth Flow
!theme plain

actor User
participant "Next.js" as Web
participant "Supabase Auth" as Auth
participant "Express API" as API
database "PostgreSQL" as DB

User -> Web : Click "Sign in with Google"
Web -> Auth : signInWithOAuth('google')
Auth -> User : Google OAuth consent
User -> Auth : Authorize
Auth -> Web : JWT Token + Session

User -> Web : View Dashboard
Web -> API : GET /api/transactions\n+ Bearer Token
API -> Auth : Verify JWT
Auth -> API : User data
API -> DB : Query (with RLS)
DB -> API : Results
API -> Web : JSON Response
Web -> User : Render UI

@enduml
```

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

### 3.3 Endpoint Details

#### POST /api/transactions/quick

```plantuml
@startuml Quick Input Flow
!theme plain

start
:Receive input string;
note right: "coffee 50k"

:Parse with regex;
if (Match found?) then (yes)
  :Extract amount & note;
  :Apply suffix multiplier\n(k=1000, m=1000000);
  :Detect type from keywords;
  :Fetch user's categories;
  :Match category by keywords;
  :Create transaction;
  :Return success;
else (no)
  :Return PARSE_ERROR;
endif

stop

@enduml
```

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
│   ├── PRD.md
│   └── TSD.md
├── Makefile
└── package.json
```

---

## 5. Quick Input Parser

### 5.1 Flow Diagram

```plantuml
@startuml Quick Input Parser
!theme plain

start
:Input: "coffee 50k";

partition "Pattern Matching" {
  :Try pattern 1:\n^(.+?)\\s+([\\d,.]+)(k|m|tr)?$;
  if (Match?) then (yes)
    :note = "coffee"\namount = "50"\nsuffix = "k";
  else (no)
    :Try pattern 2:\n^([\\d,.]+)(k|m|tr)?\\s+(.+)$;
    if (Match?) then (yes)
      :Extract parts;
    else (no)
      :Return null;
      stop
    endif
  endif
}

partition "Amount Calculation" {
  switch (suffix?)
  case (k)
    :amount × 1,000;
  case (m or tr)
    :amount × 1,000,000;
  case (none)
    :amount as-is;
  endswitch
}

partition "Type Detection" {
  :Check INCOME keywords;
  if (Match?) then (yes)
    :type = INCOME;
  else (no)
    :Check EXPENSE keywords;
    if (Match?) then (yes)
      :type = EXPENSE;
    else (no)
      :type = null;
    endif
  endif
}

:Return { amount, note, type };
stop

@enduml
```

### 5.2 Amount Suffix Multipliers

| Suffix | Multiplier | Example |
|--------|------------|---------|
| k | ×1,000 | 50k → 50,000 |
| m | ×1,000,000 | 10m → 10,000,000 |
| tr | ×1,000,000 | 2tr → 2,000,000 |

---

## 6. Security Implementation

### 6.1 Request Flow with Auth

```plantuml
@startuml Security Flow
!theme plain

participant Client
participant "Auth Middleware" as MW
participant "Supabase Auth" as Auth
participant Service
database DB

Client -> MW : Request + Bearer Token
MW -> MW : Extract token from header
alt No token
  MW -> Client : 401 Unauthorized
else Has token
  MW -> Auth : getUser(token)
  alt Invalid token
    Auth -> MW : Error
    MW -> Client : 401 Invalid token
  else Valid token
    Auth -> MW : User data
    MW -> Service : req.user = user
    Service -> DB : Query with family scope
    DB -> Service : Results
    Service -> Client : Response
  end
end

@enduml
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

### 8.1 API Error Codes

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

## 9. Git Commit History

| # | Commit Message | Type |
|---|----------------|------|
| 1 | initial project setup | chore |
| 2 | configure Supabase database | feat |
| 3 | implement authentication | feat |
| 4 | add public.users table | fix |
| 5 | family management | feat |
| 6 | transaction CRUD | feat |
| 7 | auto-detect income/expense | feat |
| 8 | dashboard with charts | feat |
| 9 | category CRUD with icons | feat |
| 10 | reports with pie/bar charts | feat |
| 11 | polish with shadcn/ui | style |
| 12 | update category icons to emoji | fix |
| 13 | improve categories UX | style |
| 14 | integrate reports in dashboard | feat |
| 15 | fix date range queries | fix |
| 16 | auto-detect categories | feat |
| 17 | add Makefile | chore |
| 18 | add settings page | feat |
| 19 | add PRD | docs |
| 20 | add TSD | docs |

---

**Document Owner:** FamFi Engineering Team  
**Status:** Current as of MVP 1.0
