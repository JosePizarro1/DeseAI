# DeseAI — shared wishes, collective offers, individual PayPal checkout

DeseAI connects people who describe compatible shopping wishes in different words. Qwen on Groq interprets the product, city and budget and ranks matching public wishes. An approved seller can publish an offer for a group; once its minimum interest count is reached, each interested buyer can pay for one unit using **PayPal Sandbox**.

**Live demo:** https://deseai-rho.vercel.app

**Demo video:** https://youtu.be/-AOhPvTEstk

Deployed manually with the Vercel CLI. There is no automatic GitHub deployment connection. See [DEPLOYMENT.md](DEPLOYMENT.md).

## Run locally

Requires Node.js 22 or newer, npm, a Supabase project, a Groq API key and PayPal Sandbox application credentials.

1. Install dependencies with `npm ci`.
2. In Supabase, enable **Authentication → Anonymous sign-ins**.
3. For a new database, execute these SQL files in order: `supabase/schema.sql`, `supabase/migration_v18.sql`, then `supabase/migration_v19.sql`. On an existing installation, apply only migrations not yet installed. Do not reset an existing database.
4. Copy `.env.example` to `.env.local`. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`, `GROQ_WISH_MODEL`, `NEXT_PUBLIC_PAYPAL_SANDBOX_CLIENT_ID` and `PAYPAL_SANDBOX_CLIENT_SECRET`. The configured demo model is `qwen/qwen3.8-27b`; model access and free quotas depend on the provider. The OpenAI variables are optional when Groq is configured.
5. Run `npm run build` then `npm run start`. Open http://localhost:3000. For development, use `npm run dev`.

Private keys belong only in server environment variables. Never commit `.env.local`. The Supabase anonymous key and PayPal client ID are public client configuration; service-role keys and PayPal secrets are server-only.

## Test the complete flow

Use independent browser profiles to keep anonymous buyer and seller sessions separate. Merely opening another tab on the same origin shares the session.

1. **Buyer A:** open `/crear`, enter “Busco audífonos inalámbricos con micrófono para reuniones, máximo 100 soles”, city “Lima”, budget “S/100”. Analyze and publish. Find the new wish in `/explorar`, open it and join the group.
2. **Buyer B:** in another profile, describe the same need in different words. Analyze, open a matching wish and choose **Me interesa** or **Unirme al grupo**. Joining is free.
3. **Seller:** open `/vendedor` in a third profile. The page displays the session UUID when access is not enabled. As the project administrator, authorize that specific session once in Supabase SQL Editor:

```sql
insert into public.demo_sellers(user_id, display_name)
values ('REPLACE_WITH_SELLER_SESSION_UUID', 'Demo seller');
```

4. Refresh `/vendedor`. Select the wish and publish an offer: USD 19.99, 3 units, minimum 2 interested people.
5. **Buyer B:** reopen the wish. With two interested people, the PayPal checkout is enabled. Sign in with a **Personal Sandbox account**, different from the merchant's Business Sandbox account. Use test balance only.
6. Complete the PayPal approval. DeseAI captures and validates the order on the server. Confirm that the receipt appears and that `/pedidos` shows the purchase as paid. Cancelled or pending payments must not be presented as completed.

No real payment or physical fulfillment is provided. Each Sandbox capture goes to the application merchant account. This is not escrow, a pooled payment, automatic seller payouts or a delivery service. The city is user-provided, not GPS tracking. Product images are illustrative references.

## PayPal integration

- PayPal JavaScript SDK v6 renders checkout and handles approval/cancellation.
- `POST /api/paypal/orders` checks the authenticated buyer, offer, interest threshold, price and available stock before creating a Sandbox order using Orders API v2.
- `POST /api/paypal/capture` validates ownership, reserves stock transactionally and verifies the capture amount and currency before recording a completed payment.
- `POST /api/paypal/webhook` verifies PayPal signatures and reconciles supported capture events with idempotent processing.

To test webhooks, expose the application at a public HTTPS URL and register `https://YOUR_DOMAIN/api/paypal/webhook` in the same PayPal Sandbox application. Subscribe to `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.PENDING` and `PAYMENT.CAPTURE.DENIED`, then set `PAYPAL_WEBHOOK_ID`. Local checkout can confirm through the capture response without an externally reachable webhook; the deployed demo received a real `PAYMENT.CAPTURE.COMPLETED` notification, validated its signature through PayPal and recorded the event in Supabase on 12 November 2026.

## Architecture and access

Next.js, React and TypeScript provide the UI and server routes. Supabase stores anonymous sessions, private original wishes, public summaries, interests, authorized sellers and payment records under RLS. Groq/Qwen handles interpretation and semantic ranking; candidate selection also considers category, city and budget. An optional OpenAI embedding path remains available.

Public routes include `/`, `/crear`, `/explorar`, `/deseo/publicado/[id]`, `/vendedor` and `/pedidos`. A fresh visitor gets a new anonymous identity. Clearing browser storage loses that browser's access to previous anonymous purchases; account recovery is not implemented.

## Validation and limits

```bash
npm run validate
npm run test:logic
npm run test:payments
npm run test:sessions
npm run typecheck
npm run build
```

The production build has passed locally. Real Groq analysis/matching, Supabase persistence and a completed PayPal Sandbox purchase were exercised during development. The payment logic scripts include simulated contract tests; they do not prove exhaustive concurrency safety. Separately, a real Sandbox checkout and signed webhook were verified on the hosted Vercel deployment. Fulfillment, refunds, durable user accounts, production payments and recovery/reconciliation jobs remain future work. See `MATRIZ_QA_V19.md` for detailed Spanish QA notes.

## Hackathon submission

Provide this public repository with its MIT license, complete run instructions (or an accessible hosted demo) and a public YouTube demonstration under three minutes. The demo can be narrated in Spanish with a complete English translation. Recording and editing files are kept separately in the local, ignored `video-demo` workspace.

[PayPal AI Hackathon rules](https://paypalaihackathon.devpost.com/rules)
