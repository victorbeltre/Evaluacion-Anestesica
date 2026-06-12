import type { StoredEvaluation } from './types';

export type GoogleSheetsConfig = {
  endpointUrl: string;
  accessToken: string;
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

export function loadGoogleSheetsConfig(): GoogleSheetsConfig {
  try {
    const stored = window.localStorage.getItem(GOOGLE_SHEETS_CONFIG_KEY);
    const parsed = stored ? JSON.parse(stored) as Partial<GoogleSheetsConfig> : {};
    return {
      accessToken: parsed.accessToken || '',
      endpointUrl: parsed.endpointUrl || '',
    };
  } catch {
    return { accessToken: '', endpointUrl: '' };
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

  const response = await fetch(config.endpointUrl.trim(), {
    body: JSON.stringify({
      action,
      payload,
      token: config.accessToken.trim(),
    }),
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
  const result = await requestGoogleSheets(config, 'list');
  return result.records || [];
}

export async function upsertGoogleSheetRecord(
  config: GoogleSheetsConfig,
  recordKey: string,
  record: StoredEvaluation,
) {
  await requestGoogleSheets(config, 'upsert', {
    evaluationDate: (record.savedAt || new Date().toISOString()).slice(0, 10),
    hcn: record.hcn || '',
    patientName: record.patientName || '',
    payload: record,
    recordKey,
    savedAt: record.savedAt || new Date().toISOString(),
  });
}
