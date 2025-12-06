## Objetivo
Resolver el error `ReferenceError: percent is not defined` en `frontend/src/app/views/discounts/create/page.tsx` y asegurar que el bloque de vista previa y controles estén correctamente contenidos dentro del componente, con estados bien definidos.

## Causas Probables
- El bloque de “Vista previa” quedó fuera del cuerpo del componente (tras un `return` o brace de cierre), usando `percent` en ámbito de módulo.
- Falta de cierre correcto de llaves y JSX, dejando código top‑level que referencia estados React.

## Cambios Propuestos
1. Revisar y corregir el cierre del componente:
- Confirmar que toda la UI (formulario, lista y vista previa) esté dentro del `return` del componente `CreateDiscountPage`.
- Asegurar que no haya JSX ni expresiones usando `percent`, `title`, `description`, `daysOfWeek` fuera del cuerpo del componente.

2. Vista previa:
- Mantener la tarjeta y “modal” simulada dentro del mismo `return`, en un contenedor (`<div>` o fragmento), usando directamente los estados: `percent`, `title`, `description`, `minReferrals`, `daysOfWeek`.
- Usar valores por defecto seguros: `const previewPercent = Number(percent) || 0;` cuando sea necesario.

3. Estados y handlers:
- Verificar que `useState` de `percent`, `editId`, `daysOfWeek` y demás estén al inicio del componente.
- Reiniciar edición en “Cancelar” dejando `daysOfWeek` en `[]` (por defecto desactivados) y limpiando el resto.

4. Compilación y validación:
- Ejecutar build para confirmar que desaparece el `ReferenceError`.
- Navegar a `/views/discounts/create` y comprobar que la vista previa muestra valores del formulario y que “Actualizar/Cancelar/Eliminar” funcionan.

¿Aplico estos cambios y verifico la compilación y comportamiento en tiempo real?