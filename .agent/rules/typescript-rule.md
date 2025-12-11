---
trigger: always_on
---

When coding in TypeScript/JavaScript projects:

1. CODE STYLE:
   - Use regular function declarations, NOT arrow functions for named functions
   - Use interface for object shapes (not type)
   - Always define return types for functions
   - Never use 'any' type

2. NAMING:
   - Variables/functions: camelCase
   - Interfaces/Types: PascalCase
   - Constants: UPPER_SNAKE_CASE
   - Files (components): PascalCase.tsx
   - Files (utils): camelCase.ts
   - Folders: kebab-case

3. GIT COMMITS (Conventional Commits):
   Format: <type>(<scope>): <description>
   Types: feat, fix, docs, style, refactor, test, chore
   Example: feat(api): add user authentication

4. DOCUMENTATION:
   - Write all docs in English
   - Write comments in English

5. ERROR HANDLING:
   - Always use try-catch for async operations
   - Log errors with context