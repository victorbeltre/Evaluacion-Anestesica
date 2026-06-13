# Configuracion Google Sheets

Esta integracion reemplaza Supabase como destino de guardado online.
Ademas, al presionar `Guardar` en la app, Apps Script crea un PDF formal en una carpeta de Drive llamada `Evaluaciones Preanestesicas PDF` y guarda el enlace en la hoja.

## 1. Crear la hoja en Google Drive

1. Entrar a Google Drive con `anestesiahosgedopol@gmail.com`.
2. Crear una hoja llamada `Evaluaciones Anestesia HOSGEDOPOL`.
3. Ir a `Extensiones -> Apps Script`.
4. Pegar el contenido de `google-apps-script/Code.gs`.
5. Guardar.

## 2. Configurar token privado

1. En Apps Script, ejecutar la funcion `setup`.
2. Ejecutar la funcion `setAccessToken`.
3. Escribir un token largo, por ejemplo una frase aleatoria de 40+ caracteres.
4. Guardar ese token en un lugar seguro.

La primera vez que se cree un PDF, Google puede pedir permiso para usar Drive. Acepta ese permiso con la cuenta `anestesiahosgedopol@gmail.com`.

## 3. Publicar como Web App

1. Apps Script -> `Deploy -> New deployment`.
2. Tipo: `Web app`.
3. Execute as: `Me`.
4. Who has access: `Anyone`.
5. Copiar la URL de Web App.

El acceso sigue protegido porque el script exige el token privado antes de leer o escribir.

### Si ya existe un despliegue

Cuando cambies el codigo de Apps Script despues de haber publicado:

1. Apps Script -> `Deploy -> Manage deployments`.
2. Abrir el despliegue del Web App con el icono de editar.
3. En `Version`, elegir `New version`.
4. Presionar `Deploy`.

Si solo guardas el archivo sin crear una version nueva, la URL puede seguir ejecutando el codigo anterior.

## 4. Conectar desde la app

1. Abrir la app.
2. En el panel `Google Sheets`, pegar:
   - URL Apps Script
   - token privado
3. Presionar `Conectar`.

La configuracion se guarda solo en ese navegador/dispositivo, no en GitHub.

## Comprobacion rapida

- La hoja usada por la app se llama `Evaluaciones`.
- La fila 1 debe mostrar columnas como `patient_name`, `hcn`, `asa`, `hb`, `platelets`, `recommendations` y `payload_json_1`.
- Cuando se guarda manualmente una evaluacion, tambien debe llenarse `pdf_url` con el enlace al PDF guardado en Drive.
- Si Drive muestra "ultima modificacion" pero no aparece ninguna fila, actualiza el despliegue del Web App con una `New version`.
- Si necesitas probar desde Apps Script, ejecuta `debugWriteTest`; debe crear una fila con HCN `PRUEBA` y un PDF de prueba.

## Seguridad

- No poner el token en `.env`, GitHub ni codigo fuente.
- Si se filtra el token, ejecutar `setAccessToken` otra vez y crear uno nuevo.
- La hoja queda en el Drive de `anestesiahosgedopol@gmail.com`.
