# Pruebas de aceptación — DeseAI V17

## Montaje
- [ ] `npm install` termina sin errores.
- [ ] `npm run typecheck` y `npm run build` terminan correctamente.
- [ ] SQL ejecutado en un Supabase de prueba; RLS habilitado.
- [ ] `Anonymous Sign-Ins` habilitado y variables de entorno cargadas.
- [ ] Nunca exponer `OPENAI_API_KEY` ni `service_role` en el navegador.

## IA + coincidencias reales
- [ ] Navegador A: «Quiero audífonos inalámbricos en Lima por S/80» → análisis del modelo.
- [ ] A publica y ve su deseo en «Mis deseos».
- [ ] Navegador B (incógnito): «Busco auriculares Bluetooth en Lima por S/90» → muestra la coincidencia de A con su **resumen público**.
- [ ] B expresa interés: contador aumenta; al quitarlo disminuye.
- [ ] B no puede consultar el texto privado de A en `wishes` mediante API Supabase.
- [ ] Dos personas con ciudades incompatibles no aparecen como coincidencias.
- [ ] Un deseo de celular no coincide con uno de audífonos aunque el presupuesto sea similar.
- [ ] A elimina su deseo: ya no aparece en «Explorar» tras refrescar.
- [ ] Un deseo no genera ni muestra cobros o reservas.

## Acceso y fallos
- [ ] Sin configuración, aparece «Modo demostración» y no se reclama IA real.
- [ ] Sin OPENAI_API_KEY no se simula una respuesta como si viniera de OpenAI.
- [ ] Solicitud sin token válido obtiene HTTP 401.
- [ ] Texto con menos de 12 caracteres recibe validación.
- [ ] El límite diario de IA devuelve HTTP 429 al agotarse.
- [ ] Se conservan la composición y las animaciones de la V16 en escritorio y móvil.
- [ ] Con «Reducir movimiento», los contenidos siguen siendo accesibles.

## Privacidad
- [ ] Al publicar solo se comparte título/resumen/categoría/ciudad/presupuesto general; no el texto íntegro.
- [ ] Se debe informar al usuario de que la sesión anónima no puede recuperarse al borrar datos del navegador.
- [ ] Revisar manualmente que no haya datos personales en los resúmenes públicos antes de una demo pública.
