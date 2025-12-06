## Objetivo
1. Dejar de crear múltiples documentos por acción en `analyticsevents` y consolidar todo en un único documento por usuario (`UserAnalytics`).
2. Asegurar que el tiempo activo por categoría y comercio se registre y aparezca en el backend y el frontend.

## Cambios en Backend
1. Controlador `postAnalyticsEvent`:
- Eliminar (o proteger por flag env) la inserción en `AnalyticsEventModel.create(...)` para no generar un documento por acción.
- Mantener y reforzar la actualización incremental del documento `UserAnalytics`:
  - `VIEW_START`: `visits++` y `lastVisit` en `commerce/categories`.
  - `VIEW_PAUSE`/`VIEW_END`: `totalTimeMs += durationMs` y `lastVisit`.
  - `CLICK_SOCIAL`/`CLICK_CONTACT`/`CLICK_MAP`: incrementar contadores en el mismo documento.
- Añadir variable de entorno `ANALYTICS_PERSIST_EVENTS=false` para permitir desactivar/activar el log crudo si se desea conservar trazabilidad.

2. Endpoint `GET /api/analytics/user/:userId?`:
- Ya consulta `UserAnalytics`. Mantener respuesta ordenada por `totalTimeMs` desc y con nombres via `lookup`.

## Cambios en Frontend
1. Cliente de analítica `frontend/src/lib/analytics.ts`:
- Usar `navigator.sendBeacon` para `VIEW_END` (y opcionalmente `VIEW_PAUSE`) con payload `FormData`, asegurando entrega al cerrar/navegar.
- Mantener `axios` para eventos normales con retry básico en segundo plano.
- Mantener cronómetro `useAnalyticsView` y mejorar limpieza de listeners.

2. Integración de cronómetro:
- `category/[id]`: ya integrado; verificar envío de `VIEW_START`, `VIEW_PAUSE`, `VIEW_END`.
- `commerce/[id]`: ya integrado; verificar envío correcto.
- `home/page.tsx`: inicializar `useAnalyticsView` en detalle cuando `selectedCommerce` está definido y cuando se entra a una categoría desde home (para que cuente el tiempo también ahí).

3. Panel Analytics (Usuarios):
- Ya muestra datos; añadir auto‑actualización (ya implementada) y botón "Mi usuario".
- Mostrar duración con formato amigable (`h m s`) y reflejar cambios tras interacción.

## Verificación
1. Iniciar sesión y abrir un comercio por ~10s; cambiar de pestaña y volver; navegar a otra ruta.
2. Revisar `GET /api/analytics/user` en panel Usuarios con "Auto‑actualizar" activado; validar:
- `totalTimeMs` > 0 en comercio y categoría correspondientes.
- `visits` incrementado.
- Clicks sumados en redes/contacto/mapa.
3. Confirmar que no se crean nuevos documentos en `analyticsevents` si el flag está desactivado.

## Opcional
- Script de backfill para poblar `UserAnalytics` desde `analyticsevents` históricos.
- Autocompletar por nombre/email en el buscador de usuarios.

¿Confirmo y procedo a aplicar estos cambios? 