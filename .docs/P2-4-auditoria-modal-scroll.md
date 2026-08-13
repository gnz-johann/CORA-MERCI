# Prioridad 2 — Modal de Auditoría: altura máxima + scroll interno

## Qué se hizo
En el modal de detalle de `Auditoria.jsx` ("Detalle de la actividad"), el contenedor
principal pasó de:

```
className="bg-[#061628] border border-[#0D2647] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden"
```

a:

```
className="bg-[#061628] border border-[#0D2647] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
```

y el bloque de contenido (`<div className="p-8 space-y-6">`, el que crece según cuántos
campos cambiados tenga el log) pasó a:

```
className="p-8 space-y-6 overflow-y-auto flex-1 min-h-0"
```

## Por qué este approach y no otro
El contenedor tenía `overflow-hidden` sin límite de altura — con un log que trae muchos
campos en `datos_anteriores`/`datos_nuevos` (el `diff` se arma dinámicamente, sin límite de
cantidad de campos), el modal podía crecer más alto que la pantalla y el botón "Cerrar" del
footer quedaba empujado fuera del viewport, inalcanzable sin hacer scroll de la página
completa (que ni siquiera es posible porque el fondo del modal está en `fixed inset-0`).

La solución: convertir el modal en un contenedor flex en columna con altura máxima
(`max-h-[85vh]`), dejar el header y el footer (ambos con `shrink-0` agregado) como
elementos de tamaño fijo fuera del área de scroll, y que **solo** el bloque de contenido del
medio (`flex-1 min-h-0 overflow-y-auto`) crezca y haga scroll internamente. El `min-h-0` es
necesario porque un hijo flex con `overflow-y-auto` no se encoge por debajo del tamaño de su
contenido si no se le fuerza explícitamente — es un detalle de flexbox fácil de omitir, así
que se agregó a propósito, no por accidente.

Con esto: el header (con el ícono y el título) y el footer (con el botón "Cerrar") quedan
siempre visibles y alcanzables sin importar cuántos campos traiga el `diff`, y el usuario
puede scrollear solo la parte de en medio.

## Verificación
`npm run lint` no muestra errores nuevos en `Auditoria.jsx` (el único que marca es el mismo
patrón de `useEffect` ya presente en el resto del proyecto, no relacionado con este cambio).
No se hizo captura visual en navegador — es un cambio puramente de CSS/Tailwind, verificado
leyendo la estructura del JSX resultante.
