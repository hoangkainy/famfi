# FamFi Project Rules & Conventions

## 1. Code Style

### 1.1 Functions
- ✅ Use regular **function declarations** for named functions
- ✅ Arrow functions allowed only for callbacks and inline functions

```typescript
// ✅ Good
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.amount, 0);
}

// ❌ Avoid
const calculateTotal = (items: Item[]): number => {
  return items.reduce((sum, item) => sum + item.amount, 0);
};
```

### 1.2 TypeScript
- ✅ Use **`interface`** for object shapes (explicit & extendable)
- ✅ Use **`type`** only for unions, intersections, or primitives
- ✅ Always define return types for functions
- ❌ Avoid `any` - use `unknown` if type is uncertain

```typescript
// ✅ Good - Interface for objects
interface User {
  id: string;
  name: string;
  email: string;
}

// ✅ Good - Type for unions
type TransactionType = 'INCOME' | 'EXPENSE';

// ❌ Avoid
type User = {
  id: string;
  name: string;
};
```

### 1.3 Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Variables | camelCase | `userName`, `totalAmount` |
| Functions | camelCase | `getUser()`, `calculateTotal()` |
| Interfaces | PascalCase | `User`, `Transaction` |
| Types | PascalCase | `TransactionType` |
| Constants | UPPER_SNAKE_CASE | `MAX_LIMIT`, `API_URL` |
| Files (components) | PascalCase | `Dashboard.tsx`, `UserCard.tsx` |
| Files (utils/hooks) | camelCase | `formatDate.ts`, `useAuth.ts` |
| Folders | kebab-case | `user-profile/`, `api-routes/` |

### 1.4 File Structure

```
// Component file structure
ComponentName/
├── ComponentName.tsx      # Main component
├── ComponentName.test.tsx # Tests (optional)
├── index.ts               # Re-export
└── types.ts               # Types (if complex)
```

---

## 2. Git Conventions

### 2.1 Branch Naming

```
<type>/<short-description>

Types:
- feature/   → New feature
- bugfix/    → Bug fix
- hotfix/    → Urgent fix for production
- refactor/  → Code refactoring
- docs/      → Documentation only
- chore/     → Maintenance tasks

Examples:
- feature/user-authentication
- bugfix/login-validation
- refactor/transaction-service
```

### 2.2 Commit Messages (Conventional Commits)

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Formatting, missing semicolons, etc. |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test` | Adding or updating tests |
| `chore` | Maintenance tasks, dependencies |

**Scopes (optional):**
- `web` - Frontend changes
- `api` - Backend changes
- `db` - Database changes
- `auth` - Authentication related
- `ui` - UI components

**Examples:**
```
feat(api): add transaction CRUD endpoints
fix(web): resolve login redirect issue
docs: update README with setup instructions
chore(api): upgrade express to v5
refactor(web): extract useTransaction hook
```

### 2.3 Pull Request Guidelines
- PR title follows commit convention
- Link related issues
- Keep PRs focused and small
- Request review before merging

---

## 3. Architecture Rules

### 3.1 API Response Format

```typescript
// Success response
interface ApiResponse<T> {
  success: true;
  data: T;
}

// Error response
interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}
```

### 3.2 Error Handling
- Always use try-catch for async operations
- Log errors with context
- Return user-friendly error messages

```typescript
// ✅ Good
async function getUser(id: string): Promise<User> {
  try {
    const user = await userService.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  } catch (error) {
    logger.error('Failed to get user', { id, error });
    throw error;
  }
}
```

### 3.3 Folder Structure

```
apps/
├── web/                    # Next.js Frontend
│   └── src/
│       ├── app/            # Next.js App Router pages
│       ├── components/     # React components
│       │   ├── ui/         # Base UI components (shadcn)
│       │   └── features/   # Feature-specific components
│       ├── hooks/          # Custom React hooks
│       ├── lib/            # Utilities, helpers
│       ├── services/       # API calls
│       └── types/          # TypeScript types
│
└── api/                    # Express Backend
    └── src/
        ├── routes/         # Express routes
        ├── controllers/    # Request handlers
        ├── services/       # Business logic
        ├── middleware/     # Express middleware
        ├── lib/            # Utilities
        └── types/          # TypeScript types
```

---

## 4. Documentation Rules

- All docs written in **English**
- Use Markdown format
- Include code examples where applicable
- Keep README.md updated

---

## 5. Quick Reference

```
✅ DO:
- Use function declarations
- Use interface for objects
- Follow conventional commits
- Write meaningful variable names
- Handle errors properly

❌ DON'T:
- Use arrow functions for named functions
- Use 'any' type
- Commit directly to main
- Leave console.log in production code
- Skip error handling
```
