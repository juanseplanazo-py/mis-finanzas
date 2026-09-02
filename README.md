# Mis Finanzas

App web mobile-first: una versión simple del Excel `Registro2.xlsx` en formato app.

**Navegación (bottom nav):** Inicio · Gastos · Tarjetas · Ahorros · Me deben. Botón flotante
`+` para alta rápida. Rutas: `/`, `/gastos`, `/gastos/[id]`, `/tarjetas`, `/ahorros`,
`/me-deben`, `/nuevo`, `/editar/[id]`, `/login`.

Los datos del período (movimientos) los comparte un contexto (`src/lib/periodo-context.tsx`)
entre Inicio y Gastos. Los gastos pueden llevar un **detalle opcional** (`movimiento_detalles`):
al activarlo, el Pagado se calcula como la suma del desglose.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS
- Supabase (`@supabase/supabase-js`) + Supabase Auth (email+password, **un solo usuario**, sin registro público)
- PWA instalable

## Autenticación

App personal de un solo usuario. Toda la app está detrás de login (`src/components/AuthGate.tsx`):
sin sesión → redirige a `/login`. RLS en Supabase: solo el rol `authenticated` accede a los datos
(migración `migration_004_rls_auth.sql`). El rol anónimo (publishable key sola) no puede leer ni escribir nada.

Configuración en Supabase (una sola vez):
1. Authentication → Providers → **Email**: activado. **"Allow new users to sign up"**: OFF.
2. Authentication → Users → **Add user** → tu email + contraseña.
3. SQL Editor → ejecutar en orden las migraciones de `supabase/` que falten
   (`migration_002` … `migration_005`).

## Ejecutar en local

```bash
npm install
npm run gen:icons        # iconos placeholder de la PWA
# crear .env.local a partir de .env.example (ver "Configurar Supabase")
npm run dev              # http://localhost:3000
```

## Configurar Supabase

1. Crear un proyecto en https://supabase.com.
2. **Instalación desde cero**: SQL Editor → New query → pegar
   [`supabase/schema.sql`](supabase/schema.sql) → Run.
   **Si venís de una versión anterior**: ejecutar las migraciones incrementales
   que falten, en orden: `migration_002_periodos.sql`, luego
   `migration_003_ahorros_tarjetas.sql`. Datos reales de ejemplo del Excel:
   `seed_003_datos_reales.sql` (idempotente).
3. Project Settings → API. Copiar **Project URL** y la key **`anon` / publishable**.
4. Pegar en `.env.local`:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
   ```

5. Reiniciar `npm run dev`.

## Modelo de datos

| Tabla | Rol |
|---|---|
| `periodos` | Períodos mensuales (25 de un mes → 24 del siguiente). `nombre`, `fecha_inicio`, `fecha_fin`, `ingreso`. |
| `movimientos` | Ítems presupuestados del período (`periodo_id` FK). `fecha` opcional. Montos **enteros**; `sobrante = inicial - pagado`. |
| `ahorros` | Cuentas de ahorro acumulado. `nombre`, `saldo`. |
| `tarjetas_credito` | `nombre`, `linea_credito`. |
| `tarjeta_movimientos` | Conceptos de cada tarjeta. `concepto`, `monto`, `tipo` (`cargo`/`descuento`). |
| `deudas_a_favor` | Bloque "Me deben". `persona`, `concepto`, `monto`, `estado` (`pendiente`/`pagado`). |

## Fórmulas del Dashboard (`src/lib/calc.ts`)

- **Presupuestado** = Σ `inicial` de los movimientos del período
- **Pagado** = Σ `pagado`
- **Falta por gastar** = Presupuestado − Pagado (= Σ `sobrante`)
- **Disponible real** = `ingreso` − Pagado  *(≠ Falta por gastar)*
- **Total ahorros** = Σ `saldo` de `ahorros`
- **Deuda de tarjeta** = Σ cargos − Σ descuentos  ·  **Disponible** = `linea_credito` − deuda
- **Me deben** = Σ `monto` de `deudas_a_favor` con estado `pendiente`
- Señal "Resumen hoy": ✓ si Disponible real ≥ Falta por gastar; ⚠ si no.

## Notas de arquitectura

- Opciones de los selects: [`src/lib/constants.ts`](src/lib/constants.ts).
- Formato de guaraníes: [`formatGuaranies`](src/lib/format.ts) → `Gs. 157.000` (sin decimales).
- El período seleccionado se guarda en `localStorage` (`mf_periodo_id`) y se comparte
  entre el Dashboard y el formulario.
- Importación del Excel histórico: **no implementada** (los métodos de pago y subcategorías
  del Excel todavía no coinciden con las constantes de la app).

## PWA

`npm run build && npm run start`, luego desde el navegador del celular
"Agregar a pantalla de inicio". (Instalación completa requiere HTTPS.)
