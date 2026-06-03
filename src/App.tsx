import {
  Activity,
  AlertTriangle,
  CircleHelp,
  ClipboardCheck,
  Download,
  FileText,
  HeartPulse,
  Printer,
  Save,
  ShieldAlert,
  Stethoscope,
  Syringe,
  UserRound,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import hospitalLogo from './assets/hosgedopol-logo.png';

type AsaClass = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI';
type MetsClass = '<4' | '4-10' | '>10' | 'desconocido';
type AnesthesiaPlan = 'General' | 'Sedacion IV' | 'MAC' | 'Regional' | 'Neuroaxial' | 'Local + sedacion' | 'TIVA';
type FindingLevel = 'ok' | 'watch' | 'risk';

type FormState = {
  patientName: string;
  hcn: string;
  age: string;
  weight: string;
  height: string;
  procedure: string;
  surgeon: string;
  urgency: 'Electiva' | 'Urgente' | 'Emergencia';
  asa: AsaClass;
  emergencyAsa: boolean;
  mets: MetsClass;
  allergies: string;
  meds: string;
  anticoagulants: string;
  comorbidities: string[];
  manualComorbidities: string;
  airway: {
    mallampati: 'I' | 'II' | 'III' | 'IV';
    mouthOpening: string;
    thyromental: string;
    neckMobility: 'Completa' | 'Limitada' | 'No evaluable';
    teeth: string[];
  };
  vitals: {
    bp: string;
    hr: string;
    spo2: string;
    glucose: string;
  };
  labs: {
    hb: string;
    hct: string;
    platelets: string;
    wbc: string;
    neutrophils: string;
    creatinine: string;
    potassium: string;
    sodium: string;
    pt: string;
    inr: string;
    aptt: string;
    fibrinogen: string;
    antiXa: string;
  };
  plan: AnesthesiaPlan[];
  postOpPain: string;
  notes: string;
};

type Finding = {
  level: FindingLevel;
  title: string;
  detail: string;
};

type SelectOption<T extends string = string> = {
  value: T;
  label: string;
  help?: string;
};

type FieldAlert = {
  level: FindingLevel;
  message: string;
};

const STORAGE_KEY = 'preanes-consulta-v2-current';
const RECORDS_KEY = 'preanes-consulta-v2-records';

const initialForm: FormState = {
  patientName: '',
  hcn: '',
  age: '',
  weight: '',
  height: '',
  procedure: '',
  surgeon: '',
  urgency: 'Electiva',
  asa: 'II',
  emergencyAsa: false,
  mets: 'desconocido',
  allergies: '',
  meds: '',
  anticoagulants: '',
  comorbidities: [],
  manualComorbidities: '',
  airway: {
    mallampati: 'II',
    mouthOpening: '',
    thyromental: '',
    neckMobility: 'Completa',
    teeth: [],
  },
  vitals: {
    bp: '',
    hr: '',
    spo2: '',
    glucose: '',
  },
  labs: {
    hb: '',
    hct: '',
    platelets: '',
    wbc: '',
    neutrophils: '',
    creatinine: '',
    potassium: '',
    sodium: '',
    pt: '',
    inr: '',
    aptt: '',
    fibrinogen: '',
    antiXa: '',
  },
  plan: ['General'],
  postOpPain: '',
  notes: '',
};

const asaOptions: SelectOption<AsaClass>[] = [
  { value: 'I', label: 'ASA I - paciente sano', help: 'Sin enfermedad sistemica. Ejemplo: adulto sano para cirugia menor.' },
  {
    value: 'II',
    label: 'ASA II - enfermedad leve controlada',
    help: 'Enfermedad sistemica leve sin limitacion funcional importante. Ejemplo: HTA controlada, asma leve, embarazo, obesidad moderada.',
  },
  {
    value: 'III',
    label: 'ASA III - enfermedad severa con limitacion',
    help: 'Enfermedad sistemica severa, pero no amenaza constante. Ejemplo: DM mal controlada, EPOC, ERC, angina estable, obesidad morbida.',
  },
  {
    value: 'IV',
    label: 'ASA IV - amenaza constante para la vida',
    help: 'Enfermedad severa que amenaza la vida. Ejemplo: IC descompensada, angina inestable, sepsis, falla renal avanzada no optimizada.',
  },
  {
    value: 'V',
    label: 'ASA V - moribundo, no sobreviviria sin cirugia',
    help: 'Paciente que probablemente no sobrevive 24 horas sin la intervencion. Ejemplo: ruptura de aneurisma, trauma masivo.',
  },
  { value: 'VI', label: 'ASA VI - donante de organos', help: 'Paciente con muerte cerebral declarado donante de organos.' },
];

const metsOptions: SelectOption<MetsClass>[] = [
  {
    value: '<4',
    label: '<4 METs - baja capacidad funcional',
    help: 'No puede subir un piso de escaleras o caminar cuesta arriba sin sintomas. Puede aumentar riesgo cardiopulmonar.',
  },
  {
    value: '4-10',
    label: '4-10 METs - funcionalidad aceptable',
    help: 'Puede subir escaleras, caminar rapido o hacer tareas domesticas moderadas sin disnea/dolor toracico.',
  },
  {
    value: '>10',
    label: '>10 METs - excelente capacidad',
    help: 'Puede correr, practicar deportes intensos o hacer ejercicio vigoroso sin sintomas.',
  },
  {
    value: 'desconocido',
    label: 'Desconocido - no se pudo estimar',
    help: 'Usa esta opcion si el paciente no camina por dolor, discapacidad, sedentarismo extremo o datos insuficientes.',
  },
];

const urgencyOptions: SelectOption<FormState['urgency']>[] = [
  { value: 'Electiva', label: 'Electiva', help: 'Puede programarse luego de optimizacion preoperatoria.' },
  { value: 'Urgente', label: 'Urgente', help: 'Debe realizarse pronto, pero permite alguna evaluacion u optimizacion breve.' },
  { value: 'Emergencia', label: 'Emergencia', help: 'No permite retraso significativo; marcar ASA E si corresponde.' },
];

const mallampatiOptions: SelectOption<FormState['airway']['mallampati']>[] = [
  { value: 'I', label: 'I - paladar, uvula y pilares visibles', help: 'Generalmente predice via aerea mas favorable.' },
  { value: 'II', label: 'II - paladar y parte de uvula visibles', help: 'Usual en consulta; interpretar junto con apertura oral, cuello y denticion.' },
  { value: 'III', label: 'III - solo paladar blando/base de uvula', help: 'Puede sugerir mayor dificultad de laringoscopia.' },
  { value: 'IV', label: 'IV - solo paladar duro visible', help: 'Alerta de via aerea potencialmente dificil.' },
];

const neckOptions: SelectOption<FormState['airway']['neckMobility']>[] = [
  { value: 'Completa', label: 'Completa', help: 'Flexion/extension cervical sin limitacion importante.' },
  { value: 'Limitada', label: 'Limitada', help: 'Puede dificultar alineacion para ventilacion o intubacion.' },
  { value: 'No evaluable', label: 'No evaluable', help: 'Usar si hay collar cervical, dolor intenso o imposibilidad de examinar.' },
];

const comorbidityOptions = [
  'HTA',
  'Cardiopatia / arritmia',
  'Insuficiencia cardiaca',
  'Asma / EPOC',
  'Apnea del sueno',
  'Diabetes',
  'ERC',
  'Hepatopatia',
  'ACV / convulsiones',
  'Reflujo / aspiracion',
  'Dolor cronico',
  'Embarazo',
];

const comorbidityHelp: Record<string, string> = {
  HTA: 'Hipertension: buscar control, crisis recientes, dano de organo blanco y medicamentos.',
  'Cardiopatia / arritmia': 'Incluye enfermedad coronaria, valvulopatias, FA, marcapasos o desfibrilador.',
  'Insuficiencia cardiaca': 'Pregunta por disnea, ortopnea, edema, FEVI y descompensaciones recientes.',
  'Asma / EPOC': 'Importa por broncoespasmo, infeccion reciente, uso de inhaladores y oxigeno basal.',
  'Apnea del sueno': 'Riesgo de obstruccion y depresion respiratoria; preguntar CPAP/BiPAP.',
  Diabetes: 'Revisar control, hipoglucemias, insulina/GLP-1/SGLT2 y complicaciones.',
  ERC: 'Enfermedad renal: afecta potasio, fluidos, farmacos y anticoagulantes.',
  Hepatopatia: 'Puede alterar coagulacion, metabolismo de farmacos, ascitis y riesgo de sangrado.',
  'ACV / convulsiones': 'Importa por deficits, anticonvulsivantes, aspiracion y fecha del evento.',
  'Reflujo / aspiracion': 'Aumenta riesgo de aspiracion; considerar severidad y sintomas activos.',
  'Dolor cronico': 'Puede implicar opioides, tolerancia, hiperalgesia o plan analgesico especial.',
  Embarazo: 'Modifica via aerea, aspiracion, farmacos, posicionamiento y monitoreo fetal segun edad gestacional.',
};

const toothOptions = ['Protesis', 'Coronas', 'Dientes flojos', 'Edentulo', 'Overbite'];
const toothHelp: Record<string, string> = {
  Protesis: 'Retirar o documentar protesis dental; puede afectar mascarilla/intubacion.',
  Coronas: 'Avisar riesgo de dano dental durante laringoscopia.',
  'Dientes flojos': 'Alerta importante: riesgo de avulsion o aspiracion.',
  Edentulo: 'Puede dificultar sello de mascarilla; protesis a veces ayuda durante preoxigenacion.',
  Overbite: 'Mordida prominente puede dificultar alineacion y laringoscopia.',
};

const planOptions: AnesthesiaPlan[] = ['General', 'Sedacion IV', 'MAC', 'Regional', 'Neuroaxial', 'Local + sedacion', 'TIVA'];
const planHelp: Record<string, string> = {
  General: 'Paciente inconsciente con control de via aerea segun necesidad.',
  'Sedacion IV': 'Sedacion titulada; evaluar via aerea, aspiracion y comorbilidades.',
  MAC: 'Monitored anesthesia care: anestesia vigilada con sedacion/analgesia y rescate si hace falta.',
  Regional: 'Bloqueo de nervio/plexo; revisar coagulacion, infeccion y consentimiento.',
  Neuroaxial: 'Raquidea/epidural; revisar anticoagulantes, plaquetas, INR/aPTT y contraindicaciones.',
  'Local + sedacion': 'Anestesia local por operador con apoyo sedativo si procede.',
  TIVA: 'Anestesia intravenosa total; util en algunos riesgos de nauseas o requerimientos especificos.',
};

const helpText = {
  patientName: 'Nombre y apellido del paciente. Se usa tambien para nombrar el archivo exportado.',
  hcn: 'Historia clinica numerica o codigo institucional. Se usa para guardar/exportar el registro.',
  age: 'Edad en anos. Extremos de edad cambian riesgo, farmacologia y reserva fisiologica.',
  weight: 'Peso en kg. Sirve para IMC, dosis, via aerea y riesgo de apnea/aspiracion.',
  height: 'Talla en cm. Junto con peso calcula IMC.',
  procedure: 'Procedimiento propuesto. La magnitud quirurgica cambia riesgo, sangrado y tecnica.',
  surgeon: 'Cirujano o servicio solicitante.',
  urgency: 'Indica si se puede optimizar antes de operar o si el tiempo es limitado.',
  asa: 'Clasificacion ASA: resume enfermedad sistemica y riesgo basal. No reemplaza juicio clinico.',
  emergencyAsa: 'La letra E se agrega si la cirugia es de emergencia.',
  mets: 'METs estiman capacidad funcional. Ayudan a inferir reserva cardiopulmonar.',
  bp: 'Presion arterial actual o reciente. Valores muy altos pueden requerir confirmacion u optimizacion.',
  hr: 'Frecuencia cardiaca. Taquicardia o bradicardia pueden reflejar dolor, arritmia, shock o medicacion.',
  spo2: 'Saturacion basal en aire ambiente si es posible. Baja saturacion cambia plan respiratorio.',
  glucose: 'Glucemia actual si diabetico o sintomatico. Hipoglucemia e hiperglucemia severa importan.',
  comorbidities: 'Marca problemas que cambian anestesia. Agrega manualmente lo que no aparezca.',
  manualComorbidities: 'Escribe comorbilidades no incluidas, separadas por coma o punto y coma.',
  allergies: 'Medicamentos, latex, alimentos o antisepticos y el tipo de reaccion.',
  meds: 'Medicamentos actuales, dosis relevantes y farmacos a suspender/continuar.',
  anticoagulants: 'Warfarina, DOACs, heparinas, aspirina, clopidogrel u otros; anota ultima dosis.',
  hb: 'Hemoglobina: estima anemia y necesidad de optimizacion/reserva si habra sangrado.',
  hct: 'Hematocrito: complemento de Hb para anemia/hemoconcentracion.',
  platelets: 'Plaquetas: clave para sangrado, cirugia mayor y seguridad regional/neuroaxial.',
  wbc: 'Leucocitos: orienta infeccion, inflamacion o inmunosupresion.',
  neutrophils: 'Neutrofilos absolutos: utiles si hay neutropenia o riesgo infeccioso.',
  creatinine: 'Creatinina: estima funcion renal para farmacos, fluidos y anticoagulantes.',
  potassium: 'Potasio: alteraciones importantes aumentan riesgo de arritmias.',
  sodium: 'Sodio: alteraciones severas pueden causar riesgo neurologico y cambios de fluidos.',
  pt: 'PT/TP: mide via extrinseca de coagulacion; se altera con warfarina, hepatopatia o deficit de vitamina K.',
  inr: 'INR: estandariza PT; clave para warfarina, sangrado y tecnicas neuroaxiales.',
  aptt: 'aPTT: mide via intrinseca; se prolonga con heparina o trastornos de coagulacion.',
  fibrinogen: 'Fibrinogeno: sustrato para formar coagulo; bajo valor importa en sangrado mayor/obstetricia.',
  antiXa: 'Anti-Xa o nivel DOAC: ayuda a estimar efecto anticoagulante residual cuando esta disponible.',
  mallampati: 'Explora visibilidad orofaringea. Es solo una pieza de la evaluacion de via aerea.',
  mouthOpening: 'Apertura oral baja puede dificultar laringoscopia, supragloticos o intubacion.',
  thyromental: 'Distancia tiromentoniana baja sugiere laringoscopia mas dificil.',
  neckMobility: 'Movilidad cervical limitada puede dificultar posicionamiento e intubacion.',
  teeth: 'Denticion vulnerable o protesis cambia riesgo dental y manejo de mascarilla/intubacion.',
  plan: 'Selecciona una o varias tecnicas posibles. Debe confirmarse con consentimiento y contexto.',
  postOpPain: 'Estrategia de analgesia postoperatoria: multimodal, bloqueos, opioides, rescate.',
  notes: 'Pendientes de optimizacion, interconsultas, estudios o decisiones compartidas.',
};

function toNumber(value: string) {
  const normalized = value.replace(',', '.').trim();
  return normalized === '' ? Number.NaN : Number(normalized);
}

function classifyLab(value: number, watchLow: number, riskLow: number, watchHigh?: number, riskHigh?: number): FindingLevel {
  if (Number.isNaN(value)) return 'ok';
  if (value <= riskLow || (riskHigh !== undefined && value >= riskHigh)) return 'risk';
  if (value <= watchLow || (watchHigh !== undefined && value >= watchHigh)) return 'watch';
  return 'ok';
}

function getNumericAlert(value: string, label: string, low: number, high: number, unit = ''): FieldAlert | undefined {
  const number = toNumber(value);
  if (Number.isNaN(number)) return undefined;
  if (number < low || number > high) {
    return {
      level: 'risk',
      message: `${label} fuera de rango normal (${low}-${high}${unit ? ` ${unit}` : ''}).`,
    };
  }
  return undefined;
}

function getBpAlert(value: string): FieldAlert | undefined {
  const match = value.match(/(\d{2,3})\s*\/\s*(\d{2,3})/);
  if (!match) return undefined;
  const systolic = Number(match[1]);
  const diastolic = Number(match[2]);
  if (systolic >= 180 || diastolic >= 110 || systolic < 90 || diastolic < 50) {
    return { level: 'risk', message: 'TA fuera de parametros habituales; confirmar y valorar optimizacion.' };
  }
  return undefined;
}

function getFieldAlert(field: string, value: string): FieldAlert | undefined {
  const alerts: Record<string, FieldAlert | undefined> = {
    age: getNumericAlert(value, 'Edad', 0, 100, 'anos'),
    weight: getNumericAlert(value, 'Peso', 30, 220, 'kg'),
    height: getNumericAlert(value, 'Talla', 120, 220, 'cm'),
    bp: getBpAlert(value),
    hr: getNumericAlert(value, 'FC', 50, 110, 'lpm'),
    spo2: getNumericAlert(value, 'SpO2', 94, 100, '%'),
    glucose: getNumericAlert(value, 'Glucemia', 70, 180, 'mg/dL'),
    hb: getNumericAlert(value, 'Hb', 10, 17, 'g/dL'),
    hct: getNumericAlert(value, 'Hto', 30, 52, '%'),
    platelets: getNumericAlert(value, 'Plaquetas', 100, 450, 'x10^3/uL'),
    wbc: getNumericAlert(value, 'WBC', 4, 12, 'x10^3/uL'),
    neutrophils: getNumericAlert(value, 'Neutrofilos', 1.5, 8, 'x10^3/uL'),
    creatinine: getNumericAlert(value, 'Creatinina', 0.5, 1.5, 'mg/dL'),
    potassium: getNumericAlert(value, 'Potasio', 3.5, 5.2, 'mmol/L'),
    sodium: getNumericAlert(value, 'Sodio', 135, 145, 'mmol/L'),
    pt: getNumericAlert(value, 'PT/TP', 11, 14.5, 's'),
    inr: getNumericAlert(value, 'INR', 0.8, 1.2),
    aptt: getNumericAlert(value, 'aPTT', 25, 40, 's'),
    fibrinogen: getNumericAlert(value, 'Fibrinogeno', 200, 400, 'mg/dL'),
    mouthOpening: getNumericAlert(value, 'Apertura oral', 3, 8, 'cm'),
    thyromental: getNumericAlert(value, 'Tiromentoniana', 6, 12, 'cm'),
  };
  return alerts[field];
}

function formatAsa(form: FormState) {
  return `ASA ${form.asa}${form.emergencyAsa ? 'E' : ''}`;
}

function calculateBmi(weight: string, height: string) {
  const kg = toNumber(weight);
  const cm = toNumber(height);
  if (!kg || !cm) return '';
  return (kg / (cm / 100) ** 2).toFixed(1);
}

function getAllComorbidities(form: FormState) {
  const manual = form.manualComorbidities
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
  return [...form.comorbidities, ...manual];
}

function getFindings(form: FormState): Finding[] {
  const findings: Finding[] = [];
  const hb = toNumber(form.labs.hb);
  const platelets = toNumber(form.labs.platelets);
  const wbc = toNumber(form.labs.wbc);
  const neutrophils = toNumber(form.labs.neutrophils);
  const inr = toNumber(form.labs.inr);
  const aptt = toNumber(form.labs.aptt);
  const fibrinogen = toNumber(form.labs.fibrinogen);
  const potassium = toNumber(form.labs.potassium);
  const creatinine = toNumber(form.labs.creatinine);
  const spo2 = toNumber(form.vitals.spo2);

  const hbLevel = classifyLab(hb, 10, 8);
  if (hbLevel !== 'ok') {
    findings.push({
      level: hbLevel,
      title: hbLevel === 'risk' ? 'Anemia significativa' : 'Anemia a vigilar',
      detail: `Hb ${form.labs.hb} g/dL. Considerar reserva, sangrado esperado, optimizacion y plan transfusional segun contexto.`,
    });
  }

  if (!Number.isNaN(platelets)) {
    if (platelets < 50) {
      findings.push({
        level: 'risk',
        title: 'Plaquetas < 50k',
        detail: 'Revisar riesgo de sangrado, indicacion quirurgica y seguridad de tecnicas regionales/neuroaxiales.',
      });
    } else if (platelets < 100) {
      findings.push({
        level: 'watch',
        title: 'Plaquetopenia',
        detail: 'Plaquetas por debajo de 100k. Confirmar tendencia, etiologia y procedimiento planeado.',
      });
    }
  }

  if (!Number.isNaN(wbc) && (wbc > 12 || wbc < 4)) {
    findings.push({
      level: wbc > 15 || wbc < 3 ? 'risk' : 'watch',
      title: 'Leucocitos fuera de rango',
      detail: `WBC ${form.labs.wbc} x10^3/uL. Correlacionar con fiebre, infeccion activa o inmunosupresion.`,
    });
  }

  if (!Number.isNaN(neutrophils) && neutrophils < 1.5) {
    findings.push({
      level: neutrophils < 1 ? 'risk' : 'watch',
      title: 'Neutropenia',
      detail: `Neutrofilos absolutos ${form.labs.neutrophils} x10^3/uL. Verificar riesgo infeccioso y necesidad de diferir.`,
    });
  }

  if (!Number.isNaN(inr) && inr > 1.4) {
    findings.push({
      level: inr >= 1.8 ? 'risk' : 'watch',
      title: 'INR elevado',
      detail: `INR ${form.labs.inr}. Revisar anticoagulantes, hepatopatia, sangrado esperado y tecnica anestesica.`,
    });
  }

  if (!Number.isNaN(aptt) && aptt > 40) {
    findings.push({
      level: aptt >= 60 ? 'risk' : 'watch',
      title: 'aPTT prolongado',
      detail: `aPTT ${form.labs.aptt} s. Confirmar heparina/alteracion de coagulacion antes de bloqueos o neuroaxial.`,
    });
  }

  if (!Number.isNaN(fibrinogen) && fibrinogen < 200) {
    findings.push({
      level: fibrinogen < 150 ? 'risk' : 'watch',
      title: 'Fibrinogeno bajo',
      detail: `Fibrinogeno ${form.labs.fibrinogen} mg/dL. Importante si se espera sangrado mayor u obstetricia.`,
    });
  }

  if (!Number.isNaN(potassium) && (potassium < 3.2 || potassium > 5.5)) {
    findings.push({
      level: potassium < 3 || potassium >= 6 ? 'risk' : 'watch',
      title: 'Potasio relevante',
      detail: `K ${form.labs.potassium} mmol/L. Valorar ECG, causa y correccion antes de anestesia.`,
    });
  }

  if (!Number.isNaN(creatinine) && creatinine > 1.5) {
    findings.push({
      level: creatinine > 2.5 ? 'risk' : 'watch',
      title: 'Funcion renal alterada',
      detail: `Creatinina ${form.labs.creatinine} mg/dL. Ajustar farmacos, fluidos y nefrotoxicos.`,
    });
  }

  if (!Number.isNaN(spo2) && spo2 < 94) {
    findings.push({
      level: spo2 < 90 ? 'risk' : 'watch',
      title: 'Saturacion basal baja',
      detail: `SpO2 ${form.vitals.spo2}%. Correlacionar con pulmonar/cardiaco y plan de oxigenacion.`,
    });
  }

  if (form.airway.mallampati === 'III' || form.airway.mallampati === 'IV' || form.airway.neckMobility === 'Limitada') {
    findings.push({
      level: form.airway.mallampati === 'IV' ? 'risk' : 'watch',
      title: 'Via aerea potencialmente dificil',
      detail: `Mallampati ${form.airway.mallampati}, movilidad cervical ${form.airway.neckMobility.toLowerCase()}. Preparar plan A/B/C.`,
    });
  }

  if (form.anticoagulants.trim()) {
    findings.push({
      level: 'watch',
      title: 'Anticoagulacion/antiagregacion registrada',
      detail: 'Verificar ultima dosis, funcion renal, indicacion y ventanas para regional/neuroaxial segun protocolo local.',
    });
  }

  if (form.mets === '<4') {
    findings.push({
      level: 'watch',
      title: 'Capacidad funcional baja',
      detail: 'Menos de 4 METs puede requerir correlacion con riesgo cardiaco y magnitud quirurgica.',
    });
  }

  if (findings.length === 0) {
    findings.push({
      level: 'ok',
      title: 'Sin alertas mayores capturadas',
      detail: 'Completar juicio clinico, examen fisico y politicas institucionales antes de proceder.',
    });
  }

  return findings;
}

function toggleListValue(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function sanitizeFilePart(value: string) {
  return value
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 80);
}

function getRecordBaseName(form: FormState) {
  const name = sanitizeFilePart(form.patientName) || 'Paciente';
  const hcn = sanitizeFilePart(form.hcn) || 'SinHCN';
  return `${name}_HCN-${hcn}`;
}

function downloadJson(form: FormState, bmi: string, findings: Finding[]) {
  const blob = new Blob([JSON.stringify({ ...form, bmi, findings, comorbiditiesAll: getAllComorbidities(form) }, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${getRecordBaseName(form)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function loadStoredForm() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? { ...initialForm, ...JSON.parse(stored) } : initialForm;
  } catch {
    return initialForm;
  }
}

export default function App() {
  const [form, setForm] = useState<FormState>(() => loadStoredForm());
  const [saveStatus, setSaveStatus] = useState('Guardado local activo');
  const findings = useMemo(() => getFindings(form), [form]);
  const bmi = useMemo(() => calculateBmi(form.weight, form.height), [form.weight, form.height]);
  const riskCount = findings.filter((finding) => finding.level === 'risk').length;
  const watchCount = findings.filter((finding) => finding.level === 'watch').length;
  const allComorbidities = useMemo(() => getAllComorbidities(form), [form]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  }, [form]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setSaveStatus('Cambios sin guardar como registro');
  }

  function updateNested<K extends 'airway' | 'vitals' | 'labs', F extends keyof FormState[K]>(
    section: K,
    field: F,
    value: FormState[K][F],
  ) {
    setForm((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }));
    setSaveStatus('Cambios sin guardar como registro');
  }

  function exportJson() {
    downloadJson(form, bmi, findings);
  }

  function saveRecord() {
    const recordName = getRecordBaseName(form);
    const savedAt = new Date().toISOString();
    const record = { ...form, bmi, findings, comorbiditiesAll: allComorbidities, savedAt };
    const storedRecords = JSON.parse(window.localStorage.getItem(RECORDS_KEY) || '{}') as Record<string, unknown>;
    window.localStorage.setItem(RECORDS_KEY, JSON.stringify({ ...storedRecords, [recordName]: record }));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    setSaveStatus(`Guardado como ${recordName}`);
  }

  function resetForm() {
    setForm(initialForm);
    setSaveStatus('Formulario limpio');
  }

  return (
    <main className="app">
      <header className="app-header">
        <div className="brand">
          <img alt="HOSGEDOPOL - Hospital General Docente de la Policia Nacional" className="hospital-logo" src={hospitalLogo} />
          <div>
            <strong>Hoja Preanestesica HOSGEDOPOL</strong>
            <span>Hospital General Docente de la Policia Nacional</span>
          </div>
        </div>
        <div className="header-actions">
          <button type="button" onClick={exportJson} title="Descarga un archivo JSON con nombre y HCN del paciente">
            <Download size={17} />
            Exportar
          </button>
          <button type="button" onClick={() => window.print()} title="Imprime o guarda en PDF el resumen visible">
            <Printer size={17} />
            Imprimir
          </button>
          <button className="quiet-action" type="button" onClick={resetForm} title="Borra el formulario actual">
            Limpiar
          </button>
        </div>
      </header>

      <section className="summary-band">
        <div>
          <span>Paciente</span>
          <strong>{form.patientName || 'Sin nombre'}</strong>
          <small>{form.hcn ? `HCN ${form.hcn}` : 'HCN pendiente'}</small>
        </div>
        <div>
          <span>Clasificacion</span>
          <strong>{formatAsa(form)}</strong>
          <small>{form.urgency}</small>
        </div>
        <div>
          <span>IMC</span>
          <strong>{bmi || '--'}</strong>
          <small>{form.weight && form.height ? `${form.weight} kg / ${form.height} cm` : 'Completar peso y talla'}</small>
        </div>
        <div>
          <span>Alertas</span>
          <strong>
            {riskCount} altas / {watchCount} vigilancia
          </strong>
          <small>Basado en datos capturados</small>
        </div>
      </section>

      <div className="workspace">
        <section className="panel patient-panel">
          <PanelTitle icon={<UserRound size={19} />} title="Paciente y Procedimiento" />
          <div className="field-grid three">
            <TextField help={helpText.patientName} label="Nombre y apellido" value={form.patientName} onChange={(value) => updateField('patientName', value)} />
            <TextField help={helpText.hcn} label="HCN" value={form.hcn} onChange={(value) => updateField('hcn', value)} />
            <TextField alert={getFieldAlert('age', form.age)} help={helpText.age} label="Edad" value={form.age} onChange={(value) => updateField('age', value)} />
            <TextField
              alert={getFieldAlert('weight', form.weight)}
              help={helpText.weight}
              label="Peso kg"
              value={form.weight}
              onChange={(value) => updateField('weight', value)}
            />
            <TextField
              alert={getFieldAlert('height', form.height)}
              help={helpText.height}
              label="Talla cm"
              value={form.height}
              onChange={(value) => updateField('height', value)}
            />
            <SelectField
              help={helpText.urgency}
              label="Urgencia"
              value={form.urgency}
              options={urgencyOptions}
              onChange={(value) => updateField('urgency', value as FormState['urgency'])}
            />
          </div>
          <div className="field-grid two">
            <TextField help={helpText.procedure} label="Procedimiento propuesto" value={form.procedure} onChange={(value) => updateField('procedure', value)} />
            <TextField help={helpText.surgeon} label="Cirujano / servicio" value={form.surgeon} onChange={(value) => updateField('surgeon', value)} />
          </div>
          <div className="field-grid three">
            <SelectField help={helpText.asa} label="ASA" value={form.asa} options={asaOptions} onChange={(value) => updateField('asa', value as AsaClass)} />
            <SelectField help={helpText.mets} label="METs" value={form.mets} options={metsOptions} onChange={(value) => updateField('mets', value as MetsClass)} />
            <label className="check-card compact" title={helpText.emergencyAsa}>
              <input checked={form.emergencyAsa} type="checkbox" onChange={(event) => updateField('emergencyAsa', event.target.checked)} />
              <span>Agregar E a ASA</span>
              <HelpButton text={helpText.emergencyAsa} />
            </label>
          </div>
        </section>

        <section className="panel">
          <PanelTitle icon={<HeartPulse size={19} />} title="Signos y Antecedentes" />
          <div className="field-grid four">
            <TextField
              alert={getFieldAlert('bp', form.vitals.bp)}
              help={helpText.bp}
              label="TA"
              value={form.vitals.bp}
              placeholder="120/70"
              onChange={(value) => updateNested('vitals', 'bp', value)}
            />
            <TextField
              alert={getFieldAlert('hr', form.vitals.hr)}
              help={helpText.hr}
              label="FC"
              value={form.vitals.hr}
              placeholder="lpm"
              onChange={(value) => updateNested('vitals', 'hr', value)}
            />
            <TextField
              alert={getFieldAlert('spo2', form.vitals.spo2)}
              help={helpText.spo2}
              label="SpO2 %"
              value={form.vitals.spo2}
              onChange={(value) => updateNested('vitals', 'spo2', value)}
            />
            <TextField
              alert={getFieldAlert('glucose', form.vitals.glucose)}
              help={helpText.glucose}
              label="Glucemia"
              value={form.vitals.glucose}
              placeholder="mg/dL"
              onChange={(value) => updateNested('vitals', 'glucose', value)}
            />
          </div>
          <CheckboxGroup
            help={helpText.comorbidities}
            optionHelp={comorbidityHelp}
            label="Comorbilidades relevantes"
            options={comorbidityOptions}
            values={form.comorbidities}
            onChange={(value) => updateField('comorbidities', toggleListValue(form.comorbidities, value))}
          />
          <TextField
            help={helpText.manualComorbidities}
            label="Otras comorbilidades"
            placeholder="Ej: hipotiroidismo, anemia falciforme, lupus"
            value={form.manualComorbidities}
            onChange={(value) => updateField('manualComorbidities', value)}
          />
          <div className="field-grid two">
            <TextArea help={helpText.allergies} label="Alergias" value={form.allergies} onChange={(value) => updateField('allergies', value)} />
            <TextArea help={helpText.meds} label="Medicamentos actuales" value={form.meds} onChange={(value) => updateField('meds', value)} />
          </div>
          <TextArea
            help={helpText.anticoagulants}
            label="Anticoagulantes / antiagregantes y ultima dosis"
            value={form.anticoagulants}
            onChange={(value) => updateField('anticoagulants', value)}
          />
        </section>

        <section className="panel">
          <PanelTitle icon={<Activity size={19} />} title="Hemograma y Quimica Util para Anestesia" />
          <div className="lab-note">
            <ClipboardCheck size={18} />
            <span>Captura solo lo que suele modificar riesgo, tecnica, transfusion, infeccion o ajuste farmacologico.</span>
          </div>
          <div className="field-grid four">
            <TextField alert={getFieldAlert('hb', form.labs.hb)} help={helpText.hb} label="Hb g/dL" value={form.labs.hb} onChange={(value) => updateNested('labs', 'hb', value)} />
            <TextField alert={getFieldAlert('hct', form.labs.hct)} help={helpText.hct} label="Hto %" value={form.labs.hct} onChange={(value) => updateNested('labs', 'hct', value)} />
            <TextField
              alert={getFieldAlert('platelets', form.labs.platelets)}
              help={helpText.platelets}
              label="Plaquetas x10^3/uL"
              value={form.labs.platelets}
              onChange={(value) => updateNested('labs', 'platelets', value)}
            />
            <TextField alert={getFieldAlert('wbc', form.labs.wbc)} help={helpText.wbc} label="WBC x10^3/uL" value={form.labs.wbc} onChange={(value) => updateNested('labs', 'wbc', value)} />
            <TextField
              alert={getFieldAlert('neutrophils', form.labs.neutrophils)}
              help={helpText.neutrophils}
              label="Neutrofilos abs."
              value={form.labs.neutrophils}
              onChange={(value) => updateNested('labs', 'neutrophils', value)}
            />
            <TextField
              alert={getFieldAlert('creatinine', form.labs.creatinine)}
              help={helpText.creatinine}
              label="Creatinina mg/dL"
              value={form.labs.creatinine}
              onChange={(value) => updateNested('labs', 'creatinine', value)}
            />
            <TextField alert={getFieldAlert('potassium', form.labs.potassium)} help={helpText.potassium} label="K mmol/L" value={form.labs.potassium} onChange={(value) => updateNested('labs', 'potassium', value)} />
            <TextField alert={getFieldAlert('sodium', form.labs.sodium)} help={helpText.sodium} label="Na mmol/L" value={form.labs.sodium} onChange={(value) => updateNested('labs', 'sodium', value)} />
          </div>
        </section>

        <section className="panel">
          <PanelTitle icon={<ShieldAlert size={19} />} title="Coagulacion y Sangrado" />
          <div className="field-grid five">
            <TextField alert={getFieldAlert('pt', form.labs.pt)} help={helpText.pt} label="TP / PT s" value={form.labs.pt} onChange={(value) => updateNested('labs', 'pt', value)} />
            <TextField alert={getFieldAlert('inr', form.labs.inr)} help={helpText.inr} label="INR" value={form.labs.inr} onChange={(value) => updateNested('labs', 'inr', value)} />
            <TextField alert={getFieldAlert('aptt', form.labs.aptt)} help={helpText.aptt} label="aPTT s" value={form.labs.aptt} onChange={(value) => updateNested('labs', 'aptt', value)} />
            <TextField
              alert={getFieldAlert('fibrinogen', form.labs.fibrinogen)}
              help={helpText.fibrinogen}
              label="Fibrinogeno mg/dL"
              value={form.labs.fibrinogen}
              onChange={(value) => updateNested('labs', 'fibrinogen', value)}
            />
            <TextField help={helpText.antiXa} label="Anti-Xa / nivel DOAC" value={form.labs.antiXa} onChange={(value) => updateNested('labs', 'antiXa', value)} />
          </div>
          <div className="coag-guidance">
            <span>Neuroaxial/regional</span>
            <p>Usa estos datos junto con ultima dosis, funcion renal, sangrado esperado y guias locales. La app solo senala valores que merecen revision.</p>
          </div>
        </section>

        <section className="panel">
          <PanelTitle icon={<Stethoscope size={19} />} title="Via Aerea y Plan" />
          <div className="field-grid four">
            <SelectField
              help={helpText.mallampati}
              label="Mallampati"
              value={form.airway.mallampati}
              options={mallampatiOptions}
              onChange={(value) => updateNested('airway', 'mallampati', value as FormState['airway']['mallampati'])}
            />
            <TextField
              alert={getFieldAlert('mouthOpening', form.airway.mouthOpening)}
              help={helpText.mouthOpening}
              label="Apertura oral cm"
              value={form.airway.mouthOpening}
              onChange={(value) => updateNested('airway', 'mouthOpening', value)}
            />
            <TextField
              alert={getFieldAlert('thyromental', form.airway.thyromental)}
              help={helpText.thyromental}
              label="Tiromentoniana cm"
              value={form.airway.thyromental}
              onChange={(value) => updateNested('airway', 'thyromental', value)}
            />
            <SelectField
              help={helpText.neckMobility}
              label="Movilidad cervical"
              value={form.airway.neckMobility}
              options={neckOptions}
              onChange={(value) => updateNested('airway', 'neckMobility', value as FormState['airway']['neckMobility'])}
            />
          </div>
          <CheckboxGroup
            help={helpText.teeth}
            optionHelp={toothHelp}
            label="Denticion"
            options={toothOptions}
            values={form.airway.teeth}
            onChange={(value) => updateNested('airway', 'teeth', toggleListValue(form.airway.teeth, value))}
          />
          <CheckboxGroup
            help={helpText.plan}
            optionHelp={planHelp}
            label="Plan anestesico"
            options={planOptions}
            values={form.plan}
            onChange={(value) => updateField('plan', toggleListValue(form.plan, value) as AnesthesiaPlan[])}
          />
          <div className="field-grid two">
            <TextArea help={helpText.postOpPain} label="Plan analgesico postoperatorio" value={form.postOpPain} onChange={(value) => updateField('postOpPain', value)} />
            <TextArea help={helpText.notes} label="Notas / optimizacion pendiente" value={form.notes} onChange={(value) => updateField('notes', value)} />
          </div>
        </section>

        <aside className="panel risk-panel">
          <PanelTitle icon={<AlertTriangle size={19} />} title="Hallazgos Relevantes" />
          <div className="finding-list">
            {findings.map((finding) => (
              <article className={`finding ${finding.level}`} key={`${finding.title}-${finding.detail}`}>
                <strong>{finding.title}</strong>
                <span>{finding.detail}</span>
              </article>
            ))}
          </div>
          <div className="print-summary">
            <PanelTitle icon={<FileText size={18} />} title="Resumen" />
            <img alt="HOSGEDOPOL" className="print-logo" src={hospitalLogo} />
            <p>
              {form.patientName || 'Paciente'} | HCN {form.hcn || '--'} | {form.age || '--'} anos | {form.procedure || 'procedimiento pendiente'} | {formatAsa(form)}
            </p>
            <p>Plan: {form.plan.length ? form.plan.join(', ') : 'pendiente'}.</p>
            <p>Comorbilidades: {allComorbidities.length ? allComorbidities.join(', ') : 'no registradas'}.</p>
          </div>
          <button className="save-button" type="button" onClick={saveRecord} title="Guarda este registro en el navegador con nombre y HCN">
            <Save size={17} />
            Guardar
          </button>
          <span className="save-status">{saveStatus}</span>
        </aside>
      </div>
    </main>
  );
}

function PanelTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="panel-title">
      {icon}
      <h2>{title}</h2>
    </div>
  );
}

function HelpButton({ text }: { text: string }) {
  return (
    <span className="help-wrap">
      <button aria-hidden="true" className="help-button" tabIndex={-1} type="button">
        <CircleHelp size={14} />
      </button>
      <span className="help-popover">{text}</span>
    </span>
  );
}

function FieldLabel({ help, label }: { help?: string; label: string }) {
  return (
    <span className="field-label">
      <span>{label}</span>
      {help ? <HelpButton text={help} /> : null}
    </span>
  );
}

function TextField({
  alert,
  help,
  label,
  onChange,
  placeholder,
  type = 'text',
  value,
}: {
  alert?: FieldAlert;
  help?: string;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  value: string;
}) {
  return (
    <label className={`field ${alert ? `is-alert ${alert.level}` : ''}`}>
      <FieldLabel help={help} label={label} />
      <input aria-label={label} placeholder={placeholder} type={type} value={value} onChange={(event) => onChange(event.target.value)} />
      {alert ? <span className="field-alert">{alert.message}</span> : null}
    </label>
  );
}

function TextArea({ help, label, onChange, value }: { help?: string; label: string; onChange: (value: string) => void; value: string }) {
  return (
    <label className="field">
      <FieldLabel help={help} label={label} />
      <textarea aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SelectField<T extends string>({
  help,
  label,
  onChange,
  options,
  value,
}: {
  help?: string;
  label: string;
  onChange: (value: string) => void;
  options: SelectOption<T>[];
  value: string;
}) {
  return (
    <label className="field">
      <FieldLabel help={help} label={label} />
      <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} title={option.help} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function CheckboxGroup({
  help,
  label,
  onChange,
  optionHelp = {},
  options,
  values,
}: {
  help?: string;
  label: string;
  onChange: (value: string) => void;
  optionHelp?: Record<string, string>;
  options: string[];
  values: string[];
}) {
  return (
    <fieldset className="check-group">
      <legend>
        <FieldLabel help={help} label={label} />
      </legend>
      <div>
        {options.map((option) => (
          <label className="check-card" key={option} title={optionHelp[option]}>
            <input checked={values.includes(option)} type="checkbox" onChange={() => onChange(option)} />
            <span>{option}</span>
            {optionHelp[option] ? <HelpButton text={optionHelp[option]} /> : null}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
