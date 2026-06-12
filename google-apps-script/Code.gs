const SHEET_NAME = 'Evaluaciones';
const TOKEN_PROPERTY = 'ANESTHESIA_SYNC_TOKEN';

const HEADERS = [
  'record_key',
  'patient_name',
  'hcn',
  'evaluation_date',
  'saved_at',
  'updated_at',
  'payload_json',
];

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
}

function setAccessToken() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt('Token privado', 'Escribe un token largo y dificil de adivinar.', ui.ButtonSet.OK_CANCEL);
  if (response.getSelectedButton() !== ui.Button.OK) return;
  PropertiesService.getScriptProperties().setProperty(TOKEN_PROPERTY, response.getResponseText().trim());
  ui.alert('Token guardado.');
}

function requireValidToken_(token) {
  const expected = PropertiesService.getScriptProperties().getProperty(TOKEN_PROPERTY);
  if (!expected) throw new Error('Configura el token en Apps Script primero');
  if (!token || token !== expected) throw new Error('Token invalido');
}

function getSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);
  ensureHeaders_(sheet);
  return sheet;
}

function ensureHeaders_(sheet) {
  const existing = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const needsHeaders = HEADERS.some((header, index) => existing[index] !== header);
  if (needsHeaders) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }
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
      payload: parsePayload_(row[6]),
      recordKey: row[0],
      updatedAt: row[5] || row[4] || '',
    }));
}

function upsertRecord_(record) {
  if (!record.recordKey) throw new Error('Falta recordKey');

  const sheet = getSheet_();
  const now = new Date().toISOString();
  const rowValues = [
    record.recordKey,
    record.patientName || '',
    record.hcn || '',
    record.evaluationDate || '',
    record.savedAt || now,
    now,
    JSON.stringify(record.payload || {}),
  ];

  const rowIndex = findRecordRow_(sheet, record.recordKey);
  if (rowIndex) {
    sheet.getRange(rowIndex, 1, 1, HEADERS.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
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

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
