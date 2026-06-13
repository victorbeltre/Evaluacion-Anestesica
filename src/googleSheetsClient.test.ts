import { beforeEach, describe, expect, it, vi } from 'vitest';
import { upsertGoogleSheetRecord, type GoogleSheetsConfig } from './googleSheetsClient';
import type { StoredEvaluation } from './types';

describe('googleSheetsClient', () => {
  const config: GoogleSheetsConfig = {
    accessToken: 'private-token',
    endpointUrl: 'https://script.google.com/macros/s/example/exec',
  };

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({}) as unknown as typeof fetch);
  });

  it('sends printable PDF metadata when saving a record to Google Sheets', async () => {
    const record: StoredEvaluation = {
      hcn: 'HC-100',
      patientName: 'Ana Perez',
      savedAt: '2026-06-13T20:00:00.000Z',
    };

    await upsertGoogleSheetRecord(config, 'Ana_Perez_HCN-HC-100', record, {
      fileName: 'Ana_Perez_HCN-HC-100.pdf',
      pdfHtml: '<html><body>Evaluacion</body></html>',
    });

    const [, request] = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse(request?.body as string);

    expect(body.payload.pdfFileName).toBe('Ana_Perez_HCN-HC-100.pdf');
    expect(body.payload.pdfHtml).toContain('Evaluacion');
  });
});
