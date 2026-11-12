# Demo de DeseAI

Preparación del 11 de noviembre de 2026. Duración objetivo de 2 minutos y 40 segundos. El video debe durar menos de tres minutos.

## Historia

Una persona ya publicó un deseo de audífonos con micrófono en Lima. Otra persona busca algo parecido con distintas palabras. DeseAI reconoce la afinidad y las conecta. Un vendedor publica una oferta para el grupo. El comprador paga su unidad con PayPal Sandbox y consulta su pedido.

## Secuencia de grabación

| Tiempo | Acción visible | Narración sugerida |
| --- | --- | --- |
| 00:00–00:15 | Inicio, mascota y propuesta | Muchas personas quieren lo mismo, pero buscan por separado. DeseAI las ayuda a encontrarse. |
| 00:15–00:30 | Abrir el deseo inicial, señalar Lima | Ya hay una persona buscando audífonos con micrófono en Lima. |
| 00:30–01:00 | Segundo comprador escribe y analiza | Otra persona lo describe con sus propias palabras. La IA interpreta producto, ciudad y presupuesto, y encuentra un deseo compatible. |
| 01:00–01:15 | Abrir coincidencia y sumarse | El comprador se une al grupo sin pagar. La localidad ayuda a reunir intereses compatibles. |
| 01:15–01:40 | Vendedor publica oferta | Un vendedor autorizado propone precio, unidades y mínimo de interesados. |
| 01:40–02:15 | Comprador abre oferta y completa Sandbox | Al alcanzar el mínimo, cada persona puede pagar su unidad con PayPal. Aquí usamos el entorno Sandbox. |
| 02:15–02:35 | Confirmación y Mis pedidos | El pago se valida en el servidor y queda registrado. El comprador puede consultar el importe y el número de pedido. |
| 02:35–02:40 | Cierre | DeseAI transforma deseos compartidos en oportunidades de compra. |

## Texto para el segundo comprador

Quiero auriculares inalámbricos Bluetooth con micrófono para videollamadas de trabajo, hasta 100 soles.

Ciudad Lima. Presupuesto S/100. Fecha opcional.

## Oferta de demostración

Audífonos inalámbricos con micrófono. Precio USD 19,99. Tres unidades. Mínimo dos interesados. La imagen debe identificarse como referencia mientras no haya fotos específicas del vendedor.

## Sesiones y datos existentes

- El origen 127.0.0.1:3048 contiene la sesión autorizada como vendedor. Esta sesión también fue el primer comprador en los ensayos.
- El origen localhost:3048 contiene el segundo comprador, que ya completó un pago en la oferta anterior.
- Abrir otra pestaña del mismo origen conserva la sesión. Para repetir un pago con otro comprador se necesita un perfil de navegador independiente.
- Para una nueva toma conviene usar una oferta nueva. No borrar ni alterar pagos confirmados para simular un reinicio.
- El vendedor debe estar autorizado antes de grabar. Cambiar una etiqueta visual no otorga permisos.
- La cuenta Personal de PayPal Sandbox paga y la cuenta Business recibe. Las contraseñas se consultan en PayPal Developer y se excluyen del video.

## Preparación antes de grabar

- Abrir tres perfiles o sesiones independientes para los personajes si se quiere separar comprador inicial, comprador nuevo y vendedor.
- Autorizar específicamente la sesión nueva de vendedor si se elige cambiar la sesión ya autorizada.
- Preparar un deseo inicial con un interés, para que el nuevo comprador complete el mínimo de dos.
- Verificar que Qwen tiene cuota disponible y que PayPal abre su ventana de pago en el navegador elegido.
- Crear una oferta nueva durante la toma o antes de ella, de acuerdo con el guion. Mantener coherencia entre tomas.
- Usar una ventana limpia, cerrar paneles de desarrollador y ocultar claves y contraseñas.
- Grabar acciones reales. Recortar esperas manteniendo visibles entradas y resultados.

## Alcance que debe comunicar el video

La IA interpreta y compara deseos reales. La localidad es la ciudad declarada, no una ubicación GPS. El mínimo corresponde a interesados. Cada comprador paga su unidad por separado. El pago se prueba en Sandbox. La entrega y el seguimiento logístico pertenecen a una próxima fase.

## Grabación

La grabación final aún no se ha realizado. Antes de prometer un archivo de video hay que comprobar el mecanismo de captura disponible. Las pantallas actuales permiten ensayar el guion sin generar una nueva transacción.
