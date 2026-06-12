# Seguridad del proyecto

## Principios importantes

- El frontend publicado en GitHub Pages siempre entrega HTML, CSS y JavaScript al navegador. Eso significa que no puede ser secreto ni inclonable al 100%.
- Los datos clinicos y permisos deben protegerse en el backend, no confiando en que el frontend sea privado.
- Nunca colocar `service_role`, tokens personales de GitHub, claves privadas ni archivos `.env` reales en el repositorio.

## GitHub

Para impedir que otros clonen el codigo fuente desde GitHub, cambiar el repositorio a privado:

1. GitHub -> repositorio -> Settings.
2. Danger Zone -> Change repository visibility.
3. Seleccionar `Private`.

Advertencia: si la cuenta usa GitHub Free, GitHub Pages puede despublicarse al volver privado el repositorio. Si necesitas app online y codigo privado, usa una plataforma con despliegue desde repo privado, por ejemplo Vercel, Netlify, Cloudflare Pages o un servidor propio.

## Google Sheets / Apps Script

Para que solo el propietario tenga acceso al backend:

1. Crear la hoja desde `anestesiahosgedopol@gmail.com`.
2. Instalar `google-apps-script/Code.gs` en Apps Script.
3. Configurar un token privado con `setAccessToken`.
4. Pegar la URL de Apps Script y el token solo dentro de la app, en cada dispositivo autorizado.
5. No colocar el token en GitHub, `.env`, documentación pública ni codigo fuente.

Si el token se filtra, ejecutar `setAccessToken` de nuevo y crear uno distinto.

## Auditoria automatica

El comando siguiente revisa archivos versionados y falla si detecta patrones obvios de secretos:

```bash
npm run security:audit
```

GitHub Actions ejecuta esta auditoria antes de pruebas y build.
