# Hoja Preanestesica HOSGEDOPOL

Aplicacion web para evaluacion preanestesica del Hospital General Docente de la Policia Nacional.

## Uso local

```bash
npm install
npm run dev
```

## Publicacion en GitHub Pages

El repositorio incluye `.github/workflows/deploy-pages.yml`.

Cuando se haga push a la rama `main`, GitHub Actions ejecuta:

```bash
npm ci
npm test
npm run build
```

Luego publica la carpeta `dist` en GitHub Pages.

En GitHub, activar Pages desde:

Settings -> Pages -> Build and deployment -> Source: GitHub Actions

## Version portable

```bash
npm run portable
```

El ZIP queda en `output/preanes-hosgedopol-portable.zip`.

## Guardado online en Google Sheets

La sincronizacion usa Google Apps Script y una hoja en Google Drive. Ver `GOOGLE_SHEETS_SETUP.md`.
