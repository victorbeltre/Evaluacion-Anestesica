import type { StoredEvaluation } from './types';

export type GoogleSheetsConfig = {
  endpointUrl: string;
  accessToken: string;
};

export type GoogleSheetsPdfDocument = {
  fileName: string;
  pdfHtml: string;
};

type GoogleSheetsResponse = {
  error?: string;
  ok?: boolean;
  records?: Array<{
    createdAt?: string;
    hcn?: string;
    patientName?: string;
    payload?: Partial<StoredEvaluation>;
    recordKey: string;
    updatedAt?: string;
  }>;
};

const GOOGLE_SHEETS_CONFIG_KEY = 'preanes-consulta-google-sheets-config';
export const DEFAULT_GOOGLE_SHEETS_ENDPOINT =
  'https://script.google.com/macros/s/AKfycbzB3UYFOfXknCGagAbsqS20zNt8hHADQHwLCf5P9R-SCTpsIxCLm7zUseMsB8IKTa9lLA/exec';
export const DEFAULT_GOOGLE_SHEETS_ACCESS_TOKEN = import.meta.env.VITE_GOOGLE_SHEETS_ACCESS_TOKEN?.trim() || '';

export function loadGoogleSheetsConfig(): GoogleSheetsConfig {
  try {
    const stored = window.localStorage.getItem(GOOGLE_SHEETS_CONFIG_KEY);
    const parsed = stored ? JSON.parse(stored) as Partial<GoogleSheetsConfig> : {};
    return {
      accessToken: parsed.accessToken || DEFAULT_GOOGLE_SHEETS_ACCESS_TOKEN,
      endpointUrl: parsed.endpointUrl || DEFAULT_GOOGLE_SHEETS_ENDPOINT,
    };
  } catch {
    return {
      accessToken: DEFAULT_GOOGLE_SHEETS_ACCESS_TOKEN,
      endpointUrl: DEFAULT_GOOGLE_SHEETS_ENDPOINT,
    };
  }
}

export function saveGoogleSheetsConfig(config: GoogleSheetsConfig) {
  window.localStorage.setItem(GOOGLE_SHEETS_CONFIG_KEY, JSON.stringify(config));
}

export function clearGoogleSheetsConfig() {
  window.localStorage.removeItem(GOOGLE_SHEETS_CONFIG_KEY);
}

export function isGoogleSheetsConfigured(config: GoogleSheetsConfig) {
  return Boolean(config.endpointUrl.trim() && config.accessToken.trim());
}

async function requestGoogleSheets<TPayload>(
  config: GoogleSheetsConfig,
  action: 'list' | 'upsert',
  payload?: TPayload,
) {
  if (!isGoogleSheetsConfigured(config)) {
    throw new Error('Configura la URL de Apps Script y el token de acceso');
  }

  const body = JSON.stringify({
    action,
    payload,
    token: config.accessToken.trim(),
  });

  if (action === 'upsert') {
    await fetch(config.endpointUrl.trim(), {
      body,
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      method: 'POST',
      mode: 'no-cors',
    });
    return { ok: true } satisfies GoogleSheetsResponse;
  }

  const response = await fetch(config.endpointUrl.trim(), {
    body,
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    method: 'POST',
  });

  const result = await response.json() as GoogleSheetsResponse;
  if (!response.ok || result.error) {
    throw new Error(result.error || 'Google Sheets no respondio correctamente');
  }

  return result;
}

export async function fetchGoogleSheetRecords(config: GoogleSheetsConfig) {
  try {
    const result = await requestGoogleSheets(config, 'list');
    return result.records || [];
  } catch {
    return [];
  }
}

export async function upsertGoogleSheetRecord(
  config: GoogleSheetsConfig,
  recordKey: string,
  record: StoredEvaluation,
  pdfDocument?: GoogleSheetsPdfDocument,
) {
  await requestGoogleSheets(config, 'upsert', {
    evaluationDate: (record.savedAt || new Date().toISOString()).slice(0, 10),
    hcn: record.hcn || '',
    patientName: record.patientName || '',
    pdfFileName: pdfDocument?.fileName || '',
    pdfHtml: pdfDocument?.pdfHtml || '',
    payload: record,
    recordKey,
    savedAt: record.savedAt || new Date().toISOString(),
  });
}
