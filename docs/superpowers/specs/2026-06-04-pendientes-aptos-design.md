# Modulo Pendientes y Aptos Interdepartamentales

Fecha: 2026-06-04

## Objetivo

Convertir la app de evaluacion preanestesica HOSGEDOPOL en un sistema de seguimiento clinico, no solo de captura. El modulo debe identificar pacientes que aun no estan listos para cirugia, explicar que falta, y ayudar al anestesiologo a registrar aptos o interconsultas de cardiologia, neumologia y endocrinologia/diabetologia.

La funcion debe apoyar el criterio clinico del anestesiologo. No debe autorizar ni diferir automaticamente una cirugia sin revision humana.

## Alcance

Se agregaran dos superficies funcionales:

1. Pestaña interna **Pendientes** en el sistema, para listar pacientes con pruebas, aptos, analiticas o acciones faltantes.
2. Apartado **Aptos / Interconsultas** dentro de la evaluacion, para registrar datos relevantes de otros departamentos.

Tambien se agregara un motor inicial de reglas clinicas que genere pendientes automaticos mientras se llena la evaluacion.

## Navegacion

La app evolucionara hacia un sistema con navegacion interna, sin abrir pestañas nuevas del navegador:

- Dashboard
- Nueva evaluacion
- Pacientes
- Pendientes
- Aptos / Interconsultas
- Importar ZIP
- Reportes

Para esta iteracion, el modulo debe integrarse con la estructura actual sin requerir base de datos remota. Los datos seguiran guardandose localmente en `localStorage`, con el mismo esquema exportable en JSON.

## Datos Nuevos

Cada evaluacion tendra un bloque `clearances`:

- `cardiology`
  - `required`: indica si la app sugiere o el usuario marca que requiere apto.
  - `status`: pendiente, solicitado, recibido, no requerido.
  - `date`: fecha del apto si existe.
  - `ejectionFraction`: fraccion de eyeccion ventricular izquierda reportada por ecocardiograma.
  - `echoSummary`: resumen de ecocardiograma relevante.
  - `ekgSummary`: resumen de EKG relevante.
  - `riskSummary`: riesgo cardiovascular o comentario del cardiologo.
  - `recommendations`: recomendaciones perioperatorias.
- `pulmonology`
  - `required`, `status`, `date`.
  - `baselineSpo2`: saturacion basal si fue documentada.
  - `spirometrySummary`: resumen de espirometria si aplica.
  - `diagnosisSummary`: EPOC, asma, apnea del sueno u otro hallazgo relevante.
  - `recommendations`: broncodilatadores, oxigeno, CPAP/BiPAP o vigilancia.
- `endocrinology`
  - `required`, `status`, `date`.
  - `hba1c`: hemoglobina glucosilada si esta disponible.
  - `glucosePlan`: manejo de glucemias, insulina o antidiabeticos.
  - `thyroidSummary`: estado tiroideo si aplica.
  - `recommendations`: recomendaciones perioperatorias.

Cada evaluacion tambien podra tener `manualPendingItems`, una lista de pendientes agregados por el anestesiologo.

## Pendientes Automaticos

La app generara una lista calculada de pendientes combinando datos faltantes, valores alterados y reglas de interconsulta.

Tipos de pendientes:

- Analiticas faltantes: hemograma, coagulacion, creatinina/electrolitos, tipificacion, serologias.
- Analiticas alteradas: valores fuera de rango que requieren repetir, confirmar u optimizar.
- Transfusion: falta grupo ABO/Rh, anticuerpos irregulares o reserva de sangre cuando aplique.
- Aptos interdepartamentales: cardiologia, neumologia, endocrinologia/diabetologia.
- Pendientes manuales: notas o solicitudes escritas por el anestesiologo.

Cada pendiente tendra:

- `category`: laboratorio, sangre, cardiologia, neumologia, endocrino, manual.
- `priority`: critica, importante, rutinaria.
- `title`: descripcion corta.
- `detail`: razon clinica legible.
- `source`: automatico o manual.
- `resolved`: estado manual para marcar si ya se resolvio.

## Reglas Clinicas Iniciales

### Cardiologia

Sugerir apto por cardiologia o datos cardiovasculares adicionales cuando exista alguna de estas condiciones:

- METs menor de 4.
- ASA III o IV con comorbilidad cardiovascular documentada.
- Hipertension arterial severa o cifras tensionales muy elevadas.
- Disnea, dolor toracico, arritmia, soplo relevante o EKG alterado documentado en notas.
- Cirugia mayor o procedimiento de alto riesgo cuando haya enfermedad cardiovascular.
- Antecedente de infarto, insuficiencia cardiaca, valvulopatia, marcapasos o cardiopatia relevante registrado como comorbilidad manual.

Si se marca cardiologia como requerido, mostrar campos de FEVI, eco, EKG, riesgo y recomendaciones.

### Neumologia

Sugerir apto por neumologia cuando exista alguna de estas condiciones:

- SpO2 baja.
- EPOC, asma no controlada, apnea del sueno severa o enfermedad pulmonar relevante.
- Disnea, infeccion respiratoria reciente o necesidad de oxigeno documentada.
- Cirugia toracica, abdominal alta o procedimiento con riesgo respiratorio importante.

Si se marca neumologia como requerido, mostrar campos de saturacion basal, espirometria, diagnostico y recomendaciones.

### Endocrinologia / Diabetologia

Sugerir apto por endocrinologia o diabetologia cuando exista alguna de estas condiciones:

- Diabetes con glucemia fuera del rango esperado.
- Uso complejo de insulina o hipoglucemiantes documentado.
- HbA1c elevada cuando este disponible.
- Hipertiroidismo, hipotiroidismo no controlado u otra endocrinopatia relevante en comorbilidades manuales.

Si se marca endocrino como requerido, mostrar HbA1c, plan de glucosa/insulina, estado tiroideo y recomendaciones.

## Pantalla Pendientes

La pestaña **Pendientes** mostrara pacientes guardados con pendientes activos.

Filtros:

- Nombre
- HCN
- Fecha de evaluacion
- Categoria
- Prioridad
- Estado del apto

Columnas:

- Paciente y HCN
- Fecha de evaluacion
- Procedimiento
- Pendientes principales
- Prioridad mayor
- Accion: abrir evaluacion

La pantalla debe ordenar primero los pendientes criticos, luego importantes, luego rutinarios. Los pacientes sin pendientes activos no apareceran por defecto.

## Experiencia Dentro de la Evaluacion

En el formulario, el apartado **Aptos / Interconsultas** debe:

- Mostrar tarjetas para cardiologia, neumologia y endocrino/diabetologia.
- Permitir marcar manualmente si un apto es requerido.
- Mostrar automaticamente una alerta cuando la app detecte que conviene solicitarlo.
- Guardar fecha, estado y comentarios.
- Mostrar campos especificos solo cuando el apto sea requerido o recibido.

El panel de hallazgos relevantes tambien debe incluir pendientes de aptos junto a laboratorios alterados.

## Recomendaciones Personalizadas

Las recomendaciones al paciente deben incluir:

- Pruebas pendientes especificas.
- Aptos pendientes por departamento.
- Recomendaciones relevantes de cardiologia, neumologia o endocrino si fueron registradas.
- Recordatorio de ayuno preoperatorio.
- Reserva sanguinea por grupo y tipo cuando aplique.

## Manejo de Errores y Casos Dudosos

- Si un campo requerido para una regla esta vacio, la app no debe inventar el dato; debe generar pendiente solo cuando la ausencia sea clinicamente relevante.
- Si una regla se activa por texto libre, la alerta debe decir que fue inferida desde notas o comorbilidades manuales.
- Si el usuario marca un apto como no requerido, la app debe respetarlo pero mantener visible la razon automatica como advertencia no bloqueante.
- Si se abre una evaluacion antigua sin `clearances`, la app debe completar el bloque con valores iniciales sin perder datos previos.

## Arquitectura

Se mantendra React + Vite.

Unidades propuestas:

- `pendingRules`: funciones puras que calculan pendientes automaticos desde `FormState`.
- `clearanceDefaults`: estructura inicial de aptos.
- `ClearancesPanel`: UI de aptos/interconsultas dentro de la evaluacion.
- `PendingView`: pantalla de pacientes con pendientes.
- `AppShell`: navegacion interna cuando se implemente el sidebar.

La primera implementacion puede vivir en `src/App.tsx` para moverse rapido, pero debe separarse en helpers puros cuando el archivo empiece a crecer demasiado.

## Pruebas

Pruebas unitarias esperadas:

- METs menor de 4 genera pendiente de cardiologia.
- SpO2 baja con comorbilidad pulmonar genera pendiente de neumologia.
- Diabetes con glucemia elevada genera pendiente de endocrinologia/diabetologia.
- Una evaluacion sin aptos requeridos no aparece en Pendientes.
- Una evaluacion con laboratorio faltante o alterado aparece en Pendientes.
- Evaluaciones antiguas sin `clearances` cargan sin error.

Pruebas de interfaz:

- El usuario puede registrar FEVI en cardiologia.
- El usuario puede marcar un apto como recibido.
- La pestaña Pendientes permite filtrar por categoria y abrir la evaluacion.

## Fuera de Alcance Por Ahora

- Autorizacion definitiva automatica de cirugia.
- Base de datos remota multiusuario.
- Integracion directa con laboratorio, cardiologia o historia clinica institucional.
- OCR o lectura automatica de PDFs escaneados.

## Criterio de Exito

El modulo es exitoso si un anestesiologo puede abrir la app, evaluar un paciente, ver automaticamente que falta, registrar aptos por otros departamentos y encontrar rapidamente en una pestaña todos los pacientes pendientes antes de que vuelvan a consulta o sean programados para cirugia.
