# FamFi API

## Development

```bash
npm run dev
```

## Production Build

```bash
npm run build
npm start
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 3001) |
| `NODE_ENV` | Environment | No |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase anon key | Yes |
| `SUPABASE_SECRET_KEY` | Supabase service key | Yes |
| `FRONTEND_URL` | Frontend URL for CORS | Yes (production) |

## Deploy to Railway

1. Connect GitHub repo
2. Set root directory: `apps/api`
3. Add environment variables
4. Deploy!
