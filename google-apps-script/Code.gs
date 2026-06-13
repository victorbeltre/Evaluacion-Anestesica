const SHEET_NAME = 'Evaluaciones';
const TOKEN_PROPERTY = 'ANESTHESIA_SYNC_TOKEN';
const PAYLOAD_CHUNK_SIZE = 45000;
const PAYLOAD_CHUNK_COUNT = 12;

const VISIBLE_HEADERS = [
  'record_key',
  'patient_name',
  'hcn',
  'evaluation_date',
  'saved_at',
  'updated_at',
  'age',
  'biological_sex',
  'procedure',
  'surgeon',
  'urgency',
  'asa',
  'mets',
  'weight_kg',
  'height_cm',
  'bmi',
  'blood_type',
  'comorbidities',
  'allergies',
  'medications',
  'anticoagulants',
  'hb',
  'hct',
  'platelets',
  'wbc',
  'neutrophils',
  'creatinine',
  'potassium',
  'sodium',
  'pt',
  'inr',
  'aptt',
  'fibrinogen',
  'anti_xa',
  'vdrl',
  'hbsag',
  'anti_hbs',
  'anti_hcv',
  'hiv',
  'cardiology_status',
  'ejection_fraction',
  'pulmonology_status',
  'endocrinology_status',
  'findings',
  'recommendations',
];

const PAYLOAD_HEADERS = Array.from({ length: PAYLOAD_CHUNK_COUNT }, (_, index) => `payload_json_${index + 1}`);
const HEADERS = VISIBLE_HEADERS.concat(PAYLOAD_HEADERS);

function doPost(event) {
  try {
    const body = JSON.parse(event.postData && event.postData.contents ? event.postData.contents : '{}');
    requireValidToken_(body.token);

    if (body.action === 'list') {
      return json_({ ok: true, records: listRecords_() });
    }

    if (body.action === 'upsert') {
      upsertRecord_(body.payload || {});
      return json_({ ok: true });
    }

    return json_({ error: 'Accion no soportada' }, 400);
  } catch (error) {
    return json_({ error: error.message || 'Error desconocido' }, 400);
  }
}

function doGet() {
  return json_({ ok: true, service: 'HOSGEDOPOL anesthesia Google Sheets sync' });
}

function setup() {
  const sheet = getSheet_();
  ensureHeaders_(sheet);
  sheet.autoResizeColumns(1, Math.min(HEADERS.length, 45));
}

function setAccessToken() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt('Token privado', 'Escribe un token largo y dificil de adivinar.', ui.ButtonSet.OK_CANCEL);
  if (response.getSelectedButton() !== ui.Button.OK) return;
  PropertiesService.getScriptProperties().setProperty(TOKEN_PROPERTY, response.getResponseText().trim());
  ui.alert('Token guardado.');
}

function debugWriteTest() {
  const now = new Date().toISOString();
  upsertRecord_({
    evaluationDate: now.slice(0, 10),
    hcn: 'PRUEBA',
    patientName: 'Paciente de prueba',
    payload: {
      age: '40',
      biologicalSex: 'No especificado',
      procedure: 'Prueba de conexion',
      asa: 'II',
      mets: '4-10',
      labs: { hb: '13', platelets: '250', aboGroup: 'O', rhFactor: 'Positivo' },
      findings: [{ title: 'Prueba', detail: 'Fila creada desde Apps Script.' }],
      recommendations: ['Si ve esta fila, la hoja esta recibiendo datos.'],
    },
    recordKey: 'PRUEBA_APPS_SCRIPT',
    savedAt: now,
  });
}

function requireValidToken_(token) {
  const expected = PropertiesService.getScriptProperties().getProperty(TOKEN_PROPERTY);
  if (!expected) throw new Error('Configura el token en Apps Script primero');
  if (!token || token !== expected) throw new Error('Token invalido');
}

function getSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error('Abre Apps Script desde la hoja de calculo de anestesia');
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);
  ensureHeaders_(sheet);
  return sheet;
}

function ensureHeaders_(sheet) {
  const existing = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const needsHeaders = HEADERS.some((header, index) => existing[index] !== header);
  if (!needsHeaders) return;

  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
}

function listRecords_() {
  const sheet = getSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  return sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues()
    .filter((row) => row[0])
    .map((row) => ({
      createdAt: row[4] || row[5] || '',
      hcn: row[2] || '',
      patientName: row[1] || '',
      payload: parsePayloadFromRow_(row),
      recordKey: row[0],
      updatedAt: row[5] || row[4] || '',
    }));
}

function upsertRecord_(record) {
  if (!record.recordKey) throw new Error('Falta recordKey');

  const sheet = getSheet_();
  const payload = record.payload || {};
  const now = new Date().toISOString();
  const payloadJson = JSON.stringify(payload);
  const chunks = splitPayload_(payloadJson);
  const rowValues = [
    record.recordKey,
    record.patientName || payload.patientName || '',
    record.hcn || payload.hcn || '',
    record.evaluationDate || valueDate_(payload.savedAt) || '',
    record.savedAt || payload.savedAt || now,
    now,
    payload.age || '',
    payload.biologicalSex || '',
    payload.procedure || '',
    payload.surgeon || '',
    payload.urgency || '',
    formatAsa_(payload),
    payload.mets || '',
    payload.weightKg || '',
    payload.heightCm || '',
    payload.bmi || '',
    payload.bloodType || bloodType_(payload),
    join_(payload.comorbiditiesAll || payload.comorbidities),
    payload.allergies || '',
    payload.meds || '',
    payload.anticoagulants || '',
    lab_(payload, 'hb'),
    lab_(payload, 'hct'),
    lab_(payload, 'platelets'),
    lab_(payload, 'wbc'),
    lab_(payload, 'neutrophils'),
    lab_(payload, 'creatinine'),
    lab_(payload, 'potassium'),
    lab_(payload, 'sodium'),
    lab_(payload, 'pt'),
    lab_(payload, 'inr'),
    lab_(payload, 'aptt'),
    lab_(payload, 'fibrinogen'),
    lab_(payload, 'antiXa'),
    lab_(payload, 'vdrl'),
    lab_(payload, 'hbsAg'),
    lab_(payload, 'antiHbs'),
    lab_(payload, 'antiHcv'),
    lab_(payload, 'hiv'),
    clearance_(payload, 'cardiology', 'status'),
    clearance_(payload, 'cardiology', 'ejectionFraction'),
    clearance_(payload, 'pulmonology', 'status'),
    clearance_(payload, 'endocrinology', 'status'),
    findings_(payload.findings),
    join_(payload.recommendations),
  ].concat(chunks);

  const rowIndex = findRecordRow_(sheet, record.recordKey);
  if (rowIndex) {
    sheet.getRange(rowIndex, 1, 1, HEADERS.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
}

function splitPayload_(payloadJson) {
  const maxLength = PAYLOAD_CHUNK_SIZE * PAYLOAD_CHUNK_COUNT;
  if (payloadJson.length > maxLength) {
    throw new Error(`Evaluacion demasiado grande para sincronizar (${payloadJson.length} caracteres)`);
  }

  return PAYLOAD_HEADERS.map((_, index) => (
    payloadJson.slice(index * PAYLOAD_CHUNK_SIZE, (index + 1) * PAYLOAD_CHUNK_SIZE)
  ));
}

function findRecordRow_(sheet, recordKey) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  const keys = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  const index = keys.findIndex((row) => row[0] === recordKey);
  return index === -1 ? 0 : index + 2;
}

function parsePayload_(value) {
  try {
    return value ? JSON.parse(value) : {};
  } catch (error) {
    return {};
  }
}

function parsePayloadFromRow_(row) {
  const chunkedPayload = row.slice(VISIBLE_HEADERS.length, HEADERS.length).join('');
  if (chunkedPayload) return parsePayload_(chunkedPayload);

  const legacyPayload = row[6];
  if (typeof legacyPayload === 'string' && legacyPayload.trim().startsWith('{')) {
    return parsePayload_(legacyPayload);
  }

  return {};
}

function lab_(payload, key) {
  return payload.labs && payload.labs[key] ? payload.labs[key] : '';
}

function clearance_(payload, department, key) {
  return payload.clearances && payload.clearances[department] ? payload.clearances[department][key] || '' : '';
}

function bloodType_(payload) {
  const group = lab_(payload, 'aboGroup');
  const rh = lab_(payload, 'rhFactor');
  if (!group || !rh) return '';
  return `${group} ${rh === 'Positivo' ? 'Rh+' : 'Rh-'}`;
}

function formatAsa_(payload) {
  if (!payload.asa) return '';
  return `ASA ${payload.asa}${payload.emergencyAsa ? 'E' : ''}`;
}

function findings_(findings) {
  if (!Array.isArray(findings)) return '';
  return findings.map((finding) => `${finding.title || ''}: ${finding.detail || ''}`).join(' | ');
}

function join_(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join(', ');
  return value || '';
}

function valueDate_(value) {
  return value ? String(value).slice(0, 10) : '';
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
