# Plan de pruebas V18

## A. Estático y sin credenciales

- `npm run validate` comprueba assets y páginas existentes.
- `npm run test:logic` prueba la IA con respuestas simuladas.
- `npm run test:payments` prueba moneda a centavos, creación y captura simuladas, referencia de orden, rechazo de importes alterados, validación de firma de webhook simulada, estado de acceso autenticado y restricciones SQL.
- `npm run typecheck` y `npm run build` requieren `npm install` previo.

## B. Integración (requiere Supabase + OpenAI + PayPal Sandbox)

1. Habilitar acceso anónimo; A crea y publica un deseo; B lo abre.
2. C accede a `/vendedor` sin autorización: debe mostrar su UUID y **no** permitir publicar.
3. Administrador autoriza C en `demo_sellers` desde SQL Editor. C publica oferta de US$19.99, stock 3, mínimo 2.
4. Con 1 interesado el botón PayPal debe estar bloqueado. Con 2 interesados pasa a estar habilitado para cada interesado.
5. Usuario D sin interés debe ver el precio pero no puede comprar, incluso si llama manualmente a `/api/paypal/orders`.
6. Usuario C (seller) no puede comprar su propia oferta.
7. Cambiar `price_cents` en la petición de navegador no cambia el importe PayPal: la API ignora cualquier precio enviado por el cliente.
8. A paga con cuenta Personal Sandbox; la captura debe pasar a `completed`, tener `paypal_capture_id` y aumentar `paid_count` exactamente una vez.
9. Reintentar captura o enviar un webhook duplicado no debe duplicar contador ni cargos.
10. B paga desde navegador distinto; debe tener otra orden con `buyer_id` distinto.
11. Intentar crear una orden nueva para un comprador que ya pagó debe fallar.
12. Cancelar la ventana de PayPal no registra `completed`. Una orden creada puede mantener cupo durante 20 minutos.
13. Enviar webhook con firma falsa debe responder 401. Enviar webhook de importe distinto a la orden debe devolver error sin marcar compra completa.
14. Con stock 2, una tercera compra debe fallar aun bajo dos peticiones simultáneas (comprobar `FOR UPDATE`).
15. Sin `.env.local`, la web debe seguir mostrando los deseos ilustrativos y texto claro de que la integración Sandbox no está configurada.
16. En móvil y escritorio, comprobar la V15 completa con scroll, animaciones, CTA y nueva sección de ofertas, con la configuración de movimiento reducido respetada.

## C. Fallos controlados

- Intento desde otra sesión de capturar un `orderId` ajeno: error 401.
- Si PayPal devuelve `PENDING`, el pedido no se considera pagado: estado `pending` y sin marcar `completed`.
- Si el navegador se cierra tras una aprobación y el webhook público está registrado, este debe reconciliar la captura verificada.
- Si falla la red durante `capturing`, **no liberes manualmente el cupo sin conciliar primero** con PayPal Sandbox: podría haberse capturado el dinero de prueba.
- Si un deseo tiene ofertas asociadas, su eliminación estará bloqueada para no borrar accidentalmente registros de compra. Informar al autor.

## Alcance

La demo acepta **pagos de prueba individuales en USD**; no constituye un marketplace multiparty real, no retiene fondos hasta completar el grupo y no ofrece entregas ni reembolsos automáticos.
