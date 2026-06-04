# Pendientes y Aptos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add clinical pending follow-up, interdepartmental clearances, and intelligent clearance alerts to the HOSGEDOPOL preanesthetic app.

**Architecture:** Keep the current React + Vite app and localStorage persistence. Add typed clearance/pending data to `FormState`, pure helper functions for pending-rule calculation, an in-form clearances panel, and an internal `#pendientes` view that reuses stored evaluations.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library, localStorage.

---

### Task 1: Add Failing Tests For Pending Rules And Views

**Files:**
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Write the failing tests**

Add tests that describe the new behavior:

```tsx
it('suggests cardiology clearance when METs are below 4 and stores FEVI', () => {
  render(<App />);
  fireEvent.change(screen.getByLabelText('METs'), { target: { value: '<4' } });
  expect(screen.getByText('Aptos / Interconsultas')).toBeInTheDocument();
  expect(screen.getByText(/Cardiologia sugerida/)).toBeInTheDocument();
  fireEvent.click(screen.getByLabelText('Cardiologia requerida'));
  fireEvent.change(screen.getByLabelText('FEVI %'), { target: { value: '45' } });
  expect(screen.getByDisplayValue('45')).toBeInTheDocument();
});

it('suggests pulmonology clearance when low SpO2 is captured', () => {
  render(<App />);
  fireEvent.change(screen.getByLabelText('SpO2 %'), { target: { value: '91' } });
  expect(screen.getByText(/Neumologia sugerida/)).toBeInTheDocument();
});

it('suggests endocrinology clearance for diabetes with high glucose', () => {
  render(<App />);
  fireEvent.click(screen.getByLabelText('Diabetes'));
  fireEvent.change(screen.getByLabelText('Glucemia'), { target: { value: '230' } });
  expect(screen.getByText(/Endocrinologia sugerida/)).toBeInTheDocument();
});

it('shows patients with unresolved pending items in the Pendientes view', () => {
  window.localStorage.setItem(
    'preanes-consulta-v2-records',
    JSON.stringify({
      'Carlos_Perez_HCN-123': {
        ...baseRecord,
        patientName: 'Carlos Perez',
        hcn: '123',
        mets: '<4',
        savedAt: '2026-06-04T10:00:00.000Z',
      },
    }),
  );
  window.history.replaceState(null, '', '/#pendientes');
  render(<App />);
  expect(screen.getByText('Pendientes')).toBeInTheDocument();
  expect(screen.getByText('Carlos Perez')).toBeInTheDocument();
  expect(screen.getByText(/Cardiologia/)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`

Expected: FAIL because `Aptos / Interconsultas`, `#pendientes`, and clearance fields do not exist yet.

### Task 2: Add Clearance And Pending Data Model

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Implement types and defaults**

Add:

```ts
type ClearanceStatus = 'No requerido' | 'Pendiente' | 'Solicitado' | 'Recibido';
type ClearanceDepartment = 'cardiology' | 'pulmonology' | 'endocrinology';

type ClearanceState = {
  required: boolean;
  status: ClearanceStatus;
  date: string;
  ejectionFraction?: string;
  echoSummary?: string;
  ekgSummary?: string;
  riskSummary?: string;
  baselineSpo2?: string;
  spirometrySummary?: string;
  diagnosisSummary?: string;
  hba1c?: string;
  glucosePlan?: string;
  thyroidSummary?: string;
  recommendations: string;
};

type PendingItem = {
  category: 'Laboratorio' | 'Sangre' | 'Cardiologia' | 'Neumologia' | 'Endocrino' | 'Manual';
  priority: 'critica' | 'importante' | 'rutinaria';
  title: string;
  detail: string;
  source: 'automatico' | 'manual';
};
```

Extend `FormState` with `clearances` and `manualPendingItems`.

- [ ] **Step 2: Add safe loading**

Ensure `loadStoredForm()` merges old records with clearance defaults so old evaluations do not crash.

- [ ] **Step 3: Run tests**

Run: `npm test`

Expected: still FAIL because UI/rules are not implemented yet.

### Task 3: Implement Pure Pending Rules

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add helper functions**

Add pure helpers:

```ts
function getClearanceSuggestions(form: FormState): Record<ClearanceDepartment, string[]> { ... }
function getPendingItems(form: FormState, findings: Finding[]): PendingItem[] { ... }
function hasActivePendingItems(form: FormState): boolean { ... }
```

Rules:

- Cardiology if METs `<4`, ASA III/IV with cardiovascular text, severe BP, cardiac terms in notes/manual comorbidities, or required cardiology status not received.
- Pulmonology if SpO2 `<94`, pulmonary comorbidity, apnea del sueño, respiratory terms in notes/manual comorbidities, or required pulmonology status not received.
- Endocrinology if diabetes and glucose > 180, endocrine/thyroid text, or required endocrinology status not received.
- Lab/blood pending from existing `getPendingAnalytics`, `getPendingSerologies`, `getAlteredAnalytics`, and blood typing fields.
- Manual pending from `manualPendingItems` line breaks.

- [ ] **Step 2: Run tests**

Run: `npm test`

Expected: tests for suggestions may still FAIL until UI renders these helpers.

### Task 4: Add Clearances Panel To Evaluation

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Render panel**

Add a panel after “Coagulacion y Sangrado” titled `Aptos / Interconsultas`.

Include:

- Cardiology card with `Cardiologia requerida`, status, date, `FEVI %`, eco, EKG, risk, recommendations.
- Pulmonology card with required/status/date, baseline SpO2, spirometry, diagnosis, recommendations.
- Endocrinology card with required/status/date, HbA1c, glucose plan, thyroid summary, recommendations.
- Manual pending textarea.

- [ ] **Step 2: Show suggestion badges**

Render text such as `Cardiologia sugerida`, `Neumologia sugerida`, and `Endocrinologia sugerida` when helper rules trigger.

- [ ] **Step 3: Run tests**

Run: `npm test`

Expected: the first three new tests PASS.

### Task 5: Add Pendientes Internal View

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Add navigation**

Add internal navigation buttons for `Dashboard`, `Nueva evaluacion`, `Pacientes`, and `Pendientes`. Do not use `window.open` for these internal modules.

- [ ] **Step 2: Add `PendingView`**

Read stored records, compute pending items per record, filter by name, HCN, category and priority, and render patients with unresolved pending items.

- [ ] **Step 3: Open evaluation internally**

When “Abrir evaluacion” is clicked, set the current form in `localStorage` and route to the main evaluation view in the same browser tab.

- [ ] **Step 4: Run tests**

Run: `npm test`

Expected: all new view tests PASS.

### Task 6: Integrate Recommendations And Print/Export

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add pending and clearance recommendations**

Include aptos pending and department recommendations in `getRecommendations`.

- [ ] **Step 2: Add print rows**

Include cardiology FEVI/status, pulmonology status, endocrino status and active pending items in print view.

- [ ] **Step 3: Run tests**

Run: `npm test`

Expected: all tests PASS.

### Task 7: Browser QA, Build, Commit

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Modify: `src/App.test.tsx`
- Create: `docs/superpowers/plans/2026-06-04-pendientes-aptos-implementation.md`

- [ ] **Step 1: Run full verification**

Run:

```powershell
npm test
npm run build
```

Expected: both exit 0.

- [ ] **Step 2: Browser checks**

Use Browser/IAB to verify:

- App loads.
- `Aptos / Interconsultas` appears.
- METs `<4` shows cardiology suggestion.
- `#pendientes` shows patients with pending items.
- No relevant console errors.

- [ ] **Step 3: Commit**

Run:

```powershell
git add src/App.tsx src/styles.css src/App.test.tsx docs/superpowers/plans/2026-06-04-pendientes-aptos-implementation.md
git commit -m "feat: add pending clearances module"
```
