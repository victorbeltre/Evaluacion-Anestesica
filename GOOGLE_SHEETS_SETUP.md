# Configuracion Google Sheets

Esta integracion reemplaza Supabase como destino de guardado online.

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

## 3. Publicar como Web App

1. Apps Script -> `Deploy -> New deployment`.
2. Tipo: `Web app`.
3. Execute as: `Me`.
4. Who has access: `Anyone`.
5. Copiar la URL de Web App.

El acceso sigue protegido porque el script exige el token privado antes de leer o escribir.

## 4. Conectar desde la app

1. Abrir la app.
2. En el panel `Google Sheets`, pegar:
   - URL Apps Script
   - token privado
3. Presionar `Conectar`.

La configuracion se guarda solo en ese navegador/dispositivo, no en GitHub.

## Seguridad

- No poner el token en `.env`, GitHub ni codigo fuente.
- Si se filtra el token, ejecutar `setAccessToken` otra vez y crear uno nuevo.
- La hoja queda en el Drive de `anestesiahosgedopol@gmail.com`.
