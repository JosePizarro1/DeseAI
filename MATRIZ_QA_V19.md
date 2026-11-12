# Matriz de revisión V19

Revisión del 10 de noviembre de 2026. Entorno local con Supabase, Qwen/Groq y PayPal Sandbox.

| Caso | Resultado | Evidencia y alcance |
| --- | --- | --- |
| Compilación de producción | Verificado | Next.js y TypeScript compilan con la ruta /pedidos |
| Pruebas de lógica | Verificado previamente | Validación y sanitización con respuestas simuladas |
| Pruebas de pagos | Verificado | Suite V18 de importes, captura, autorización y webhook con PayPal simulado |
| Deseos y coincidencias con dos compradores | Verificado previamente | Rutas reales y recorrido visual con sesiones diferentes |
| Pago Sandbox completado | Verificado | Compra real del entorno Sandbox y lectura desde la aplicación |
| Resumen después de pagar | Verificado visualmente | Identificador de PayPal, importe, cantidad y fecha de la base |
| Retirar interés después de pagar | Verificado visualmente | La acción desaparece en la sesión que compró |
| Ver mi pedido | Verificado visualmente | Navegación desde la oferta hasta /pedidos |
| Privacidad de pedidos | Verificado con servicio real | Otra sesión anónima obtiene cero filas al consultar el pedido confirmado |
| Intentos pendientes, fallidos y vencidos | Verificado con renderizado | Ocho estados evaluados. Solo completed muestra confirmación y total pagado. Falta provocar todos los estados con PayPal real |
| Oferta agotada y comprador ya pagado | Revisado en código | El resumen pagado se resuelve antes de evaluar stock y mínimo |
| Oferta sin interesados | Revisado en código | Mantiene acción para sumarse sin pagar |
| Vista estrecha de Mis pedidos | Verificado visualmente | Captura y medición del navegador a 487 px de ancho efectivo, sin desbordamiento. Falta verificar a 390 px efectivos y recorrer el checkout móvil |
| Webhook público | Pendiente | Requiere despliegue HTTPS y registro del webhook |
| Fotos del vendedor | Pendiente | La imagen actual sigue siendo una referencia de categoría |
| Acceso con correo y contraseña | Pendiente de definición | La versión actual usa sesiones de visitante por navegador |
| Entrega, seguimiento y reembolsos | Pendiente | El resumen explica que coordinación de entrega corresponde a una próxima versión |

## Decisiones de producto aplicadas

- Interesarse es gratuito. El importe corresponde a una unidad de la oferta.
- Un pago confirmado muestra un pedido con datos reales y acceso a Mis pedidos.
- Se oculta retirar interés cuando hay pago confirmado o en verificación.
- Mis pedidos muestra también intentos incompletos con su estado específico.
- Los pedidos se consultan con la sesión del comprador y las políticas de Supabase.
- El acceso sigue siendo de visitante. Cambiar de navegador puede implicar otra sesión.

## Recorrido para el video

1. Crear un deseo y mostrar la interpretación de IA.
2. Abrir una coincidencia desde otro comprador y sumarse al grupo.
3. Publicar una oferta desde el vendedor autorizado.
4. Mostrar precio y mínimo de interesados en una misma tarjeta.
5. Completar el pago con una cuenta Personal de PayPal Sandbox.
6. Abrir Mis pedidos y mostrar la confirmación con los datos reales.

## Revisión final de deseos y presentación

- Crear deseo revisado en navegador. Campo de ciudad explícito y sin imágenes rotas ni desbordamiento en el ancho probado de 860 px.
- Explorar revisado en navegador. Buscar Lima devuelve tarjetas de esa ciudad y muestra la localidad.
- Tarjetas publicadas con imágenes de referencia de categoría. Fotografías específicas de las ofertas siguen pendientes.
- Inicio revisado desplazando la página. Doce secciones reveladas, sin imágenes rotas ni desbordamiento en el ancho probado.
- Transición breve del resultado de IA y desplazamiento ajustados para respetar movimiento reducido. Preferencia revisada en código, falta prueba visual con la preferencia activada.
- Compilación, validación estática, pruebas de lógica y pagos pasan después de los últimos cambios.

## Preparación de demo del 11 de noviembre

- Pin de ciudad añadido al formulario, resultado, coincidencias, tarjetas y detalle del deseo.
- Cabecera identifica comprador o vendedor según la autorización real de la sesión.
- Guion y preparación de tomas en GUIA_DEMO.md.
- Compilación, validación y suites de lógica y pagos pasan tras estos cambios.
- La sesión compradora del ensayo tiene un pago completado. La grabación requiere una sesión y oferta nuevas.
- La toma final y el archivo de video siguen pendientes.


## Revisión final — 12 de noviembre de 2026

- Se completó una nueva compra real en PayPal Sandbox por USD 19.99. Pedido visible como confirmado y en Mis pedidos.
- Se corrigió la creación simultánea de dos sesiones al montar cabecera y página. Prueba específica de concurrencia, reutilización y reintento aprobada.
- Se corrigió el desbordamiento de la imagen que tapaba título y localidad. Comprobación de límites en escritorio y móvil de 390 px aprobada.
- Build de producción aprobado después de ambas correcciones.
- Video grabado en sesiones independientes. Contraseñas y videos originales de acceso quedan en el espacio local privado, fuera del paquete fuente.
- La recepción de webhooks desde una URL pública continúa pendiente de verificación.


## Despliegue manual verificado — 12 de noviembre de 2026

URL pública https://deseai-rho.vercel.app. Proyecto Vercel `deseai`, sin conexión automática con GitHub. Ocho variables de producción configuradas.

Pruebas desde la URL pública: alta anónima única, análisis real con cuatro coincidencias, grupo y botón PayPal disponibles, compra Sandbox por USD 19.99 completada y consultable en Mis pedidos. Notificación real PAYMENT.CAPTURE.COMPLETED recibida, firma validada y evento registrado en Supabase. Órdenes sin sesión y webhook sin firma rechazados con 401. Archivo .env.local inaccesible (404). Esta comprobación resuelve el pendiente anterior de recepción externa de webhooks.
