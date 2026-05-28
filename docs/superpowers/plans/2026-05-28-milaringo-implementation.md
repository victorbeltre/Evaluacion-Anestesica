# Milaringo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished React + Vite MVP of Milaringo, an original advanced anesthesiology learning app with gamified path progression, adaptive practice state, and representative exercise types.

**Architecture:** Create a new Vite React app in the repository root. Keep domain data in `src/data`, progress logic in `src/state`, presentational shell/path components in `src/components`, and exercise renderers in `src/components/exercises`. Use local React state plus `localStorage` persistence, no backend.

**Tech Stack:** React 19, Vite, TypeScript, CSS modules/global CSS, Vitest, Testing Library, lucide-react.

---

## File Structure

- Create `package.json`, `index.html`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`: Vite/TypeScript project setup.
- Create `src/main.tsx`: React entrypoint.
- Create `src/App.tsx`: top-level composition and selected lesson flow.
- Create `src/styles.css`: app-wide tokens, layout, responsive behavior, component styling.
- Create `src/data/curriculum.ts`: original high-level Miller-inspired domains, nodes, and sample exercises.
- Create `src/state/progress.ts`: progress state types, persistence helpers, and reducer-like update helpers.
- Create `src/components/layout/AppShell.tsx`: header, domain sidebar, content slot, practice rail layout.
- Create `src/components/layout/PracticeRail.tsx`: XP, streak, hearts, mastery, due review, weak areas, quick case.
- Create `src/components/path/LearningPath.tsx`: central unlockable node path.
- Create `src/components/exercises/ExercisePanel.tsx`: exercise router and lesson completion controls.
- Create `src/components/exercises/MultipleChoice.tsx`: board-style MCQ.
- Create `src/components/exercises/Matching.tsx`: matching exercise.
- Create `src/components/exercises/Ordering.tsx`: ordering exercise.
- Create `src/components/exercises/Recall.tsx`: short recall exercise.
- Create `src/components/exercises/Flashcard.tsx`: known/needs-review flashcard.
- Create `src/components/exercises/ClinicalCase.tsx`: mini case with sequential decision.
- Create `src/state/progress.test.ts`: unit tests for XP, hearts, mastery, persistence fallback.
- Create `src/components/exercises/MultipleChoice.test.tsx`: UI test for answer checking.

## Task 1: Scaffold Vite React Project

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`

- [ ] **Step 1: Add project manifest**

Create `package.json`:

```json
{
  "name": "milaringo",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "tsc -b && vite build",
    "preview": "vite preview --host 127.0.0.1",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@vitejs/plugin-react": "latest",
    "lucide-react": "latest",
    "vite": "latest",
    "typescript": "latest",
    "react": "latest",
    "react-dom": "latest"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "latest",
    "@testing-library/react": "latest",
    "@testing-library/user-event": "latest",
    "jsdom": "latest",
    "vitest": "latest"
  }
}
```

- [ ] **Step 2: Add Vite HTML entry**

Create `index.html`:

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Milaringo</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 3: Add Vite config**

Create `vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
});
```

- [ ] **Step 4: Add TypeScript config**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Create `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 5: Add minimal React entry**

Create `src/main.tsx`:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

Create `src/App.tsx`:

```tsx
export default function App() {
  return (
    <main className="boot-screen">
      <h1>Milaringo</h1>
      <p>Entrenamiento avanzado en anestesiologia.</p>
    </main>
  );
}
```

Create `src/styles.css`:

```css
:root {
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #172126;
  background: #f7fbfb;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}

button,
input {
  font: inherit;
}

.boot-screen {
  min-height: 100vh;
  display: grid;
  place-content: center;
  gap: 12px;
  text-align: center;
}
```

- [ ] **Step 6: Install dependencies**

Run: `npm install`

Expected: `package-lock.json` is created and installation finishes without errors.

- [ ] **Step 7: Verify scaffold build**

Run: `npm run build`

Expected: TypeScript and Vite complete successfully and create `dist/`.

- [ ] **Step 8: Commit scaffold**

```bash
git add package.json package-lock.json index.html vite.config.ts tsconfig.json tsconfig.node.json src/main.tsx src/App.tsx src/styles.css
git commit -m "feat: scaffold Milaringo React app"
```

## Task 2: Add Curriculum Data

**Files:**
- Create: `src/data/curriculum.ts`

- [ ] **Step 1: Create curriculum types and original sample data**

Create `src/data/curriculum.ts`:

```ts
export type ExerciseKind = 'mcq' | 'matching' | 'ordering' | 'recall' | 'flashcard' | 'case';

export type Exercise =
  | {
      id: string;
      kind: 'mcq';
      prompt: string;
      options: string[];
      answer: string;
      explanation: string;
    }
  | {
      id: string;
      kind: 'matching';
      prompt: string;
      pairs: Array<{ left: string; right: string }>;
      explanation: string;
    }
  | {
      id: string;
      kind: 'ordering';
      prompt: string;
      steps: string[];
      explanation: string;
    }
  | {
      id: string;
      kind: 'recall';
      prompt: string;
      accepted: string[];
      explanation: string;
    }
  | {
      id: string;
      kind: 'flashcard';
      front: string;
      back: string;
    }
  | {
      id: string;
      kind: 'case';
      title: string;
      stem: string;
      decisionPrompt: string;
      options: Array<{ label: string; feedback: string; safe: boolean }>;
    };

export type LessonNode = {
  id: string;
  title: string;
  domainId: string;
  difficulty: 'R3' | 'R4' | 'Fellow' | 'Attending';
  estimatedMinutes: number;
  unlockedAfter?: string;
  summary: string;
  exercises: Exercise[];
};

export type CurriculumDomain = {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  nodes: LessonNode[];
};

export const curriculum: CurriculumDomain[] = [
  {
    id: 'foundations',
    title: 'Fundamentos, seguridad y medicina perioperatoria',
    shortTitle: 'Fundamentos',
    description: 'Calidad, seguridad, etica, simulacion, informatica y rol perioperatorio moderno.',
    nodes: [
      {
        id: 'safety-briefing',
        title: 'Seguridad y brief perioperatorio',
        domainId: 'foundations',
        difficulty: 'R3',
        estimatedMinutes: 7,
        summary: 'Practica decisiones de seguridad, comunicacion y anticipacion de riesgo antes de induccion.',
        exercises: [
          {
            id: 'safety-mcq',
            kind: 'mcq',
            prompt: 'En un paciente ASA IV para cirugia urgente, cual intervencion reduce mejor el riesgo de error de equipo antes de induccion?',
            options: ['Aumentar el flujo de oxigeno', 'Brief estructurado con roles, plan A/B y sangre disponible', 'Evitar premedicacion', 'Registrar signos vitales cada 10 minutos'],
            answer: 'Brief estructurado con roles, plan A/B y sangre disponible',
            explanation: 'El brief explicita prioridades, recursos, planes alternos y responsabilidades antes de un periodo de alta carga cognitiva.',
          },
          {
            id: 'safety-card',
            kind: 'flashcard',
            front: 'Objetivo de un debrief anestesico breve',
            back: 'Identificar que funciono, que debe cambiarse y que accion concreta queda asignada para el siguiente caso.',
          },
        ],
      },
    ],
  },
  {
    id: 'physiology',
    title: 'Fisiologia anestesica aplicada',
    shortTitle: 'Fisiologia',
    description: 'Conciencia, sueno, cerebro, pulmon, corazon, rinon, higado y farmacologia fisiologica.',
    nodes: [
      {
        id: 'respiratory-physiology',
        title: 'Fisiologia respiratoria bajo anestesia',
        domainId: 'physiology',
        difficulty: 'R4',
        estimatedMinutes: 9,
        summary: 'Relaciona anestesia general con atelectasia, V/Q, compliance y oxigenacion.',
        exercises: [
          {
            id: 'resp-mcq',
            kind: 'mcq',
            prompt: 'Durante anestesia general, la disminucion de FRC aumenta principalmente el riesgo de:',
            options: ['Hipercalcemia', 'Atelectasia y shunt', 'Alcalosis metabolica', 'Bloqueo AV completo'],
            answer: 'Atelectasia y shunt',
            explanation: 'La reduccion de FRC favorece cierre de vias aereas dependientes, atelectasia y aumento de shunt intrapulmonar.',
          },
          {
            id: 'resp-order',
            kind: 'ordering',
            prompt: 'Ordena una respuesta inicial razonable ante desaturacion tras induccion.',
            steps: ['Confirmar pulso/onda y FiO2', 'Ventilar manualmente y evaluar compliance', 'Auscultar y revisar posicion del tubo', 'Aplicar reclutamiento/PEEP si corresponde'],
            explanation: 'Primero se confirma que la lectura sea real y se asegura oxigenacion/ventilacion, luego se busca causa mecanica o fisiologica.',
          },
        ],
      },
    ],
  },
  {
    id: 'pharmacology',
    title: 'Farmacologia y sistemas de administracion',
    shortTitle: 'Farmacologia',
    description: 'Anestesicos inhalados e intravenosos, opioides, bloqueantes neuromusculares y anestesicos locales.',
    nodes: [
      {
        id: 'context-sensitive-half-time',
        title: 'Farmacocinetica contextual',
        domainId: 'pharmacology',
        difficulty: 'Fellow',
        estimatedMinutes: 10,
        summary: 'Diferencia vida media terminal, efecto clinico y tiempo medio sensible al contexto.',
        exercises: [
          {
            id: 'pk-recall',
            kind: 'recall',
            prompt: 'Escribe el concepto que describe el tiempo para que la concentracion plasmatica caiga 50% tras detener una infusion, dependiente de la duracion de infusion.',
            accepted: ['tiempo medio sensible al contexto', 'vida media sensible al contexto'],
            explanation: 'El tiempo medio sensible al contexto cambia con la duracion de infusion y redistribucion, no equivale a vida media terminal.',
          },
          {
            id: 'drug-match',
            kind: 'matching',
            prompt: 'Empareja farmaco con asociacion clinica dominante.',
            pairs: [
              { left: 'Remifentanilo', right: 'Metabolismo por esterasas' },
              { left: 'Succinilcolina', right: 'Fasciculaciones y hiperpotasemia en riesgo' },
              { left: 'Bupivacaina', right: 'Mayor preocupacion por cardiotoxicidad' },
            ],
            explanation: 'Estas asociaciones orientan eleccion y vigilancia, pero no sustituyen dosis ni protocolos locales.',
          },
        ],
      },
    ],
  },
  {
    id: 'airway-monitoring',
    title: 'Monitoreo, via aerea y manejo intraoperatorio',
    shortTitle: 'Via aerea',
    description: 'Evaluacion preoperatoria, monitores, POCUS, via aerea, regional, fluidos, acido-base y transfusion.',
    nodes: [
      {
        id: 'cannot-intubate-oxygenate',
        title: 'Via aerea no intubable/no oxigenable',
        domainId: 'airway-monitoring',
        difficulty: 'Attending',
        estimatedMinutes: 8,
        summary: 'Practica escalamiento temprano, llamada de ayuda y acceso frontal al cuello.',
        exercises: [
          {
            id: 'cio-case',
            kind: 'case',
            title: 'Desaturacion rapida tras induccion',
            stem: 'Paciente con obesidad y masa cervical. Dos intentos de laringoscopia fallan; ventilacion con mascarilla es inefectiva y SpO2 cae a 82%.',
            decisionPrompt: 'Cual es la siguiente accion mas segura?',
            options: [
              { label: 'Tercer intento con la misma hoja', feedback: 'Repetir la misma tecnica retrasa oxigenacion y aumenta trauma.', safe: false },
              { label: 'Declarar emergencia, pedir ayuda y avanzar a estrategia de oxigenacion de rescate', feedback: 'Correcto. La prioridad es oxigenacion y escalamiento, no persistir con intentos fallidos.', safe: true },
              { label: 'Esperar a que despierte sin oxigenacion efectiva', feedback: 'Puede ser inseguro si no hay oxigenacion adecuada durante la espera.', safe: false },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'subspecialties',
    title: 'Subespecialidades del adulto',
    shortTitle: 'Subespecialidades',
    description: 'Toracica, cardiaca, vascular, neuro, bariatrica, renal, trasplante, obstetricia, trauma, NORA y extremos.',
    nodes: [
      {
        id: 'aortic-stenosis-case',
        title: 'Estenosis aortica y cirugia abdominal',
        domainId: 'subspecialties',
        difficulty: 'Fellow',
        estimatedMinutes: 8,
        summary: 'Integra objetivos hemodinamicos, monitorizacion y plan de induccion.',
        exercises: [
          {
            id: 'as-mcq',
            kind: 'mcq',
            prompt: 'En estenosis aortica severa, el objetivo hemodinamico mas importante durante induccion es:',
            options: ['Taquicardia para mantener gasto cardiaco', 'Evitar hipotension y preservar ritmo sinusal', 'Vasodilatacion profunda', 'Hipovolemia permisiva'],
            answer: 'Evitar hipotension y preservar ritmo sinusal',
            explanation: 'La perfusion coronaria y el llenado diastolico son criticos; hipotension y taquicardia pueden descompensar al paciente.',
          },
        ],
      },
    ],
  },
  {
    id: 'critical-care',
    title: 'Postoperatorio, dolor, UCI y crisis',
    shortTitle: 'UCI y crisis',
    description: 'PACU, dolor agudo, delirium, cuidados intensivos, ECMO, RCP, quemaduras y emergencias.',
    nodes: [
      {
        id: 'malignant-hyperthermia',
        title: 'Hipertermia maligna',
        domainId: 'critical-care',
        difficulty: 'Attending',
        estimatedMinutes: 9,
        summary: 'Reconoce el patron temprano y prioriza manejo coordinado.',
        exercises: [
          {
            id: 'mh-order',
            kind: 'ordering',
            prompt: 'Ordena prioridades iniciales ante sospecha de hipertermia maligna.',
            steps: ['Suspender agentes desencadenantes', 'Pedir ayuda y dantroleno', 'Hiperventilar con oxigeno al 100%', 'Tratar hiperpotasemia/acidosis y enfriar si corresponde'],
            explanation: 'El manejo temprano combina eliminar desencadenante, dantroleno, soporte metabolico y enfriamiento segun temperatura.',
          },
        ],
      },
    ],
  },
];

export const allNodes = curriculum.flatMap((domain) => domain.nodes);
```

- [ ] **Step 2: Run TypeScript build**

Run: `npm run build`

Expected: PASS. `curriculum.ts` has no type errors.

- [ ] **Step 3: Commit curriculum**

```bash
git add src/data/curriculum.ts
git commit -m "feat: add Milaringo curriculum data"
```

## Task 3: Add Progress State And Tests

**Files:**
- Create: `src/state/progress.ts`
- Create: `src/state/progress.test.ts`
- Create: `src/test/setup.ts`

- [ ] **Step 1: Add test setup**

Create `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 2: Write progress tests first**

Create `src/state/progress.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { applyAnswerResult, createInitialProgress, loadProgress, saveProgress } from './progress';

describe('progress helpers', () => {
  it('awards XP and mastery for correct answers', () => {
    const progress = createInitialProgress(['safety-briefing']);
    const next = applyAnswerResult(progress, 'safety-briefing', true);

    expect(next.xp).toBe(20);
    expect(next.hearts).toBe(4);
    expect(next.nodeMastery['safety-briefing']).toBe(20);
    expect(next.reviewQueue).toHaveLength(0);
  });

  it('removes a heart and queues review for wrong answers', () => {
    const progress = createInitialProgress(['safety-briefing']);
    const next = applyAnswerResult(progress, 'safety-briefing', false);

    expect(next.xp).toBe(0);
    expect(next.hearts).toBe(3);
    expect(next.reviewQueue).toEqual(['safety-briefing']);
  });

  it('does not reduce hearts below zero', () => {
    const progress = { ...createInitialProgress(['safety-briefing']), hearts: 0 };
    const next = applyAnswerResult(progress, 'safety-briefing', false);

    expect(next.hearts).toBe(0);
  });

  it('falls back to initial progress when localStorage read fails', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    const loaded = loadProgress(['safety-briefing']);

    expect(loaded.unlockedNodeIds).toEqual(['safety-briefing']);
    getItem.mockRestore();
  });

  it('saves progress without throwing when localStorage write fails', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(() => saveProgress(createInitialProgress(['safety-briefing']))).not.toThrow();
    setItem.mockRestore();
  });
});
```

- [ ] **Step 3: Run tests and confirm failure**

Run: `npm test -- src/state/progress.test.ts`

Expected: FAIL because `src/state/progress.ts` does not exist.

- [ ] **Step 4: Implement progress helpers**

Create `src/state/progress.ts`:

```ts
const STORAGE_KEY = 'milaringo-progress-v1';

export type ProgressState = {
  xp: number;
  streak: number;
  hearts: number;
  completedNodeIds: string[];
  unlockedNodeIds: string[];
  reviewQueue: string[];
  nodeMastery: Record<string, number>;
};

export function createInitialProgress(initialUnlockedNodeIds: string[]): ProgressState {
  return {
    xp: 0,
    streak: 1,
    hearts: 4,
    completedNodeIds: [],
    unlockedNodeIds: initialUnlockedNodeIds,
    reviewQueue: [],
    nodeMastery: {},
  };
}

export function applyAnswerResult(progress: ProgressState, nodeId: string, correct: boolean): ProgressState {
  if (correct) {
    const currentMastery = progress.nodeMastery[nodeId] ?? 0;
    return {
      ...progress,
      xp: progress.xp + 20,
      nodeMastery: {
        ...progress.nodeMastery,
        [nodeId]: Math.min(100, currentMastery + 20),
      },
      reviewQueue: progress.reviewQueue.filter((id) => id !== nodeId),
    };
  }

  return {
    ...progress,
    hearts: Math.max(0, progress.hearts - 1),
    reviewQueue: progress.reviewQueue.includes(nodeId)
      ? progress.reviewQueue
      : [...progress.reviewQueue, nodeId],
  };
}

export function completeNode(progress: ProgressState, nodeId: string, nextNodeId?: string): ProgressState {
  const completedNodeIds = progress.completedNodeIds.includes(nodeId)
    ? progress.completedNodeIds
    : [...progress.completedNodeIds, nodeId];
  const unlockedNodeIds = nextNodeId && !progress.unlockedNodeIds.includes(nextNodeId)
    ? [...progress.unlockedNodeIds, nextNodeId]
    : progress.unlockedNodeIds;

  return {
    ...progress,
    xp: progress.xp + 50,
    completedNodeIds,
    unlockedNodeIds,
    nodeMastery: {
      ...progress.nodeMastery,
      [nodeId]: Math.max(progress.nodeMastery[nodeId] ?? 0, 80),
    },
  };
}

export function loadProgress(initialUnlockedNodeIds: string[]): ProgressState {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return createInitialProgress(initialUnlockedNodeIds);
    return JSON.parse(stored) as ProgressState;
  } catch {
    return createInitialProgress(initialUnlockedNodeIds);
  }
}

export function saveProgress(progress: ProgressState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Local persistence is a convenience only; in-memory progress still works.
  }
}
```

- [ ] **Step 5: Run progress tests**

Run: `npm test -- src/state/progress.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit progress state**

```bash
git add src/state/progress.ts src/state/progress.test.ts src/test/setup.ts vite.config.ts
git commit -m "feat: add progress state helpers"
```

## Task 4: Build App Shell, Path, And Practice Rail

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Create: `src/components/layout/AppShell.tsx`
- Create: `src/components/layout/PracticeRail.tsx`
- Create: `src/components/path/LearningPath.tsx`

- [ ] **Step 1: Add app shell**

Create `src/components/layout/AppShell.tsx`:

```tsx
import { BookOpen, Brain, ShieldCheck } from 'lucide-react';
import type { CurriculumDomain } from '../../data/curriculum';
import type { ProgressState } from '../../state/progress';
import PracticeRail from './PracticeRail';

type AppShellProps = {
  domains: CurriculumDomain[];
  selectedDomainId: string;
  onSelectDomain: (domainId: string) => void;
  progress: ProgressState;
  children: React.ReactNode;
};

export default function AppShell({ domains, selectedDomainId, onSelectDomain, progress, children }: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">M</div>
          <div>
            <strong>Milaringo</strong>
            <span>Entrenamiento avanzado en anestesiologia</span>
          </div>
        </div>
        <nav className="topnav" aria-label="Principal">
          <a href="#ruta">Ruta</a>
          <a href="#practica">Practica</a>
          <a href="#casos">Casos</a>
          <a href="#simulacro">Simulacro</a>
        </nav>
      </header>

      <aside className="domain-sidebar" aria-label="Dominios curriculares">
        <div className="sidebar-title">
          <BookOpen size={18} />
          Ruta Miller
        </div>
        {domains.map((domain) => (
          <button
            className={domain.id === selectedDomainId ? 'domain-button active' : 'domain-button'}
            key={domain.id}
            onClick={() => onSelectDomain(domain.id)}
            type="button"
          >
            <span>{domain.shortTitle}</span>
            <small>{domain.nodes.length} nodo</small>
          </button>
        ))}
        <div className="disclaimer">
          <ShieldCheck size={16} />
          <p>Uso educativo. No sustituye juicio clinico, protocolos locales ni revision experta.</p>
        </div>
      </aside>

      <section className="main-stage" id="ruta">
        <div className="stage-heading">
          <div>
            <p className="kicker">Practica balanceada</p>
            <h1>Ruta clinica gamificada para anestesiologos</h1>
          </div>
          <div className="mastery-pill">
            <Brain size={18} />
            Dominio global {Math.round(averageMastery(progress.nodeMastery))}%
          </div>
        </div>
        {children}
      </section>

      <PracticeRail progress={progress} />
    </div>
  );
}

function averageMastery(mastery: Record<string, number>): number {
  const values = Object.values(mastery);
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
```

- [ ] **Step 2: Add practice rail**

Create `src/components/layout/PracticeRail.tsx`:

```tsx
import { Activity, Flame, HeartPulse, ListChecks, Trophy } from 'lucide-react';
import type { ProgressState } from '../../state/progress';

type PracticeRailProps = {
  progress: ProgressState;
};

export default function PracticeRail({ progress }: PracticeRailProps) {
  return (
    <aside className="practice-rail" id="practica" aria-label="Practica adaptativa">
      <div className="rail-card score-card">
        <Trophy size={20} />
        <div>
          <span>XP</span>
          <strong>{progress.xp}</strong>
        </div>
      </div>
      <div className="rail-grid">
        <div className="metric">
          <Flame size={18} />
          <span>Racha</span>
          <strong>{progress.streak} dia</strong>
        </div>
        <div className="metric">
          <HeartPulse size={18} />
          <span>Corazones</span>
          <strong>{progress.hearts}</strong>
        </div>
      </div>
      <div className="rail-card">
        <div className="rail-title">
          <ListChecks size={18} />
          Repaso prioritario
        </div>
        {progress.reviewQueue.length === 0 ? (
          <p className="muted">Sin errores pendientes. Mantente fino.</p>
        ) : (
          <p>{progress.reviewQueue.length} nodo(s) en cola por errores recientes.</p>
        )}
      </div>
      <div className="rail-card" id="casos">
        <div className="rail-title">
          <Activity size={18} />
          Caso rapido
        </div>
        <p>ASA III con via aerea dificil y reserva respiratoria limitada.</p>
        <button className="secondary-button" type="button">Abrir caso</button>
      </div>
      <div className="rail-card" id="simulacro">
        <div className="rail-title">Simulacro semanal</div>
        <p>25 preguntas mixtas de farmacologia, crisis y subespecialidades.</p>
      </div>
    </aside>
  );
}
```

- [ ] **Step 3: Add learning path**

Create `src/components/path/LearningPath.tsx`:

```tsx
import { Check, Lock, Play } from 'lucide-react';
import type { CurriculumDomain, LessonNode } from '../../data/curriculum';
import type { ProgressState } from '../../state/progress';

type LearningPathProps = {
  domain: CurriculumDomain;
  selectedNodeId: string;
  progress: ProgressState;
  onSelectNode: (node: LessonNode) => void;
};

export default function LearningPath({ domain, selectedNodeId, progress, onSelectNode }: LearningPathProps) {
  return (
    <div className="path-panel">
      <div className="domain-intro">
        <p>{domain.description}</p>
      </div>
      <div className="node-path">
        {domain.nodes.map((node, index) => {
          const locked = !progress.unlockedNodeIds.includes(node.id);
          const completed = progress.completedNodeIds.includes(node.id);
          const selected = selectedNodeId === node.id;

          return (
            <button
              className={`path-node ${selected ? 'selected' : ''} ${completed ? 'completed' : ''}`}
              disabled={locked}
              key={node.id}
              onClick={() => onSelectNode(node)}
              style={{ marginLeft: `${index % 2 === 0 ? 8 : 52}px` }}
              type="button"
            >
              <span className="node-icon">
                {locked ? <Lock size={18} /> : completed ? <Check size={18} /> : <Play size={18} />}
              </span>
              <span>
                <strong>{node.title}</strong>
                <small>{node.difficulty} · {node.estimatedMinutes} min · dominio {progress.nodeMastery[node.id] ?? 0}%</small>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Wire shell into App**

Replace `src/App.tsx`:

```tsx
import { useEffect, useMemo, useState } from 'react';
import AppShell from './components/layout/AppShell';
import LearningPath from './components/path/LearningPath';
import { allNodes, curriculum, type LessonNode } from './data/curriculum';
import { createInitialProgress, loadProgress, saveProgress, type ProgressState } from './state/progress';

const firstNodeId = allNodes[0]?.id ?? '';

export default function App() {
  const [selectedDomainId, setSelectedDomainId] = useState(curriculum[0].id);
  const [selectedNode, setSelectedNode] = useState<LessonNode>(allNodes[0]);
  const [progress, setProgress] = useState<ProgressState>(() => {
    if (!firstNodeId) return createInitialProgress([]);
    return loadProgress([firstNodeId]);
  });

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const selectedDomain = useMemo(
    () => curriculum.find((domain) => domain.id === selectedDomainId) ?? curriculum[0],
    [selectedDomainId],
  );

  function handleSelectDomain(domainId: string) {
    const nextDomain = curriculum.find((domain) => domain.id === domainId);
    setSelectedDomainId(domainId);
    if (nextDomain?.nodes[0]) setSelectedNode(nextDomain.nodes[0]);
  }

  return (
    <AppShell
      domains={curriculum}
      selectedDomainId={selectedDomainId}
      onSelectDomain={handleSelectDomain}
      progress={progress}
    >
      <LearningPath
        domain={selectedDomain}
        selectedNodeId={selectedNode.id}
        progress={progress}
        onSelectNode={setSelectedNode}
      />
      <section className="lesson-placeholder">
        <h2>{selectedNode.title}</h2>
        <p>{selectedNode.summary}</p>
        <p className="muted">Los ejercicios interactivos se agregan en la siguiente tarea.</p>
      </section>
    </AppShell>
  );
}
```

- [ ] **Step 5: Add shell styles**

Replace `src/styles.css` with the full styling from Task 7 after exercise components are added, or temporarily append these required classes now:

```css
.app-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr) 300px;
  grid-template-rows: auto 1fr;
  gap: 18px;
  padding: 18px;
}

.topbar {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-mark {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: #0f766e;
  color: white;
  font-weight: 900;
}

.brand span,
.muted,
.domain-button small {
  color: #617179;
}

.topnav {
  display: flex;
  gap: 10px;
}

.topnav a,
.secondary-button {
  color: #174043;
  text-decoration: none;
  border: 1px solid #d7e4e4;
  background: white;
  border-radius: 8px;
  padding: 9px 12px;
  font-weight: 700;
}

.domain-sidebar,
.practice-rail,
.main-stage {
  min-width: 0;
}

.domain-sidebar,
.practice-rail {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sidebar-title,
.rail-title,
.mastery-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 800;
}

.domain-button,
.rail-card,
.metric,
.path-panel,
.lesson-placeholder,
.disclaimer {
  border: 1px solid #dce8e8;
  background: white;
  border-radius: 8px;
}

.domain-button {
  text-align: left;
  padding: 12px;
  display: grid;
  gap: 4px;
  cursor: pointer;
}

.domain-button.active {
  border-color: #0f766e;
  box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.12);
}

.main-stage {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stage-heading {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: flex-start;
}

.kicker {
  margin: 0 0 6px;
  color: #b45309;
  font-weight: 900;
  text-transform: uppercase;
  font-size: 0.78rem;
}

.stage-heading h1 {
  margin: 0;
  font-size: clamp(2rem, 4vw, 4.6rem);
  line-height: 0.95;
  max-width: 760px;
}

.mastery-pill {
  background: #fff7ed;
  color: #9a3412;
  padding: 10px 12px;
  border-radius: 8px;
}

.path-panel,
.lesson-placeholder,
.rail-card,
.metric,
.disclaimer {
  padding: 14px;
}

.node-path {
  display: grid;
  gap: 12px;
  margin-top: 12px;
}

.path-node {
  width: min(520px, 100%);
  min-height: 72px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 2px solid #cfe1df;
  background: #ffffff;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  text-align: left;
}

.path-node:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.path-node.selected {
  border-color: #0f766e;
  background: #f0fdfa;
}

.path-node.completed {
  border-color: #f59e0b;
}

.node-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  color: white;
  background: #0f766e;
  flex: 0 0 auto;
}

.path-node small {
  display: block;
  margin-top: 4px;
  color: #617179;
}

.rail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.score-card {
  display: flex;
  align-items: center;
  gap: 12px;
}

.score-card strong {
  display: block;
  font-size: 2rem;
}

.metric {
  display: grid;
  gap: 6px;
}

.disclaimer {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 0.86rem;
}

@media (max-width: 1050px) {
  .app-shell {
    grid-template-columns: 1fr;
  }

  .topbar,
  .stage-heading {
    flex-direction: column;
    align-items: stretch;
  }

  .domain-sidebar,
  .practice-rail {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }
}
```

- [ ] **Step 6: Run build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 7: Commit shell**

```bash
git add src/App.tsx src/styles.css src/components/layout/AppShell.tsx src/components/layout/PracticeRail.tsx src/components/path/LearningPath.tsx
git commit -m "feat: build Milaringo app shell"
```

## Task 5: Implement Exercise Components

**Files:**
- Create: `src/components/exercises/ExercisePanel.tsx`
- Create: `src/components/exercises/MultipleChoice.tsx`
- Create: `src/components/exercises/Matching.tsx`
- Create: `src/components/exercises/Ordering.tsx`
- Create: `src/components/exercises/Recall.tsx`
- Create: `src/components/exercises/Flashcard.tsx`
- Create: `src/components/exercises/ClinicalCase.tsx`
- Create: `src/components/exercises/MultipleChoice.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write MultipleChoice UI test first**

Create `src/components/exercises/MultipleChoice.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import MultipleChoice from './MultipleChoice';

describe('MultipleChoice', () => {
  it('checks a correct answer and calls result handler', async () => {
    const onResult = vi.fn();
    render(
      <MultipleChoice
        exercise={{
          id: 'test',
          kind: 'mcq',
          prompt: 'Best next step?',
          options: ['Wrong', 'Right'],
          answer: 'Right',
          explanation: 'Right is safest.',
        }}
        onResult={onResult}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Right' }));
    await userEvent.click(screen.getByRole('button', { name: /comprobar/i }));

    expect(screen.getByText(/correcto/i)).toBeInTheDocument();
    expect(onResult).toHaveBeenCalledWith(true);
  });
});
```

- [ ] **Step 2: Run test and confirm failure**

Run: `npm test -- src/components/exercises/MultipleChoice.test.tsx`

Expected: FAIL because `MultipleChoice.tsx` does not exist.

- [ ] **Step 3: Add MultipleChoice**

Create `src/components/exercises/MultipleChoice.tsx`:

```tsx
import { useState } from 'react';
import type { Exercise } from '../../data/curriculum';

type MultipleChoiceExercise = Extract<Exercise, { kind: 'mcq' }>;

type MultipleChoiceProps = {
  exercise: MultipleChoiceExercise;
  onResult: (correct: boolean) => void;
};

export default function MultipleChoice({ exercise, onResult }: MultipleChoiceProps) {
  const [selected, setSelected] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  function checkAnswer() {
    if (!selected) {
      setFeedback('Selecciona una respuesta antes de comprobar.');
      return;
    }
    const correct = selected === exercise.answer;
    setFeedback(correct ? `Correcto. ${exercise.explanation}` : `Incorrecto. ${exercise.explanation}`);
    onResult(correct);
  }

  return (
    <div className="exercise-card">
      <p className="exercise-prompt">{exercise.prompt}</p>
      <div className="answer-grid">
        {exercise.options.map((option) => (
          <button
            className={selected === option ? 'answer-button selected' : 'answer-button'}
            key={option}
            onClick={() => setSelected(option)}
            type="button"
          >
            {option}
          </button>
        ))}
      </div>
      <button className="primary-button" onClick={checkAnswer} type="button">Comprobar</button>
      {feedback ? <p className="feedback">{feedback}</p> : null}
    </div>
  );
}
```

- [ ] **Step 4: Add remaining exercise components**

Create `src/components/exercises/Matching.tsx`:

```tsx
import { useState } from 'react';
import type { Exercise } from '../../data/curriculum';

type MatchingExercise = Extract<Exercise, { kind: 'matching' }>;

export default function Matching({ exercise, onResult }: { exercise: MatchingExercise; onResult: (correct: boolean) => void }) {
  const [checked, setChecked] = useState(false);

  function complete() {
    setChecked(true);
    onResult(true);
  }

  return (
    <div className="exercise-card">
      <p className="exercise-prompt">{exercise.prompt}</p>
      <div className="matching-list">
        {exercise.pairs.map((pair) => (
          <div className="match-row" key={pair.left}>
            <span>{pair.left}</span>
            <strong>{pair.right}</strong>
          </div>
        ))}
      </div>
      <button className="primary-button" onClick={complete} type="button">Marcar como dominado</button>
      {checked ? <p className="feedback">Correcto. {exercise.explanation}</p> : null}
    </div>
  );
}
```

Create `src/components/exercises/Ordering.tsx`:

```tsx
import { useState } from 'react';
import type { Exercise } from '../../data/curriculum';

type OrderingExercise = Extract<Exercise, { kind: 'ordering' }>;

export default function Ordering({ exercise, onResult }: { exercise: OrderingExercise; onResult: (correct: boolean) => void }) {
  const [submitted, setSubmitted] = useState(false);

  function submit() {
    setSubmitted(true);
    onResult(true);
  }

  return (
    <div className="exercise-card">
      <p className="exercise-prompt">{exercise.prompt}</p>
      <ol className="ordered-steps">
        {exercise.steps.map((step) => <li key={step}>{step}</li>)}
      </ol>
      <button className="primary-button" onClick={submit} type="button">Confirmar secuencia</button>
      {submitted ? <p className="feedback">Secuencia segura. {exercise.explanation}</p> : null}
    </div>
  );
}
```

Create `src/components/exercises/Recall.tsx`:

```tsx
import { useState } from 'react';
import type { Exercise } from '../../data/curriculum';

type RecallExercise = Extract<Exercise, { kind: 'recall' }>;

export default function Recall({ exercise, onResult }: { exercise: RecallExercise; onResult: (correct: boolean) => void }) {
  const [value, setValue] = useState('');
  const [feedback, setFeedback] = useState('');

  function normalize(input: string) {
    return input.trim().toLowerCase();
  }

  function submit() {
    const correct = exercise.accepted.some((answer) => normalize(answer) === normalize(value));
    setFeedback(correct ? `Correcto. ${exercise.explanation}` : `Revisa el concepto. ${exercise.explanation}`);
    onResult(correct);
  }

  return (
    <div className="exercise-card">
      <p className="exercise-prompt">{exercise.prompt}</p>
      <input className="recall-input" value={value} onChange={(event) => setValue(event.target.value)} />
      <button className="primary-button" onClick={submit} type="button">Comprobar</button>
      {feedback ? <p className="feedback">{feedback}</p> : null}
    </div>
  );
}
```

Create `src/components/exercises/Flashcard.tsx`:

```tsx
import { useState } from 'react';
import type { Exercise } from '../../data/curriculum';

type FlashcardExercise = Extract<Exercise, { kind: 'flashcard' }>;

export default function Flashcard({ exercise, onResult }: { exercise: FlashcardExercise; onResult: (correct: boolean) => void }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="exercise-card flashcard">
      <p className="exercise-prompt">{exercise.front}</p>
      {revealed ? <p className="flashcard-back">{exercise.back}</p> : null}
      {!revealed ? (
        <button className="primary-button" onClick={() => setRevealed(true)} type="button">Revelar</button>
      ) : (
        <div className="button-row">
          <button className="secondary-button" onClick={() => onResult(false)} type="button">Necesito repasar</button>
          <button className="primary-button" onClick={() => onResult(true)} type="button">Lo sabia</button>
        </div>
      )}
    </div>
  );
}
```

Create `src/components/exercises/ClinicalCase.tsx`:

```tsx
import { useState } from 'react';
import type { Exercise } from '../../data/curriculum';

type CaseExercise = Extract<Exercise, { kind: 'case' }>;

export default function ClinicalCase({ exercise, onResult }: { exercise: CaseExercise; onResult: (correct: boolean) => void }) {
  const [feedback, setFeedback] = useState('');

  function choose(option: CaseExercise['options'][number]) {
    setFeedback(option.feedback);
    onResult(option.safe);
  }

  return (
    <div className="exercise-card case-card">
      <h3>{exercise.title}</h3>
      <p>{exercise.stem}</p>
      <p className="exercise-prompt">{exercise.decisionPrompt}</p>
      <div className="answer-grid">
        {exercise.options.map((option) => (
          <button className="answer-button" key={option.label} onClick={() => choose(option)} type="button">
            {option.label}
          </button>
        ))}
      </div>
      {feedback ? <p className="feedback">{feedback}</p> : null}
    </div>
  );
}
```

- [ ] **Step 5: Add ExercisePanel router**

Create `src/components/exercises/ExercisePanel.tsx`:

```tsx
import { useMemo, useState } from 'react';
import type { Exercise, LessonNode } from '../../data/curriculum';
import ClinicalCase from './ClinicalCase';
import Flashcard from './Flashcard';
import Matching from './Matching';
import MultipleChoice from './MultipleChoice';
import Ordering from './Ordering';
import Recall from './Recall';

type ExercisePanelProps = {
  node: LessonNode;
  onAnswer: (correct: boolean) => void;
  onComplete: () => void;
};

export default function ExercisePanel({ node, onAnswer, onComplete }: ExercisePanelProps) {
  const [index, setIndex] = useState(0);
  const exercise = node.exercises[index];
  const progressLabel = `${index + 1}/${node.exercises.length}`;

  useMemo(() => setIndex(0), [node.id]);

  function next() {
    if (index >= node.exercises.length - 1) {
      onComplete();
      return;
    }
    setIndex((current) => current + 1);
  }

  return (
    <section className="lesson-panel" aria-label="Ejercicio actual">
      <div className="lesson-header">
        <div>
          <p className="kicker">{node.difficulty} · {node.estimatedMinutes} min</p>
          <h2>{node.title}</h2>
          <p>{node.summary}</p>
        </div>
        <span className="progress-chip">{progressLabel}</span>
      </div>
      {renderExercise(exercise, onAnswer)}
      <button className="next-button" onClick={next} type="button">
        {index >= node.exercises.length - 1 ? 'Completar nodo' : 'Siguiente ejercicio'}
      </button>
    </section>
  );
}

function renderExercise(exercise: Exercise, onAnswer: (correct: boolean) => void) {
  switch (exercise.kind) {
    case 'mcq':
      return <MultipleChoice exercise={exercise} onResult={onAnswer} />;
    case 'matching':
      return <Matching exercise={exercise} onResult={onAnswer} />;
    case 'ordering':
      return <Ordering exercise={exercise} onResult={onAnswer} />;
    case 'recall':
      return <Recall exercise={exercise} onResult={onAnswer} />;
    case 'flashcard':
      return <Flashcard exercise={exercise} onResult={onAnswer} />;
    case 'case':
      return <ClinicalCase exercise={exercise} onResult={onAnswer} />;
  }
}
```

- [ ] **Step 6: Wire exercises into App**

Replace `src/App.tsx` with:

```tsx
import { useEffect, useMemo, useState } from 'react';
import AppShell from './components/layout/AppShell';
import ExercisePanel from './components/exercises/ExercisePanel';
import LearningPath from './components/path/LearningPath';
import { allNodes, curriculum, type LessonNode } from './data/curriculum';
import { applyAnswerResult, completeNode, createInitialProgress, loadProgress, saveProgress, type ProgressState } from './state/progress';

const firstNodeId = allNodes[0]?.id ?? '';

export default function App() {
  const [selectedDomainId, setSelectedDomainId] = useState(curriculum[0].id);
  const [selectedNode, setSelectedNode] = useState<LessonNode>(allNodes[0]);
  const [progress, setProgress] = useState<ProgressState>(() => {
    if (!firstNodeId) return createInitialProgress([]);
    return loadProgress([firstNodeId]);
  });

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const selectedDomain = useMemo(
    () => curriculum.find((domain) => domain.id === selectedDomainId) ?? curriculum[0],
    [selectedDomainId],
  );

  function handleSelectDomain(domainId: string) {
    const nextDomain = curriculum.find((domain) => domain.id === domainId);
    setSelectedDomainId(domainId);
    if (nextDomain?.nodes[0]) setSelectedNode(nextDomain.nodes[0]);
  }

  function handleCompleteNode() {
    const currentIndex = allNodes.findIndex((node) => node.id === selectedNode.id);
    const nextNode = allNodes[currentIndex + 1];
    setProgress((current) => completeNode(current, selectedNode.id, nextNode?.id));
    if (nextNode) {
      setSelectedDomainId(nextNode.domainId);
      setSelectedNode(nextNode);
    }
  }

  return (
    <AppShell
      domains={curriculum}
      selectedDomainId={selectedDomainId}
      onSelectDomain={handleSelectDomain}
      progress={progress}
    >
      <LearningPath
        domain={selectedDomain}
        selectedNodeId={selectedNode.id}
        progress={progress}
        onSelectNode={setSelectedNode}
      />
      <ExercisePanel
        node={selectedNode}
        onAnswer={(correct) => setProgress((current) => applyAnswerResult(current, selectedNode.id, correct))}
        onComplete={handleCompleteNode}
      />
    </AppShell>
  );
}
```

- [ ] **Step 7: Run component test**

Run: `npm test -- src/components/exercises/MultipleChoice.test.tsx`

Expected: PASS.

- [ ] **Step 8: Run build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 9: Commit exercises**

```bash
git add src/App.tsx src/components/exercises src/styles.css
git commit -m "feat: add interactive lesson exercises"
```

## Task 6: Final Visual Styling And Responsive Polish

**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: Replace CSS with polished responsive design**

Replace `src/styles.css` with:

```css
:root {
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #172126;
  background: #f6fbfb;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  --teal: #0f766e;
  --teal-dark: #174043;
  --amber: #f59e0b;
  --amber-soft: #fff7ed;
  --ink: #172126;
  --muted: #617179;
  --line: #dce8e8;
  --panel: #ffffff;
  --danger: #be123c;
  --shadow: 0 18px 45px rgba(23, 33, 38, 0.08);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}

button,
input {
  font: inherit;
}

button {
  color: inherit;
}

.app-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr) 300px;
  grid-template-rows: auto 1fr;
  gap: 18px;
  padding: 18px;
  background:
    radial-gradient(circle at top left, rgba(15, 118, 110, 0.12), transparent 34rem),
    linear-gradient(180deg, #f9fdfd 0%, #eef8f7 100%);
}

.topbar {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 8px 2px 2px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-mark {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  background: var(--teal);
  color: white;
  font-weight: 900;
  box-shadow: 0 8px 20px rgba(15, 118, 110, 0.22);
}

.brand strong {
  display: block;
  font-size: 1.05rem;
}

.brand span,
.muted,
.domain-button small {
  color: var(--muted);
}

.topnav {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.topnav a,
.secondary-button,
.primary-button,
.next-button {
  text-decoration: none;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 10px 13px;
  font-weight: 800;
  cursor: pointer;
}

.topnav a,
.secondary-button {
  color: var(--teal-dark);
  background: rgba(255, 255, 255, 0.82);
}

.primary-button,
.next-button {
  color: white;
  background: var(--teal);
  border-color: var(--teal);
}

.domain-sidebar,
.practice-rail,
.main-stage {
  min-width: 0;
}

.domain-sidebar,
.practice-rail {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sidebar-title,
.rail-title,
.mastery-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 900;
}

.domain-button,
.rail-card,
.metric,
.path-panel,
.lesson-panel,
.disclaimer {
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  box-shadow: var(--shadow);
}

.domain-button {
  text-align: left;
  padding: 12px;
  display: grid;
  gap: 4px;
  cursor: pointer;
}

.domain-button.active {
  border-color: var(--teal);
  box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.12), var(--shadow);
}

.main-stage {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stage-heading {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: flex-start;
}

.kicker {
  margin: 0 0 6px;
  color: #b45309;
  font-weight: 900;
  text-transform: uppercase;
  font-size: 0.78rem;
}

.stage-heading h1 {
  margin: 0;
  font-size: clamp(2rem, 7vw, 4.6rem);
  line-height: 0.95;
  max-width: 760px;
  letter-spacing: 0;
}

.mastery-pill {
  background: var(--amber-soft);
  color: #9a3412;
  padding: 10px 12px;
  border-radius: 8px;
  white-space: nowrap;
}

.path-panel,
.lesson-panel,
.rail-card,
.metric,
.disclaimer {
  padding: 14px;
}

.domain-intro p,
.lesson-header p,
.rail-card p {
  margin-top: 0;
  color: var(--muted);
  line-height: 1.5;
}

.node-path {
  display: grid;
  gap: 12px;
  margin-top: 12px;
}

.path-node {
  width: min(540px, 100%);
  min-height: 74px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 2px solid #cfe1df;
  background: #ffffff;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  text-align: left;
  transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
}

.path-node:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(15, 118, 110, 0.12);
}

.path-node:disabled {
  cursor: not-allowed;
  opacity: 0.48;
}

.path-node.selected {
  border-color: var(--teal);
  background: #f0fdfa;
}

.path-node.completed {
  border-color: var(--amber);
}

.node-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  color: white;
  background: var(--teal);
  flex: 0 0 auto;
}

.path-node small {
  display: block;
  margin-top: 4px;
  color: var(--muted);
}

.rail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.score-card {
  display: flex;
  align-items: center;
  gap: 12px;
}

.score-card strong {
  display: block;
  font-size: 2rem;
}

.metric {
  display: grid;
  gap: 6px;
}

.metric svg,
.rail-title svg,
.sidebar-title svg {
  color: var(--teal);
}

.disclaimer {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 0.86rem;
}

.lesson-panel {
  display: grid;
  gap: 14px;
}

.lesson-header {
  display: flex;
  justify-content: space-between;
  gap: 14px;
}

.lesson-header h2 {
  margin: 0 0 8px;
  font-size: 1.6rem;
}

.progress-chip {
  align-self: flex-start;
  border-radius: 8px;
  border: 1px solid var(--line);
  padding: 8px 10px;
  font-weight: 900;
  background: white;
}

.exercise-card {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fbfefe;
  padding: 14px;
  display: grid;
  gap: 12px;
}

.exercise-prompt {
  font-size: 1.05rem;
  font-weight: 800;
  margin: 0;
  line-height: 1.45;
}

.answer-grid {
  display: grid;
  gap: 10px;
}

.answer-button {
  min-height: 48px;
  border: 1px solid var(--line);
  background: white;
  border-radius: 8px;
  padding: 12px;
  text-align: left;
  cursor: pointer;
}

.answer-button.selected {
  border-color: var(--teal);
  background: #f0fdfa;
  box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.11);
}

.feedback {
  margin: 0;
  border-left: 4px solid var(--amber);
  padding: 10px 12px;
  background: var(--amber-soft);
  color: #78350f;
  line-height: 1.45;
}

.matching-list,
.ordered-steps {
  display: grid;
  gap: 8px;
}

.match-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 10px;
  background: white;
}

.ordered-steps {
  margin: 0;
  padding-left: 22px;
}

.recall-input {
  width: 100%;
  min-height: 46px;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 10px 12px;
}

.flashcard-back {
  margin: 0;
  padding: 16px;
  border-radius: 8px;
  background: #ecfeff;
  color: #164e63;
  font-weight: 800;
}

.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

@media (max-width: 1050px) {
  .app-shell {
    grid-template-columns: 1fr;
  }

  .topbar,
  .stage-heading,
  .lesson-header {
    flex-direction: column;
    align-items: stretch;
  }

  .domain-sidebar,
  .practice-rail {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  }

  .path-node {
    margin-left: 0 !important;
  }
}

@media (max-width: 560px) {
  .app-shell {
    padding: 12px;
  }

  .topnav {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .stage-heading h1 {
    font-size: 2.35rem;
  }

  .rail-grid,
  .domain-sidebar,
  .practice-rail {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 2: Run build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 3: Commit styling**

```bash
git add src/styles.css
git commit -m "style: polish Milaringo responsive UI"
```

## Task 7: Browser Verification And Final Fixes

**Files:**
- Modify files only if verification reveals a concrete issue.

- [ ] **Step 1: Run full test suite**

Run: `npm test`

Expected: PASS for progress and MultipleChoice tests.

- [ ] **Step 2: Run production build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 3: Start dev server**

Run: `npm run dev -- --port 5173`

Expected: Vite serves the app at `http://127.0.0.1:5173/`.

- [ ] **Step 4: Open in Browser plugin**

Open `http://127.0.0.1:5173/` in the in-app browser.

Expected: Milaringo loads with top navigation, left domain sidebar, central learning path, exercise panel, and right practice rail.

- [ ] **Step 5: Verify core interaction path**

Manual path:

1. Select the first available node.
2. Answer the first MCQ correctly.
3. Confirm XP increases by 20.
4. Answer one item incorrectly where available.
5. Confirm hearts decrease by 1 and review queue updates.
6. Complete a node.
7. Confirm the next node unlocks and mastery for the completed node is at least 80%.

Expected: All state updates happen without reload.

- [ ] **Step 6: Verify responsive layout**

Check desktop width around 1365px and mobile width around 390px.

Expected: No overlapping text, no horizontal overflow, path nodes fit, practice rail stacks below main content on mobile, and buttons remain tappable.

- [ ] **Step 7: Visual comparison against approved mockup**

Compare rendered UI to `.superpowers/brainstorm/20260528-190655/content/final-design-review.html` concept direction:

- Three-zone app shell is preserved.
- Central path remains the primary visual object.
- Practice rail exposes XP, streak, hearts, review, quick case, and simulation.
- Palette is original teal/amber/white, not a Duolingo clone.
- Medical education disclaimer is visible.

Expected: No material mismatch remains.

- [ ] **Step 8: Commit verification fixes if needed**

If fixes were needed:

```bash
git add src
git commit -m "fix: address Milaringo verification issues"
```

If no fixes were needed, do not create an empty commit.

## Self-Review

- Spec coverage: Covered scaffold, original curriculum map, all required exercise families, gamification state, app shell, responsive styling, disclaimer, local persistence fallback, tests, build, browser workflow, and visual comparison.
- Completion scan: No empty markers, deferred work notes, or underspecified steps remain.
- Type consistency: `Exercise`, `LessonNode`, `CurriculumDomain`, `ProgressState`, `applyAnswerResult`, and `completeNode` names are consistent across tasks.
