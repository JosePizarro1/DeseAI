# Manual Vercel deployment

Live application: https://deseai-rho.vercel.app

Project: `deseai`, scope: `japi123`. The project is deployed directly from the local application directory with the Vercel CLI. It is **not connected to GitHub** and pushes to the source repository do not trigger deployments.

## Deploy updates

```bash
vercel login
vercel link --yes --project deseai --scope japi123
vercel deploy --prod --yes --scope japi123
```

The local directory is already linked through the ignored `.vercel` folder. Skip the login and link commands when the session and project link are available. The existing project does not require a Git integration. Do not connect Git if prompted. `.vercelignore` excludes environment files, local builds, dependencies and Git metadata from the upload.

## Production configuration

| Variable | Purpose | Visibility |
| --- | --- | --- |
| NEXT_PUBLIC_SUPABASE_URL | Existing Supabase project | Public client configuration |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Anonymous client access under RLS | Public client configuration |
| SUPABASE_SERVICE_ROLE_KEY | Server-side payment persistence | Private secret |
| GROQ_API_KEY | Server-side Qwen requests | Private secret |
| GROQ_WISH_MODEL | qwen/qwen3.8-27b | Configuration |
| NEXT_PUBLIC_PAYPAL_SANDBOX_CLIENT_ID | Sandbox checkout | Public client configuration |
| PAYPAL_SANDBOX_CLIENT_SECRET | Server-side Sandbox orders/captures | Private secret |
| PAYPAL_WEBHOOK_ID | Signature verification for this listener | Private secret |

All eight variables are configured for production. Add or update variables with `vercel env add` / `vercel env update`, then deploy again. Keep private values out of command arguments, logs and Git.

## PayPal listener

URL: https://deseai-rho.vercel.app/api/paypal/webhook

Registered in the existing Sandbox application for `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.PENDING` and `PAYMENT.CAPTURE.DENIED`. The public deployment uses the same existing Supabase project, Groq configuration and Sandbox merchant as local development. Payments remain test payments.

## Hosted verification — 12 November 2026

- Home, create and explore pages return HTTP 200 without a Vercel login.
- A new visitor creates one anonymous session, shared by the header and page.
- Real Qwen analysis returned four matching public wishes.
- A buyer joined the group and the PayPal button loaded.
- A USD 19.99 Sandbox purchase completed through the hosted server and appeared in My orders.
- The real `PAYMENT.CAPTURE.COMPLETED` event arrived at the public listener, passed signature verification and was recorded in Supabase.
- Unauthenticated order creation and unsigned webhook requests return HTTP 401.
- `/.env.local` returns HTTP 404.

No production-money payments or physical fulfillment are enabled. Seller access remains restricted to explicitly approved sessions. New visitors can create wishes and join groups; use a Personal Sandbox account to test checkout.
