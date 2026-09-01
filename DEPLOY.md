# Mis Finanzas — Producción

**URL:** https://mis-finanzas-xi-six.vercel.app/

## Estado

| Área | Estado |
|---|---|
| Vercel | Desplegado. Repo GitHub conectado → deploy automático en cada `git push`. |
| Supabase | 6 tablas (`periodos`, `movimientos`, `ahorros`, `tarjetas_credito`, `tarjeta_movimientos`, `deudas_a_favor`). Datos reales intactos. |
| Seguridad | RLS solo para el rol `authenticated` (migración 004). Sin sesión: la API devuelve 0 filas y rechaza toda escritura. Verificado en producción. |
| Login | Supabase Auth (email + contraseña). **Un solo usuario**, sin registro público. Toda la app detrás del login; sin sesión → `/login`. |
| Variables en Vercel | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Production, Preview, Development). No son secretas. |
| Lint / Build | ✅ / ✅ |
| PWA | manifest 200, service worker activo, iconos 200, `display: standalone`, HTTPS. |

## Instalar en el celular

### Android (Chrome)
1. Abrí `https://mis-finanzas-xi-six.vercel.app/` en Chrome.
2. Menú ⋮ (arriba a la derecha) → **Agregar a la pantalla principal** / **Instalar aplicación**.
3. Confirmá. Aparece el ícono en tu pantalla de inicio.
4. **Verificar standalone:** abrila desde ese ícono. NO debe verse la barra de direcciones de Chrome. Si ves la URL arriba, no se instaló como app (repetí el paso 2 eligiendo "Instalar aplicación").

### iPhone (Safari)
1. Abrí la URL en **Safari** (no Chrome — en iOS solo Safari puede instalar PWAs).
2. Botón **Compartir** (cuadrado con flecha hacia arriba).
3. Bajá y tocá **Añadir a pantalla de inicio**.
4. Tocá **Añadir** (arriba a la derecha).
5. **Verificar standalone:** abrila desde el ícono nuevo. Debe abrir a pantalla completa, sin la barra de Safari ni los botones de navegación abajo.

> La sesión queda guardada: una vez que iniciás sesión, no te vuelve a pedir la contraseña al abrir la app (hasta que toques "Salir" o pase mucho tiempo).

## Deploys futuros

```bash
# 1. Editás código
# 2. Probás en local
npm run dev            # http://localhost:3000  (si da ChunkLoadError: borrá .next y reintentá)

# 3. Commit + push
git add -A
git commit -m "descripcion del cambio"
git push

# 4. Vercel despliega solo (~1-2 min). Ves el progreso en vercel.com.
```

- Cada push a `master` → deploy a **producción**.
- Cada push a otra rama / cada Pull Request → deploy **preview** (URL temporal para probar sin tocar producción).
- Nunca corras `npm run build` mientras `npm run dev` está activo (rompe la carpeta `.next`).

## Cambios de datos / esquema

- Los datos se editan **desde la app** (todo es editable con el login puesto).
- Cambios de esquema (nuevas tablas/columnas): script SQL incremental en `supabase/`, ejecutado a mano en el SQL Editor de Supabase. Nunca destructivo.

## Riesgos / pendientes menores

- **Iconos PWA:** son cuadrados azules lisos de placeholder. Funcionan; si querés un ícono real, se reemplazan `public/icons/icon-192.png` y `icon-512.png` (mismos tamaños) y push.
- **`/favicon.ico` da 404** en la consola: es inofensivo, el ícono de la pestaña funciona igual (via `<link rel="icon">`). Se puede silenciar agregando `src/app/icon.png` si molesta.
- **Sin backup automático de Supabase** en el plan Free más allá de lo que ofrece Supabase por defecto. Para algo crítico, exportá la base cada tanto (Supabase → Database → Backups, o un `pg_dump`).
