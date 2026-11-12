# DeseAI V18 · Oferta colectiva + PayPal Sandbox

V18 es la evolución de V17 y conserva el Home aprobado, Deyo, el globo, las animaciones de scroll, el analizador de deseos con IA y las rutas de Next.js. Añade un **vendedor autorizado**, **ofertas de precio colectivo**, **checkout individual con PayPal SDK v6**, **Orders API v2** y **webhooks validados**. El modo de pago opera **ÚNICAMENTE en Sandbox**, sin dinero real.

> **Importante:** esto NO es escrow, NO es una autorización/captura diferida por el total del grupo y NO hace pagos repartidos a los vendedores. El comprador acepta y paga su propia unidad en cuanto se alcanza el mínimo de personas interesadas. Cada captura en Sandbox va a la **cuenta business del aplicativo de prueba**; la persona que publica la oferta no recibe dinero. No presentar una compra como entrega de producto real.

## 1) Preparar V17 y configurar V18

1. En [Supabase](https://supabase.com/dashboard), activa **Authentication > Providers > Anonymous sign-ins**.
2. Para un **proyecto Supabase nuevo**, ejecuta `supabase/schema.sql`, **después** `supabase/migration_v18.sql` y finalmente `supabase/migration_v19.sql` en SQL Editor. Para una base **que ya contiene V17**, ejecuta **únicamente** la segunda migración. No borres las tablas existentes.
3. Copia `.env.example` a `.env.local`; configura las cuatro variables de V17 y añade las siguientes de V18:

| Variable | Origen | Exposición |
|---|---|---|
| `NEXT_PUBLIC_PAYPAL_SANDBOX_CLIENT_ID` | [PayPal Developer](https://developer.paypal.com/dashboard/applications/sandbox) > Apps & Credentials > Sandbox | Pública, solo Client ID |
| `PAYPAL_SANDBOX_CLIENT_SECRET` | Misma aplicación PayPal Sandbox, Client Secret | **Solo servidor** |
| `PAYPAL_WEBHOOK_ID` | Misma aplicación, webhook registrado para la URL del paso 6 | **Solo servidor** |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase > Project Settings > API Keys > `service_role` | **Solo servidor: privilegios elevados** |

No uses credenciales **Live** de PayPal. Nunca incluyas `service_role`, el Client Secret o `OPENAI_API_KEY` en `NEXT_PUBLIC_*`, HTML o GitHub. Las credenciales se agregan en `.env.local` / variables privadas de Vercel, **no** en el chat.

4. En tu computadora (Node.js 22 recomendado):

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

5. Para recibir notificaciones de PayPal, despliega a una **URL HTTPS** pública (Vercel o un túnel seguro de desarrollo) y registra en la aplicación **Sandbox** el webhook: `https://TU_DOMINIO/api/paypal/webhook`. Suscríbelo a **`PAYMENT.CAPTURE.COMPLETED`**, **`PAYMENT.CAPTURE.PENDING`** y **`PAYMENT.CAPTURE.DENIED`**. Copia su **Webhook ID** en `PAYPAL_WEBHOOK_ID`. Sin webhook público el flujo `onApprove -> /api/paypal/capture` puede confirmarse, pero no tendrá reconciliación externa fiable si el navegador se cierra antes.

## 2) Habilitar un vendedor de prueba (una única vez)

**No hay alta pública de vendedor.** Es una decisión intencional: solo un usuario autorizado puede establecer precios.

1. Abre `/vendedor` en un navegador privado o perfil **C**; espera a la sesión anónima. El formulario mostrará su **UUID de usuario** si no está autorizado.
2. Copia **solo el UUID** (no es una contraseña). Desde el **SQL Editor** de Supabase ejecuta:

```sql
insert into public.demo_sellers(user_id,display_name)
values ('PEGA_AQUI_EL_UUID_DEL_VENDEDOR', 'Vendedor Demo');
```

3. Recarga `/vendedor`. Aparecerá el formulario para elegir un deseo publicado, fijar título, descripción, **precio unitario en USD**, stock y mínimo de personas interesadas. Los importes son inmutables tras la publicación para proteger los pagos.

## 3) Escenario guiado con 3 navegadores

1. **A / comprador 1**: en `/crear`, publica «Quiero audífonos inalámbricos para reuniones en Lima, máximo S/100». Abre su enlace `/deseo/publicado/UUID` y pulsa **«Me interesa»**.
2. **B / comprador 2**: en incógnito, abre el **mismo enlace** y pulsa **«Me interesa»**. La página de A actualizará el número en ~8 s, o puedes recargar.
3. **C / vendedor**: desde `/vendedor` y con autorización, publica una oferta para ese deseo: **US$19.99**, **3 unidades**, **mínimo 2 interesados**.
4. **A y B**: al estar interesados y alcanzado el mínimo, cada uno ve su botón **PayPal Sandbox** en la misma página. Abre el checkout y accede con una **cuenta Personal Sandbox**, distinta de la cuenta Business Sandbox del comercio. Nunca uses dinero ni cuentas reales.
5. PayPal aprueba el pago, el servidor captura con Orders API v2, valida referencia, importe y moneda, registra la captura en `payment_orders` y actualiza `paid_count` (0/3 → 1/3 → 2/3). Si se completan las tres compras, el límite del stock se marca como completo.
6. Verifica los resultados en `public.payment_orders` desde SQL Editor y en PayPal Sandbox Transactions. No afirmes que hubo un pago si el estado no es **`completed`**.

## 4) Rutas y funciones

| Ruta | Uso |
|---|---|
| `/` | Home V15/V17 y animaciones preservados |
| `/explorar` | Deseos publicados, más catálogo ilustrativo |
| `/crear` | Publicación de deseos con IA/Supabase |
| `/deseo/publicado/[id]` | Interés colectivo, ofertas publicadas y botón PayPal SDK v6 cuando corresponda |
| `/vendedor` | Formulario privado mediante `demo_sellers` / RLS |
| `POST /api/paypal/orders` | Valida sesión y cupo, obtiene precio del servidor y crea orden PayPal |
| `POST /api/paypal/capture` | Valida propiedad del pedido, reclama cupo y captura/verifica con PayPal |
| `POST /api/paypal/webhook` | Verifica firma mediante API oficial de PayPal, importe, moneda e idempotencia |

**Seguridad aplicada:** `service_role` solo en endpoints de servidor; JWT comprobado con Supabase Auth; RLS para vendedores y compradores; precio en centavos leído desde Supabase; `PayPal-Request-Id` idempotente; `FOR UPDATE` en transacciones de cupo; captura registrada solo tras respuesta API o webhook con firma válida; eventos deduplicados por `event_id`; el comprador no puede escribir directamente su estado de pago.

**Reserva temporal:** una orden creada conserva cupo durante 20 minutos. Cuando comienza la captura pasa al estado `capturing`, que continúa ocupando un cupo; un fallo de red ambiguo puede requerir conciliación de órdenes en Sandbox antes de liberarlo. En producción necesitarías una tarea de reconciliación y un sistema de fulfillment, reembolsos y protección adicional contra abuso.

## 5) Pruebas y limitaciones

```bash
npm run validate
npm run test:logic
npm run test:payments
npm run typecheck
npm run build
```

`PRUEBAS_V18.md` describe casos de pago duplicado, Webhook, cancelación, cupos y el recorrido completo.

**Estado actualizado:** la compilación de producción pasó. Se probaron interpretación y coincidencias con Groq/Qwen, persistencia en Supabase y un pago completado con PayPal Sandbox. La recepción externa del webhook sigue pendiente de verificación. Consulta el README principal en inglés para la configuración vigente con Groq y las tres migraciones.

### Documentación oficial utilizada

- [PayPal JS SDK v6](https://developer.paypal.com/sdk/js/set-up/)
- [PayPal Orders API v2](https://developer.paypal.com/api/rest/integration/orders-api)
- [Verificar firmas de webhooks](https://developer.paypal.com/api/rest/webhooks/)
