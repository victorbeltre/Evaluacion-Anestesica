# Configuracion Supabase

1. Crear un proyecto en Supabase.
2. En SQL Editor, ejecutar `supabase/anesthesia_evaluations.sql`.
3. En Authentication, habilitar Email/Password.
4. Copiar `.env.example` a `.env.local` y completar:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
5. Para GitHub Pages, agregar esas mismas variables como secrets o variables del repositorio y pasarlas al build.

Notas de seguridad:

- No usar `service_role` en la app web.
- La tabla usa RLS; cada usuario autenticado solo ve sus propias evaluaciones.
- GitHub no debe almacenar expedientes clinicos ni JSON con datos de pacientes.
- Desactivar registros publicos en Supabase Auth si solo el anestesiologo autorizado debe entrar.
- Crear el usuario autorizado desde Supabase Dashboard, no desde la app publica.
- Mantener `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` como secrets/variables de GitHub, nunca en archivos del repo.
