## Objetivo
Mostrar una sublista bajo “Resumen General” (Admin, Categoría, Comercio, Usuarios) SOLO cuando el item “Resumen General” está activo. Si el usuario navega a otra sección, la sublista se oculta.

## Comportamiento
- Desktop: sublista aparece expandida únicamente cuando `pathname === '/views/analytics'` y el rol es admin.
- Mobile: no se muestra; el cambio de panel se mantiene en la vista Analytics con el selector segmentado.
- Navegación: cada subitem enlaza a `/views/analytics?panel=<admin|category|commerce|users>`.

## Implementación (Sidebar)
- Archivo: `frontend/src/components/Sidebar/page.tsx`.
- Lógica:
  1. Mantener `isActive(href)` para el item principal.
  2. Dentro del `map` de `section.items`, renderizar la `Link` del item como está.
  3. Inmediatamente después de la `Link`, condicionar un bloque JSX:
     - `item.title === 'Resumen General' && userData?.role === 'admin' && isActive(item.href)`.
     - Sublista con 4 `Link` hijos:
       - Admin → `/views/analytics?panel=admin`
       - Categoría → `/views/analytics?panel=category`
       - Comercio → `/views/analytics?panel=commerce`
       - Usuarios → `/views/analytics?panel=users`
  4. Estilos:
     - Contenedor: `mt-2 ml-8 grid grid-cols-1 gap-1`.
     - Item: `px-3 py-1.5 rounded-lg text-sm`.
     - Activo (opcional, si `useSearchParams` está disponible): `bg-emerald-500/10 text-emerald-700`.
     - Normal: `hover:bg-emerald-500/5 text-gray-700`.
- Evitar el error de compilación: No insertar etiquetas de bloque fuera de retornos válidos; mantener la sublista dentro del fragmento ya retornado por el `map`. No usar `aside` ni contenedores adicionales fuera del retorno principal.

## Implementación (Analytics)
- Ya sincroniza `panel` con la URL y oculta tabs en desktop; no se requiere cambio adicional.

## Verificación
- Ir a “Resumen General”: Sidebar muestra sublista con 4 entradas.
- Cambiar a otra sección: sublista desaparece.
- En móvil: sublista no se muestra; selector interno sigue activo.

¿Confirmo para aplicar estos cambios en Sidebar con la sublista colapsable y estilo indicado?