## Objetivo
Mover las pestañas de panel (Admin/Categoría/Comercio/Usuarios) desde la cabecera de Analytics a una mini lista incrustada bajo “Resumen General” en el Sidebar. En móvil, mantener selector dentro de la vista Analytics. Mantener diseño acorde al proyecto.

## Cambios en Sidebar (Desktop)
- Añadir sub-items bajo el enlace “Resumen General” (solo para admin):
  - Admin → `/views/analytics?panel=admin`
  - Categoría → `/views/analytics?panel=category`
  - Comercio → `/views/analytics?panel=commerce`
  - Usuarios → `/views/analytics?panel=users`
- Estilo: mini-pills/links con `rounded-lg`, `bg-emerald-500/10` activas, espaciado compacto y tipografía `text-sm`. Resaltado en función de `pathname === '/views/analytics'` y `panel` de la query.
- Estado activo: detectar `usePathname` + `useSearchParams` y aplicar estilo activo al item correspondiente.

## Cambios en Analytics (Vista)
- Eliminar/ocultar la barra de pestañas superior en desktop.
- Leer `panel` desde `useSearchParams` y sincronizar `activePanel` con la query; default `admin`.
- Mantener un selector segmentado solo en móvil (debajo del título), para que los usuarios sin Sidebar puedan cambiar de panel.
- Navegación: al cambiar el panel en móvil, usar `router.replace('/views/analytics?panel=...')` para mantener el estado en URL.

## Navbar (Móvil)
- Sin cambios mayores; “Resumen General” sigue enlazando a `/views/analytics`. El selector segmentado interno permitirá cambiar entre paneles.

## Roles y visibilidad
- Mini lista bajo “Resumen General” solo visible para admin.
- En móvil, el selector segmentado se muestra solo en la página de Analytics para admin.

## Verificación
- Navegar a “Resumen General”; ver mini lista bajo el item en Sidebar.
- Click en “Categoría/Comercio/Usuarios” actualiza la vista y resalta el item activo.
- En móvil, la cabecera de Analytics muestra el selector segmentado; URL refleja `?panel=` y contenido cambia.

¿Confirmo y aplico estos cambios en Sidebar y Analytics?