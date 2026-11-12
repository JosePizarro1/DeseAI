# DeseAI

## Tagline
Shared wishes. Real connections. Collective offers powered by AI and PayPal.

## Inspiration
People often want the same product but search alone. Sellers see isolated requests rather than a clear group of potential buyers. We wanted to connect compatible needs before a purchase, while keeping each person's checkout independent.

## What it does
A buyer describes a shopping wish in natural language, with an optional city and budget. DeseAI interprets the request and finds compatible wishes, even when people use different words. Buyers can join a group for free. An approved seller publishes a price, stock and minimum number of interested people. Once that minimum is reached, each interested buyer can pay for one unit with PayPal Sandbox and consult their order.

## How we built it
The application uses Next.js, React and TypeScript. Supabase provides anonymous sessions, PostgreSQL storage and row-level access controls. Qwen through Groq interprets wishes and ranks public candidate summaries selected by product category, city and budget. PayPal JavaScript SDK v6 launches checkout; server routes create and capture Sandbox orders with Orders API v2. The server checks ownership, price, currency and stock before recording completion. A webhook endpoint implements signature verification and idempotent event processing.

## Challenges
Connecting differently worded wishes required more than keyword matching. We combined structured interpretation, database candidate filtering and AI ranking. We also separated free interest from payment, kept seller authorization in the database, and made the confirmed purchase visible as an order rather than a generic success message.

## Accomplishments
We moved from a visual prototype to an application backed by real Supabase data, real AI interpretation and a successfully completed PayPal Sandbox purchase. We redesigned the purchase view around the product, collective offer, checkout and order receipt, and made the analysis state more understandable with our mascot, Deyo.

## What we learned
An understandable purchasing journey matters as much as integration code. Buyers need to know when they have only expressed interest, when they can pay, and when a purchase is actually confirmed. Payment status must come from verified server responses, not a button click.

## What's next
Durable user accounts and recovery, seller onboarding, product-specific seller photos, fulfillment coordination, refunds, production readiness and broader concurrency testing. The application is deployed on Vercel, where we verified a real Sandbox purchase and receipt of its signed capture webhook.

## Demo and testing
The demo uses PayPal Sandbox and test balance. Each payment belongs to one buyer and goes to the Sandbox application merchant. This is not escrow, pooled group funds, automatic seller payouts or a physical delivery service. Product images are illustrative references. Follow README.md to run the app and test with separate buyer and seller profiles.

## Built with
Next.js, React, TypeScript, Supabase, PostgreSQL, Groq, Qwen, PayPal JavaScript SDK v6, PayPal Orders API v2.

## Links to add before submitting
- Public source repository: https://github.com/JosePizarro1/DeseAI
- Public YouTube demonstration URL
- Hosted demo: https://deseai-rho.vercel.app

Do not submit this document with placeholder links. Provide test access instructions without publishing private server credentials.
