# FamFi - Product Requirements Document (PRD)

> **Version:** 1.0 MVP  
> **Last Updated:** 2025-12-12  
> **Status:** ✅ Implemented

---

## 1. Executive Summary

### 1.1 Product Vision
**FamFi** (Family Finance) is a mobile-first web application that enables families to collaboratively track and manage their household finances in real-time.

### 1.2 Problem Statement
- Families struggle to track shared expenses and income
- Existing finance apps are designed for individuals, not households
- Manual expense logging is tedious and often forgotten
- Lack of visibility into family spending patterns

### 1.3 Solution
A simple, intuitive family finance tracker with:
- **Quick Input** - Natural language transaction entry ("coffee 50k")
- **Family Sharing** - All members see real-time data
- **Smart Categories** - Auto-detect transaction categories
- **Visual Reports** - Charts for spending insights

---

## 2. Target Users

### 2.1 Primary Persona
**"The Family Finance Manager"**
- Age: 25-45
- Role: Primary household expense tracker
- Pain: Manually logging every expense is tedious
- Goal: Quick, effortless expense tracking

### 2.2 Secondary Persona
**"The Family Member"**
- Age: 18-60
- Role: Contributes to family finances
- Pain: No visibility into family spending
- Goal: See where money is going

---

## 3. Features & User Stories

### 3.1 Authentication
| ID | User Story | Status |
|----|------------|--------|
| AUTH-01 | As a user, I can sign up with Google OAuth | ✅ |
| AUTH-02 | As a user, I can sign up with email/password | ✅ |
| AUTH-03 | As a user, I can sign in with my credentials | ✅ |
| AUTH-04 | As a user, I can sign out | ✅ |

### 3.2 Family Management
| ID | User Story | Status |
|----|------------|--------|
| FAM-01 | As a new user, I can create a new family | ✅ |
| FAM-02 | As a user, I can join an existing family via invite code | ✅ |
| FAM-03 | As an admin, I can view and copy the invite code | ✅ |
| FAM-04 | As a member, I can view all family members | ✅ |

### 3.3 Transaction Management
| ID | User Story | Status |
|----|------------|--------|
| TXN-01 | As a user, I can add expense/income via Quick Input | ✅ |
| TXN-02 | As a user, I can view all transactions | ✅ |
| TXN-03 | As a user, I can edit a transaction | ✅ |
| TXN-04 | As a user, I can delete a transaction | ✅ |
| TXN-05 | As a user, I can see auto-detected transaction type | ✅ |
| TXN-06 | As a user, I can override the detected type | ✅ |

### 3.4 Categories
| ID | User Story | Status |
|----|------------|--------|
| CAT-01 | As a user, I see default categories for my family | ✅ |
| CAT-02 | As a user, I can create custom categories | ✅ |
| CAT-03 | As a user, I can edit my custom categories | ✅ |
| CAT-04 | As a user, I can delete my custom categories | ✅ |
| CAT-05 | As a user, transactions are auto-categorized | ✅ |

### 3.5 Dashboard & Reports
| ID | User Story | Status |
|----|------------|--------|
| DASH-01 | As a user, I can see monthly income/expense/balance | ✅ |
| DASH-02 | As a user, I can see spending by category (pie chart) | ✅ |
| DASH-03 | As a user, I can see monthly trend (bar chart) | ✅ |
| DASH-04 | As a user, I can see recent transactions | ✅ |

### 3.6 Settings
| ID | User Story | Status |
|----|------------|--------|
| SET-01 | As a user, I can view my profile | ✅ |
| SET-02 | As a user, I can view family settings | ✅ |
| SET-03 | As a user, I can copy invite code | ✅ |
| SET-04 | As a user, I can logout | ✅ |

---

## 4. Quick Input Specification

### 4.1 Supported Formats
```
[description] [amount]     → "coffee 50k"
[amount] [description]     → "50000 lunch"
[description] [amount]k    → "grab 100k" (×1,000)
[description] [amount]m    → "lương 10m" (×1,000,000)
[description] [amount]tr   → "thưởng 2tr" (×1,000,000)
```

### 4.2 Auto-Detection Keywords

**EXPENSE Keywords:**
- Food: ăn, breakfast, lunch, dinner, cơm, phở, bún
- Coffee: coffee, cafe, cà phê, trà sữa
- Transport: grab, taxi, uber, xăng
- Shopping: mua, buy, chợ
- Bills: điện, internet, wifi

**INCOME Keywords:**
- Salary: lương, salary
- Bonus: thưởng, bonus
- Freelance: freelance, tiền công

### 4.3 Category Auto-Assignment
Quick Input automatically matches keywords to user's categories and assigns `category_id` to transactions.

---

## 5. Technical Architecture

### 5.1 Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router), React 19, TypeScript |
| UI | shadcn/ui, Tailwind CSS, Recharts |
| Backend | Node.js, Express, TypeScript |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (Google OAuth, Email) |

### 5.2 System Architecture
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Next.js   │────▶│   Express   │────▶│  Supabase   │
│  Frontend   │     │    API      │     │  Database   │
│  :3000      │     │   :3001     │     │   + Auth    │
└─────────────┘     └─────────────┘     └─────────────┘
```

### 5.3 Data Model
```
users (1) ──── (*) family_members (*) ──── (1) families
                         │
                         ▼
                   transactions (*) ──── (1) categories
```

---

## 6. Pages & Routes

| Route | Description | Auth |
|-------|-------------|------|
| `/login` | Sign in page | Public |
| `/register` | Sign up page | Public |
| `/onboarding` | Create/Join family | Protected |
| `/dashboard` | Main dashboard | Protected |
| `/transactions` | Transaction list + edit | Protected |
| `/categories` | Category management | Protected |
| `/settings` | User & family settings | Protected |

---

## 7. API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/me` | Get current user |

### Families
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/families/me` | Get user's family |
| POST | `/api/families` | Create family |
| POST | `/api/families/join` | Join family |
| GET | `/api/families/:id/members` | Get members |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | List transactions |
| POST | `/api/transactions` | Create transaction |
| POST | `/api/transactions/quick` | Quick input |
| PUT | `/api/transactions/:id` | Update transaction |
| DELETE | `/api/transactions/:id` | Delete transaction |
| GET | `/api/transactions/summary` | Get summary |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | List categories |
| POST | `/api/categories` | Create category |
| PUT | `/api/categories/:id` | Update category |
| DELETE | `/api/categories/:id` | Delete category |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/category-breakdown` | Expense by category |
| GET | `/api/reports/monthly-trend` | Monthly trend |

---

## 8. Default Categories

### Expense Categories
| Icon | Name |
|------|------|
| 🍔 | Food & Dining |
| 🚗 | Transportation |
| 🛒 | Shopping |
| ⚡ | Bills & Utilities |
| 🎮 | Entertainment |
| 💊 | Healthcare |
| 📚 | Education |
| 💅 | Personal Care |
| 🎁 | Gifts |
| ☕ | Coffee & Drinks |
| 📦 | Other Expense |

### Income Categories
| Icon | Name |
|------|------|
| 💼 | Salary |
| 🏆 | Bonus |
| 📈 | Investment |
| 💻 | Freelance |
| 💰 | Other Income |

---

## 9. Security Requirements

| Requirement | Implementation |
|-------------|----------------|
| Authentication | Supabase Auth with JWT |
| Authorization | Row Level Security (RLS) |
| API Security | Bearer token validation |
| Data Isolation | Family-based data separation |

---

## 10. Future Roadmap

### Phase 2 (Post-MVP)
- [ ] Recurring transactions
- [ ] Budget planning
- [ ] Notifications
- [ ] Export to CSV/PDF

### Phase 3
- [ ] Multi-currency support
- [ ] Bank integration
- [ ] AI-powered insights
- [ ] Mobile app (React Native)

---

## 11. Success Metrics

| Metric | Target |
|--------|--------|
| User Activation | 80% complete onboarding |
| Daily Active Users | 60% of registered |
| Transactions/User/Week | 10+ |
| Retention (Week 1) | 50% |

---

## 12. Release Checklist

- [x] Authentication (Google + Email)
- [x] Family Management
- [x] Transaction CRUD
- [x] Quick Input with auto-detect
- [x] Categories with icons
- [x] Dashboard with charts
- [x] Settings page
- [ ] Production deployment
- [ ] Performance optimization
- [ ] Error monitoring

---

**Document Owner:** FamFi Team  
**Approved By:** Product Manager  
**Implementation Status:** MVP Complete ✅
