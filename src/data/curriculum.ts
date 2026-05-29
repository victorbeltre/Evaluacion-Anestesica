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
    title: 'Foundations, safety, and perioperative medicine',
    shortTitle: 'Foundations',
    description: 'Quality, safety, ethics, informatics, simulation, and modern perioperative systems thinking.',
    nodes: [
      {
        id: 'perioperative-briefing',
        title: 'High-risk perioperative brief',
        domainId: 'foundations',
        difficulty: 'R3',
        estimatedMinutes: 7,
        summary: 'Practice team communication, escalation thresholds, and risk anticipation before induction.',
        exercises: [
          {
            id: 'briefing-mcq',
            kind: 'mcq',
            prompt:
              'A patient with severe pulmonary hypertension arrives for urgent laparotomy. Which pre-induction action most directly reduces team error during the first 10 minutes?',
            options: [
              'Increase fresh gas flow before monitors are attached',
              'Run a structured brief naming roles, vasoactive plan, rescue triggers, and blood availability',
              'Delay arterial access until after incision',
              'Ask the circulating nurse to document vital signs every 15 minutes',
            ],
            answer: 'Run a structured brief naming roles, vasoactive plan, rescue triggers, and blood availability',
            explanation:
              'A structured brief converts an implicit plan into shared expectations before workload spikes and decisions compress.',
          },
          {
            id: 'briefing-flashcard',
            kind: 'flashcard',
            front: 'What is the practical endpoint of a short anesthesia debrief?',
            back: 'One or two specific system or team actions that can be changed, assigned, and revisited in a future case.',
          },
        ],
      },
      {
        id: 'perioperative-ethics',
        title: 'Consent under clinical pressure',
        domainId: 'foundations',
        difficulty: 'R4',
        estimatedMinutes: 6,
        unlockedAfter: 'perioperative-briefing',
        summary: 'Balance urgency, capacity, surrogate input, and transparent risk communication.',
        exercises: [
          {
            id: 'ethics-recall',
            kind: 'recall',
            prompt:
              'Name the decision-making concept assessed before accepting or refusing a high-risk anesthetic plan.',
            accepted: ['capacity', 'decision-making capacity', 'decisional capacity'],
            explanation:
              'Capacity is task specific and includes understanding, appreciation, reasoning, and communicating a choice.',
          },
        ],
      },
    ],
  },
  {
    id: 'physiology',
    title: 'Applied anesthetic physiology',
    shortTitle: 'Physiology',
    description: 'Consciousness, sleep, brain, lung, heart, kidney, liver, endocrine stress, and physiologic reserve.',
    nodes: [
      {
        id: 'ventilation-perfusion',
        title: 'Ventilation-perfusion under anesthesia',
        domainId: 'physiology',
        difficulty: 'R4',
        estimatedMinutes: 9,
        summary: 'Link anesthetic state, atelectasis, shunt fraction, compliance, and oxygenation strategy.',
        exercises: [
          {
            id: 'vq-mcq',
            kind: 'mcq',
            prompt: 'After induction, loss of functional residual capacity most immediately increases risk for:',
            options: ['Hypercalcemia', 'Dependent airway closure and shunt', 'Metabolic alkalosis', 'Complete AV block'],
            answer: 'Dependent airway closure and shunt',
            explanation:
              'Reduced functional residual capacity promotes dependent airway closure, atelectasis, lower compliance, and shunt physiology.',
          },
          {
            id: 'desaturation-order',
            kind: 'ordering',
            prompt: 'Order a disciplined first response to abrupt desaturation soon after intubation.',
            steps: [
              'Confirm pulse oximeter signal, waveform, and delivered oxygen concentration',
              'Ventilate manually while assessing chest movement and compliance',
              'Auscultate and check tube depth, circuit integrity, and capnography',
              'Apply targeted recruitment, PEEP, bronchodilator, or tube repositioning based on findings',
            ],
            explanation:
              'The sequence preserves oxygen delivery while separating artifact, equipment failure, airway problems, and lung physiology.',
          },
        ],
      },
      {
        id: 'right-ventricle',
        title: 'Right ventricular reserve',
        domainId: 'physiology',
        difficulty: 'Fellow',
        estimatedMinutes: 8,
        unlockedAfter: 'ventilation-perfusion',
        summary: 'Reason through preload, afterload, contractility, and coronary perfusion in RV dysfunction.',
        exercises: [
          {
            id: 'rv-matching',
            kind: 'matching',
            prompt: 'Match the intraoperative event with the likely right ventricular consequence.',
            pairs: [
              { left: 'Hypoxia and hypercarbia', right: 'Increased pulmonary vascular resistance' },
              { left: 'Severe systemic hypotension', right: 'Reduced right coronary perfusion pressure' },
              { left: 'Abrupt high airway pressure', right: 'Higher RV afterload and lower venous return' },
            ],
            explanation:
              'RV failure often worsens when pulmonary afterload rises while systemic pressure and coronary perfusion fall.',
          },
        ],
      },
    ],
  },
  {
    id: 'pharmacology',
    title: 'Pharmacology and delivery systems',
    shortTitle: 'Pharmacology',
    description: 'Inhaled agents, intravenous hypnotics, opioids, neuromuscular blockers, local anesthetics, and delivery technology.',
    nodes: [
      {
        id: 'context-sensitive-kinetics',
        title: 'Context-sensitive kinetics',
        domainId: 'pharmacology',
        difficulty: 'Fellow',
        estimatedMinutes: 10,
        summary: 'Differentiate terminal half-life, effect-site equilibration, and recovery after infusion.',
        exercises: [
          {
            id: 'context-recall',
            kind: 'recall',
            prompt:
              'What term describes the time for plasma concentration to decrease by 50% after stopping an infusion, as a function of infusion duration?',
            accepted: ['context-sensitive half-time', 'context sensitive half time', 'context-sensitive halftime'],
            explanation:
              'Context-sensitive half-time reflects distribution and clearance after a given infusion duration; it is not the terminal half-life.',
          },
          {
            id: 'drug-association-match',
            kind: 'matching',
            prompt: 'Match the drug or class with the clinically dominant association.',
            pairs: [
              { left: 'Remifentanil', right: 'Rapid esterase metabolism' },
              { left: 'Succinylcholine', right: 'Hyperkalemia concern in susceptible states' },
              { left: 'Bupivacaine', right: 'Greater concern for cardiotoxicity during systemic toxicity' },
            ],
            explanation:
              'These associations guide vigilance and rescue planning, but local dosing references and institutional policy still matter.',
          },
        ],
      },
      {
        id: 'local-anesthetic-toxicity',
        title: 'Local anesthetic systemic toxicity',
        domainId: 'pharmacology',
        difficulty: 'Attending',
        estimatedMinutes: 8,
        unlockedAfter: 'context-sensitive-kinetics',
        summary: 'Recognize evolving toxicity and prioritize seizure, airway, circulation, and lipid rescue steps.',
        exercises: [
          {
            id: 'last-order',
            kind: 'ordering',
            prompt: 'Order the first response to suspected local anesthetic systemic toxicity during a block.',
            steps: [
              'Stop local anesthetic injection and call for help',
              'Secure oxygenation, ventilation, and seizure control',
              'Start lipid emulsion per local protocol',
              'Treat arrhythmia and hypotension with LAST-aware resuscitation choices',
            ],
            explanation:
              'Early recognition, airway control, seizure suppression, lipid rescue, and modified resuscitation should proceed in parallel when possible.',
          },
        ],
      },
    ],
  },
  {
    id: 'airway-monitoring',
    title: 'Airway, monitoring, and intraoperative management',
    shortTitle: 'Airway',
    description:
      'Preoperative assessment, monitors, POCUS, airway strategy, regional anesthesia, fluids, acid-base, transfusion, and coagulation.',
    nodes: [
      {
        id: 'cannot-intubate-oxygenate',
        title: 'Cannot intubate, cannot oxygenate',
        domainId: 'airway-monitoring',
        difficulty: 'Attending',
        estimatedMinutes: 8,
        summary: 'Practice early declaration, help mobilization, rescue oxygenation, and front-of-neck access readiness.',
        exercises: [
          {
            id: 'cio-case',
            kind: 'case',
            title: 'Rapid desaturation after induction',
            stem:
              'A patient with obesity and a large neck mass has two failed laryngoscopy attempts. Mask ventilation is ineffective despite optimization, and SpO2 falls to 82%.',
            decisionPrompt: 'What is the safest next move?',
            options: [
              {
                label: 'Attempt a third laryngoscopy with the same blade',
                feedback: 'Repeating the same failed technique delays oxygenation and increases airway trauma.',
                safe: false,
              },
              {
                label: 'Declare the emergency, call for help, and move to rescue oxygenation strategy',
                feedback: 'Correct. The priority has shifted from intubation attempts to restoring oxygenation.',
                safe: true,
              },
              {
                label: 'Wait for spontaneous awakening without effective oxygenation',
                feedback: 'Awakening may be reasonable in some airway plans, but not while oxygenation is failing.',
                safe: false,
              },
            ],
          },
        ],
      },
      {
        id: 'transfusion-coagulation',
        title: 'Hemorrhage and coagulation signal',
        domainId: 'airway-monitoring',
        difficulty: 'Fellow',
        estimatedMinutes: 9,
        unlockedAfter: 'cannot-intubate-oxygenate',
        summary: 'Use bedside trend data to reason about resuscitation, hemostasis, and communication with surgery.',
        exercises: [
          {
            id: 'hemorrhage-mcq',
            kind: 'mcq',
            prompt:
              'During major pelvic bleeding, which finding most strongly supports escalating from crystalloid-heavy resuscitation to balanced hemostatic resuscitation?',
            options: [
              'Stable temperature and normal base excess',
              'Ongoing blood loss with rising vasopressor need, acidosis, and coagulopathy trend',
              'A single mildly low noninvasive blood pressure during positioning',
              'Urine output above 1 mL/kg/hr throughout the case',
            ],
            answer: 'Ongoing blood loss with rising vasopressor need, acidosis, and coagulopathy trend',
            explanation:
              'Persistent hemorrhage with shock physiology and coagulopathy should trigger coordinated hemostatic resuscitation rather than dilutional replacement.',
          },
        ],
      },
    ],
  },
  {
    id: 'subspecialties',
    title: 'Adult and pediatric subspecialty anesthesia',
    shortTitle: 'Subspecialties',
    description:
      'Thoracic, cardiac, vascular, neuro, bariatric, renal, transplant, obstetric, pediatric, trauma, ambulatory, NORA, and extremes.',
    nodes: [
      {
        id: 'aortic-stenosis-induction',
        title: 'Severe aortic stenosis induction',
        domainId: 'subspecialties',
        difficulty: 'Fellow',
        estimatedMinutes: 8,
        summary: 'Integrate hemodynamic goals, monitor selection, preload, rhythm, and vasopressor readiness.',
        exercises: [
          {
            id: 'as-mcq',
            kind: 'mcq',
            prompt: 'In severe symptomatic aortic stenosis, the most important induction goal is to:',
            options: [
              'Create tachycardia to preserve cardiac output',
              'Avoid hypotension while preserving sinus rhythm and adequate preload',
              'Use deep vasodilation to reduce valve gradient',
              'Keep the patient intentionally hypovolemic',
            ],
            answer: 'Avoid hypotension while preserving sinus rhythm and adequate preload',
            explanation:
              'Coronary perfusion and diastolic filling are vulnerable; hypotension, tachycardia, and loss of atrial contribution can be poorly tolerated.',
          },
          {
            id: 'as-flashcard',
            kind: 'flashcard',
            front: 'Why can atrial fibrillation destabilize severe aortic stenosis?',
            back: 'Loss of atrial contribution and irregular diastolic filling can reduce preload-dependent stroke volume and coronary perfusion reserve.',
          },
        ],
      },
      {
        id: 'one-lung-ventilation',
        title: 'One-lung ventilation hypoxemia',
        domainId: 'subspecialties',
        difficulty: 'Attending',
        estimatedMinutes: 9,
        unlockedAfter: 'aortic-stenosis-induction',
        summary: 'Work through tube position, FiO2, PEEP, CPAP, recruitment, and surgical communication.',
        exercises: [
          {
            id: 'olv-order',
            kind: 'ordering',
            prompt: 'Order a reasonable approach to hypoxemia during one-lung ventilation.',
            steps: [
              'Confirm tube or blocker position and dependent lung ventilation',
              'Increase FiO2 and optimize dependent lung recruitment/PEEP',
              'Coordinate with surgeon about nondependent lung CPAP or intermittent two-lung ventilation',
              'Reassess hemodynamics, shunt contributors, and need to pause surgical conditions',
            ],
            explanation:
              'Mechanical position and dependent lung ventilation are checked early, then oxygenation maneuvers are escalated with surgical coordination.',
          },
        ],
      },
    ],
  },
  {
    id: 'critical-care',
    title: 'Critical care, pain, postoperative care, and crisis',
    shortTitle: 'Crisis',
    description:
      'PACU, acute pain, delirium, ICU physiology, ECMO, mechanical circulatory support, resuscitation, burns, and emergency preparedness.',
    nodes: [
      {
        id: 'malignant-hyperthermia',
        title: 'Malignant hyperthermia response',
        domainId: 'critical-care',
        difficulty: 'Attending',
        estimatedMinutes: 9,
        summary: 'Recognize the early pattern and prioritize a coordinated metabolic crisis response.',
        exercises: [
          {
            id: 'mh-order',
            kind: 'ordering',
            prompt: 'Order the initial priorities for suspected malignant hyperthermia.',
            steps: [
              'Stop triggering agents and change to a nontriggering anesthetic plan',
              'Call for help, MH cart, and dantrolene preparation',
              'Hyperventilate with 100% oxygen and increase fresh gas flow',
              'Treat hyperkalemia/acidosis and actively cool when indicated',
            ],
            explanation:
              'Early management removes the trigger, gives dantrolene, supports oxygen delivery, and treats dangerous metabolic consequences.',
          },
          {
            id: 'mh-case',
            kind: 'case',
            title: 'Rising CO2 during a long case',
            stem:
              'A healthy adult under volatile anesthesia develops rapidly rising ETCO2, tachycardia, jaw rigidity noted earlier, and mixed respiratory/metabolic acidosis.',
            decisionPrompt: 'Which interpretation should guide the next minute?',
            options: [
              {
                label: 'Assume light anesthesia until temperature exceeds 40 C',
                feedback: 'Waiting for late hyperthermia can delay treatment of a life-threatening hypermetabolic crisis.',
                safe: false,
              },
              {
                label: 'Treat as malignant hyperthermia while checking other causes of hypercarbia',
                feedback: 'Correct. The pattern is dangerous enough to trigger immediate MH response while the differential remains open.',
                safe: true,
              },
              {
                label: 'Reduce ventilation to avoid respiratory alkalosis',
                feedback: 'This worsens CO2 clearance when hypermetabolism is suspected.',
                safe: false,
              },
            ],
          },
        ],
      },
      {
        id: 'postoperative-delirium',
        title: 'PACU delirium risk',
        domainId: 'critical-care',
        difficulty: 'R4',
        estimatedMinutes: 7,
        unlockedAfter: 'malignant-hyperthermia',
        summary: 'Identify modifiable contributors to acute postoperative cognitive change.',
        exercises: [
          {
            id: 'delirium-matching',
            kind: 'matching',
            prompt: 'Match the PACU finding with a high-yield first response.',
            pairs: [
              { left: 'Hypoxemia', right: 'Restore oxygenation and evaluate ventilation/airway' },
              { left: 'Severe pain', right: 'Treat pain while limiting deliriogenic oversedation' },
              { left: 'Urinary retention', right: 'Evaluate bladder distention as a reversible trigger' },
            ],
            explanation:
              'Delirium prevention and response emphasize reversible physiologic stressors, medication review, and orientation support.',
          },
        ],
      },
    ],
  },
];

export const allNodes = curriculum.flatMap((domain) => domain.nodes);
