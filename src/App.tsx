import {
  Activity,
  AlertTriangle,
  CircleHelp,
  ClipboardCheck,
  Cloud,
  Download,
  FileText,
  HeartPulse,
  LogIn,
  LogOut,
  Printer,
  Save,
  ShieldAlert,
  Stethoscope,
  Syringe,
  UserRound,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import hospitalLogo from './assets/hosgedopol-logo.png';
import { CLOUD_TABLE, isSupabaseConfigured, supabase, type SupabaseUser } from './supabaseClient';

type AsaClass = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI';
type MetsClass = '<4' | '4-10' | '>10' | 'desconocido';
type AnesthesiaPlan = 'General' | 'Sedacion IV' | 'MAC' | 'Regional' | 'Neuroaxial' | 'Local + sedacion' | 'TIVA';
type FindingLevel = 'ok' | 'watch' | 'risk';
type WeightUnit = 'kg' | 'lb';
type HeightUnit = 'cm' | 'ft';
type BiologicalSex = 'No especificado' | 'Femenino' | 'Masculino' | 'Intersexual';
type ClearanceStatus = 'No requerido' | 'Pendiente' | 'Solicitado' | 'Recibido';
type ClearanceDepartment = 'cardiology' | 'pulmonology' | 'endocrinology';
type PendingCategory = 'Laboratorio' | 'Sangre' | 'Cardiologia' | 'Neumologia' | 'Endocrino' | 'Manual';
type PendingPriority = 'critica' | 'importante' | 'rutinaria';

type ClearanceState = {
  required: boolean;
  status: ClearanceStatus;
  date: string;
  ejectionFraction: string;
  echoSummary: string;
  ekgSummary: string;
  riskSummary: string;
  baselineSpo2: string;
  spirometrySummary: string;
  diagnosisSummary: string;
  hba1c: string;
  glucosePlan: string;
  thyroidSummary: string;
  recommendations: string;
};

type ClearanceMap = Record<ClearanceDepartment, ClearanceState>;

type FormState = {
  patientName: string;
  hcn: string;
  age: string;
  biologicalSex: BiologicalSex;
  weight: string;
  weightUnit: WeightUnit;
  height: string;
  heightUnit: HeightUnit;
  heightInches: string;
  procedure: string;
  surgeon: string;
  urgency: 'Electiva' | 'Urgente' | 'Emergencia';
  asa: AsaClass;
  emergencyAsa: boolean;
  mets: MetsClass;
  allergies: string;
  meds: string;
  anticoagulants: string;
  surgicalHistory: string;
  anestheticHistory: string;
  asthmaHistory: string;
  transfusionHistory: string;
  obstetricHistory: string;
  toxicHabits: string;
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
    aboGroup: string;
    rhFactor: string;
    antibodyScreen: string;
    vdrl: string;
    hbsAg: string;
    antiHbs: string;
    antiHcv: string;
    hiv: string;
  };
  clearances: ClearanceMap;
  manualPendingItems: string;
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

type PendingItem = {
  category: PendingCategory;
  priority: PendingPriority;
  title: string;
  detail: string;
  source: 'automatico' | 'manual';
};

type StoredEvaluation = FormState & {
  bmi?: string;
  weightKg?: string;
  heightCm?: string;
  bloodType?: string;
  comorbiditiesAll?: string[];
  findings?: Finding[];
  recommendations?: string[];
  savedAt?: string;
};

type CloudEvaluationRow = {
  created_at?: string;
  hcn?: string;
  id?: string;
  patient_name?: string;
  payload: Partial<StoredEvaluation>;
  record_key: string;
  updated_at?: string;
};

const STORAGE_KEY = 'preanes-consulta-v2-current';
const RECORDS_KEY = 'preanes-consulta-v2-records';

const emptyClearance: ClearanceState = {
  required: false,
  status: 'No requerido',
  date: '',
  ejectionFraction: '',
  echoSummary: '',
  ekgSummary: '',
  riskSummary: '',
  baselineSpo2: '',
  spirometrySummary: '',
  diagnosisSummary: '',
  hba1c: '',
  glucosePlan: '',
  thyroidSummary: '',
  recommendations: '',
};

const clearanceDefaults: ClearanceMap = {
  cardiology: { ...emptyClearance },
  pulmonology: { ...emptyClearance },
  endocrinology: { ...emptyClearance },
};

const initialForm: FormState = {
  patientName: '',
  hcn: '',
  age: '',
  biologicalSex: 'No especificado',
  weight: '',
  weightUnit: 'kg',
  height: '',
  heightUnit: 'cm',
  heightInches: '',
  procedure: '',
  surgeon: '',
  urgency: 'Electiva',
  asa: 'II',
  emergencyAsa: false,
  mets: 'desconocido',
  allergies: '',
  meds: '',
  anticoagulants: '',
  surgicalHistory: '',
  anestheticHistory: '',
  asthmaHistory: '',
  transfusionHistory: '',
  obstetricHistory: '',
  toxicHabits: '',
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
    aboGroup: '',
    rhFactor: '',
    antibodyScreen: '',
    vdrl: '',
    hbsAg: '',
    antiHbs: '',
    antiHcv: '',
    hiv: '',
  },
  clearances: clearanceDefaults,
  manualPendingItems: '',
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

const weightUnitOptions: SelectOption<WeightUnit>[] = [
  { value: 'kg', label: 'Kilogramos (kg)', help: 'Usar cuando la bascula reporte kg.' },
  { value: 'lb', label: 'Libras (lb)', help: 'Usar cuando la bascula reporte libras; la app convierte a kg automaticamente.' },
];

const heightUnitOptions: SelectOption<HeightUnit>[] = [
  { value: 'cm', label: 'Centimetros (cm)', help: 'Usar cuando la talla este medida en centimetros.' },
  { value: 'ft', label: 'Pies y pulgadas', help: 'Usar cuando el paciente reporte su estatura en pies; la app convierte a cm.' },
];

const biologicalSexOptions: SelectOption<BiologicalSex>[] = [
  { value: 'No especificado', label: 'No especificado', help: 'Usar temporalmente si aun no se ha documentado.' },
  { value: 'Femenino', label: 'Femenino', help: 'Activa evaluacion obstetrica/embarazo y consideraciones de anemia/peso segun contexto.' },
  { value: 'Masculino', label: 'Masculino', help: 'Oculta alertas obstetricas no aplicables.' },
  { value: 'Intersexual', label: 'Intersexual', help: 'Documentar anatomia, embarazo posible y preferencias con respeto clinico.' },
];

const aboOptions: SelectOption[] = [
  { value: '', label: 'Pendiente', help: 'Seleccionar si aun no se conoce la tipificacion.' },
  { value: 'O', label: 'O', help: 'Grupo O.' },
  { value: 'A', label: 'A', help: 'Grupo A.' },
  { value: 'B', label: 'B', help: 'Grupo B.' },
  { value: 'AB', label: 'AB', help: 'Grupo AB.' },
];

const rhOptions: SelectOption[] = [
  { value: '', label: 'Pendiente', help: 'Seleccionar si aun no se conoce el factor Rh.' },
  { value: 'Positivo', label: 'Rh positivo', help: 'Factor Rh positivo.' },
  { value: 'Negativo', label: 'Rh negativo', help: 'Factor Rh negativo.' },
];

const antibodyOptions: SelectOption[] = [
  { value: '', label: 'Pendiente / no realizado', help: 'Debe solicitarse si hay posibilidad de transfusion.' },
  { value: 'Negativo', label: 'Negativo', help: 'No se detectaron anticuerpos irregulares.' },
  { value: 'Positivo', label: 'Positivo', help: 'Avisar banco de sangre; puede requerir unidades especiales o mas tiempo.' },
  { value: 'No aplica', label: 'No aplica', help: 'Usar solo si el protocolo local no lo requiere para este caso.' },
];

const serologyOptions: SelectOption[] = [
  { value: '', label: 'Pendiente / no realizado', help: 'Solicitar o confirmar si el protocolo institucional lo requiere.' },
  { value: 'No reactivo', label: 'No reactivo', help: 'Resultado negativo/no reactivo.' },
  { value: 'Reactivo', label: 'Reactivo', help: 'Resultado positivo/reactivo; requiere confirmacion, documentacion y medidas de bioseguridad.' },
  { value: 'No aplica', label: 'No aplica', help: 'Usar solo si no corresponde segun protocolo local.' },
];

const clearanceStatusOptions: SelectOption<ClearanceStatus>[] = [
  { value: 'No requerido', label: 'No requerido', help: 'No se necesita apto de este departamento para el contexto actual.' },
  { value: 'Pendiente', label: 'Pendiente', help: 'Se necesita el apto o dato, pero aun no esta disponible.' },
  { value: 'Solicitado', label: 'Solicitado', help: 'El paciente fue referido o se solicito la evaluacion.' },
  { value: 'Recibido', label: 'Recibido', help: 'Apto recibido y documentado.' },
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
  age: 'Edad en anos. La app ajusta alertas para pediatria, adulto mayor y embarazo posible.',
  biologicalSex: 'Sexo biologico documentado para activar consideraciones obstetricas, embarazo posible y diferencias de riesgo.',
  weight: 'Peso reportado por la bascula. Puede registrarse en kg o lb; la app lo convierte a kg para IMC y reportes.',
  height: 'Talla reportada. Puede registrarse en cm o en pies/pulgadas; la app la convierte a cm para IMC y reportes.',
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
  surgicalHistory: 'Cirugias previas, fecha aproximada, complicaciones, sangrado, adherencias o reintervenciones. Sigue siendo relevante.',
  anestheticHistory: 'Anestesias previas, via aerea dificil, intubacion dificil, hipertermia maligna, PONV, alergias o despertar intraoperatorio. Muy relevante.',
  asthmaHistory: 'Asma actual o pasada, crisis recientes, hospitalizaciones, intubacion, uso de salbutamol/esteroides y desencadenantes. Relevante para broncoespasmo.',
  transfusionHistory: 'Transfusiones previas, reacciones, anticuerpos, rechazo religioso o dificultades de compatibilidad. Relevante para reserva y banco de sangre.',
  obstetricHistory: 'Gestas/partos/cesareas/abortos, embarazo posible, FUM si aplica, preeclampsia, hemorragia obstetrica o anestesia obstetrica previa.',
  toxicHabits: 'Tabaco, alcohol, cannabis, cocaina, opioides u otras sustancias. Cambian via aerea, respiracion, hemodinamia, analgesia y abstinencia.',
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
  aboGroup: 'Tipificacion ABO: grupo sanguineo A, B, AB u O. Es clave si existe posibilidad de transfusion.',
  rhFactor: 'Factor Rh: positivo o negativo. Debe estar claro antes de reservar sangre.',
  antibodyScreen: 'Pesquisa de anticuerpos irregulares: ayuda al banco de sangre a encontrar unidades compatibles.',
  vdrl: 'VDRL/RPR: tamizaje de sifilis. Un resultado reactivo debe confirmarse y manejarse segun protocolo.',
  hbsAg: 'HBsAg: antigeno de superficie de hepatitis B; indica infeccion activa o portador y requiere precauciones.',
  antiHbs: 'Anti-HBs: anticuerpo contra hepatitis B; orienta inmunidad por vacuna o infeccion previa.',
  antiHcv: 'Anti-HCV/HVC: tamizaje de hepatitis C; si es reactivo puede requerir confirmacion y proteccion del equipo.',
  hiv: 'VIH: tamizaje preoperatorio segun protocolo institucional y consentimiento/normativa local.',
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

function convertWeightToKg(weight: string, unit: WeightUnit) {
  const numericWeight = toNumber(weight);
  if (Number.isNaN(numericWeight)) return Number.NaN;
  return unit === 'lb' ? numericWeight / 2.2046226218 : numericWeight;
}

function getWeightKg(form: FormState) {
  const kg = convertWeightToKg(form.weight, form.weightUnit);
  if (Number.isNaN(kg)) return '';
  return kg.toFixed(1);
}

function convertHeightToCm(height: string, unit: HeightUnit, inches = '') {
  const numericHeight = toNumber(height);
  if (Number.isNaN(numericHeight)) return Number.NaN;
  if (unit === 'cm') return numericHeight;
  const numericInches = toNumber(inches);
  const totalInches = numericHeight * 12 + (Number.isNaN(numericInches) ? 0 : numericInches);
  return totalInches * 2.54;
}

function getHeightCm(form: FormState) {
  const cm = convertHeightToCm(form.height, form.heightUnit, form.heightInches);
  if (Number.isNaN(cm)) return '';
  return cm.toFixed(1);
}

function calculateBmi(weight: string, height: string, weightUnit: WeightUnit = 'kg', heightUnit: HeightUnit = 'cm', heightInches = '') {
  const kg = convertWeightToKg(weight, weightUnit);
  const cm = convertHeightToCm(height, heightUnit, heightInches);
  if (!kg || !cm) return '';
  return (kg / (cm / 100) ** 2).toFixed(1);
}

function getWeightAlert(form: FormState): FieldAlert | undefined {
  const kg = convertWeightToKg(form.weight, form.weightUnit);
  if (Number.isNaN(kg)) return undefined;
  if (kg < 30 || kg > 220) {
    return {
      level: 'risk',
      message: `Peso fuera de rango normal luego de convertir a kg (30-220 kg). Peso calculado: ${kg.toFixed(1)} kg.`,
    };
  }
  return undefined;
}

function getHeightAlert(form: FormState): FieldAlert | undefined {
  const cm = convertHeightToCm(form.height, form.heightUnit, form.heightInches);
  if (Number.isNaN(cm)) return undefined;
  if (cm < 120 || cm > 220) {
    return {
      level: 'risk',
      message: `Talla fuera de rango normal luego de convertir a cm (120-220 cm). Talla calculada: ${cm.toFixed(1)} cm.`,
    };
  }
  return undefined;
}

function getAllComorbidities(form: FormState) {
  const manual = form.manualComorbidities
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
  return [...form.comorbidities, ...manual];
}

function getAgeNumber(form: FormState) {
  return toNumber(form.age);
}

function isPediatric(form: FormState) {
  const age = getAgeNumber(form);
  return !Number.isNaN(age) && age < 16;
}

function isInfant(form: FormState) {
  const age = getAgeNumber(form);
  return !Number.isNaN(age) && age < 1;
}

function isOlderAdult(form: FormState) {
  const age = getAgeNumber(form);
  return !Number.isNaN(age) && age >= 65;
}

function isAdvancedAge(form: FormState) {
  const age = getAgeNumber(form);
  return !Number.isNaN(age) && age >= 80;
}

function canBePregnant(form: FormState) {
  const age = getAgeNumber(form);
  return (
    (form.biologicalSex === 'Femenino' || form.biologicalSex === 'Intersexual') &&
    !Number.isNaN(age) &&
    age >= 10 &&
    age <= 55
  );
}

function getAgeContextLabel(form: FormState) {
  if (isInfant(form)) return 'Lactante';
  if (isPediatric(form)) return 'Pediatrico';
  if (isAdvancedAge(form)) return 'Adulto mayor avanzado';
  if (isOlderAdult(form)) return 'Adulto mayor';
  return 'Adulto';
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
  const ageContext = getAgeContextLabel(form);

  if (isPediatric(form)) {
    findings.push({
      level: isInfant(form) ? 'risk' : 'watch',
      title: isInfant(form) ? 'Paciente lactante' : 'Paciente pediatrico',
      detail: `${ageContext}: ajustar dosis por peso, revisar ayuno pediatrico, via aerea proporcionalmente diferente, infeccion respiratoria reciente y presencia de tutor/consentimiento.`,
    });
  }

  if (isOlderAdult(form)) {
    findings.push({
      level: isAdvancedAge(form) ? 'risk' : 'watch',
      title: isAdvancedAge(form) ? 'Adulto mayor avanzado' : 'Adulto mayor',
      detail: `${ageContext}: valorar fragilidad, reserva cardiopulmonar, delirium postoperatorio, funcion renal, caidas, polifarmacia y apoyo postoperatorio.`,
    });
  }

  if (canBePregnant(form) && !form.obstetricHistory.trim() && !form.comorbidities.includes('Embarazo')) {
    findings.push({
      level: 'watch',
      title: 'Embarazo posible no documentado',
      detail: 'Paciente con sexo/edad compatible con embarazo. Documentar FUM, posibilidad de embarazo o prueba segun protocolo y consentimiento.',
    });
  }

  if (form.obstetricHistory.trim() || form.comorbidities.includes('Embarazo')) {
    findings.push({
      level: form.comorbidities.includes('Embarazo') ? 'risk' : 'watch',
      title: 'Antecedente obstetrico relevante',
      detail: 'Revisar embarazo actual/posible, preeclampsia, hemorragia obstetrica, cesareas previas y consideraciones de aspiracion/via aerea.',
    });
  }

  if (form.anestheticHistory.trim()) {
    const highRiskAnesthesiaTerms = ['via aerea dificil', 'intubacion dificil', 'hipertermia maligna', 'anafilaxia', 'paro', 'uci', 'despertar'];
    findings.push({
      level: textIncludesAny(form.anestheticHistory, highRiskAnesthesiaTerms) ? 'risk' : 'watch',
      title: 'Antecedente anestesico documentado',
      detail: 'Revisar anestesias previas, dificultad de via aerea, PONV, alergias, hipertermia maligna o eventos criticos antes de definir plan.',
    });
  }

  if (form.asthmaHistory.trim()) {
    const uncontrolledAsthmaTerms = ['crisis', 'hospitalizacion', 'intubacion', 'uci', 'esteroide', 'salbutamol diario', 'sibilancia'];
    findings.push({
      level: textIncludesAny(form.asthmaHistory, uncontrolledAsthmaTerms) ? 'risk' : 'watch',
      title: 'Antecedente asmatico',
      detail: 'Confirmar control actual, crisis recientes, uso de inhaladores, infeccion respiratoria y plan para prevenir broncoespasmo.',
    });
  }

  if (form.transfusionHistory.trim()) {
    const transfusionRiskTerms = ['reaccion', 'anticuerpo', 'anticuerpos', 'incompatible', 'rechaza', 'jehova', 'testigo'];
    findings.push({
      level: textIncludesAny(form.transfusionHistory, transfusionRiskTerms) ? 'risk' : 'watch',
      title: 'Antecedente transfusional',
      detail: 'Verificar reacciones, anticuerpos irregulares, compatibilidad y aceptacion/rechazo de hemoderivados antes de cirugia con sangrado.',
    });
  }

  if (form.toxicHabits.trim()) {
    const stimulantTerms = ['cocaina', 'anfetamina', 'crack'];
    findings.push({
      level: textIncludesAny(form.toxicHabits, stimulantTerms) ? 'risk' : 'watch',
      title: 'Habitos toxicos relevantes',
      detail: 'Tabaco/alcohol/drogas pueden cambiar via aerea, broncoespasmo, hemodinamia, analgesia, abstinencia e interacciones farmacologicas.',
    });
  }

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

function canAutoSave(form: FormState) {
  return Boolean(form.patientName.trim() || form.hcn.trim());
}

function getBloodTypeLabel(form: FormState) {
  if (!form.labs.aboGroup || !form.labs.rhFactor) return 'Tipificacion pendiente';
  return `${form.labs.aboGroup} ${form.labs.rhFactor === 'Positivo' ? 'Rh+' : 'Rh-'}`;
}

function getAlteredAnalytics(form: FormState) {
  const fields = [
    ['TA', form.vitals.bp, 'bp'],
    ['FC', form.vitals.hr, 'hr'],
    ['SpO2', form.vitals.spo2, 'spo2'],
    ['Glucemia', form.vitals.glucose, 'glucose'],
    ['Hb', form.labs.hb, 'hb'],
    ['Hto', form.labs.hct, 'hct'],
    ['Plaquetas', form.labs.platelets, 'platelets'],
    ['WBC', form.labs.wbc, 'wbc'],
    ['Neutrofilos absolutos', form.labs.neutrophils, 'neutrophils'],
    ['Creatinina', form.labs.creatinine, 'creatinine'],
    ['Potasio', form.labs.potassium, 'potassium'],
    ['Sodio', form.labs.sodium, 'sodium'],
    ['PT/TP', form.labs.pt, 'pt'],
    ['INR', form.labs.inr, 'inr'],
    ['aPTT', form.labs.aptt, 'aptt'],
    ['Fibrinogeno', form.labs.fibrinogen, 'fibrinogen'],
  ] as const;

  return fields.filter(([, value, key]) => Boolean(value && getFieldAlert(key, value))).map(([label]) => label);
}

function getPendingAnalytics(form: FormState) {
  const pending: string[] = [];
  if (!form.labs.hb || !form.labs.hct || !form.labs.platelets) pending.push('hemograma completo dirigido: Hb, Hto y plaquetas');
  if (!form.labs.aboGroup || !form.labs.rhFactor) pending.push('tipificacion ABO/Rh');
  if (!form.labs.antibodyScreen) pending.push('pesquisa de anticuerpos irregulares si existe posibilidad de transfusion');
  if (form.anticoagulants.trim() && (!form.labs.inr || !form.labs.aptt)) pending.push('coagulacion actualizada: INR y aPTT');
  if ((form.plan.includes('Neuroaxial') || form.plan.includes('Regional')) && (!form.labs.platelets || !form.labs.inr)) {
    pending.push('plaquetas e INR antes de tecnica regional/neuroaxial segun protocolo');
  }
  return pending;
}

function getPendingSerologies(form: FormState) {
  const serologies = [
    ['VDRL/RPR', form.labs.vdrl],
    ['HBsAg', form.labs.hbsAg],
    ['Anti-HBs/HVB', form.labs.antiHbs],
    ['Anti-HCV/HVC', form.labs.antiHcv],
    ['VIH', form.labs.hiv],
  ];
  return serologies.filter(([, value]) => !value).map(([label]) => label);
}

function getReactiveSerologies(form: FormState) {
  const serologies = [
    ['VDRL/RPR', form.labs.vdrl],
    ['HBsAg', form.labs.hbsAg],
    ['Anti-HCV/HVC', form.labs.antiHcv],
    ['VIH', form.labs.hiv],
  ];
  return serologies.filter(([, value]) => value === 'Reactivo').map(([label]) => label);
}

function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function textIncludesAny(value: string, terms: string[]) {
  const normalized = normalizeSearchText(value);
  return terms.some((term) => normalized.includes(normalizeSearchText(term)));
}

function getClinicalText(form: FormState) {
  return [
    ...getAllComorbidities(form),
    form.allergies,
    form.meds,
    form.anticoagulants,
    form.surgicalHistory,
    form.anestheticHistory,
    form.asthmaHistory,
    form.transfusionHistory,
    form.obstetricHistory,
    form.toxicHabits,
    form.procedure,
    form.postOpPain,
    form.notes,
  ].join(' ');
}

function getClearanceSuggestions(form: FormState): Record<ClearanceDepartment, string[]> {
  const suggestions: Record<ClearanceDepartment, string[]> = {
    cardiology: [],
    pulmonology: [],
    endocrinology: [],
  };
  const clinicalText = getClinicalText(form);
  const allComorbidities = getAllComorbidities(form).join(' ');
  const glucose = toNumber(form.vitals.glucose);
  const spo2 = toNumber(form.vitals.spo2);
  const cardiologyTerms = ['cardiopatia', 'arritmia', 'insuficiencia cardiaca', 'infarto', 'iam', 'angina', 'marcapasos', 'valvulopatia', 'soplo', 'dolor toracico'];
  const pulmonaryTerms = ['asma', 'epoc', 'apnea', 'disnea', 'oxigeno', 'broncoespasmo', 'neumonia', 'infeccion respiratoria'];
  const endocrineTerms = ['diabetes', 'insulina', 'hiperglucemia', 'hba1c', 'tiroides', 'hipertiroidismo', 'hipotiroidismo'];

  if (form.mets === '<4') {
    suggestions.cardiology.push('Capacidad funcional menor de 4 METs; correlacionar con riesgo cardiaco y magnitud quirurgica.');
  }
  if (isOlderAdult(form) && (form.mets === '<4' || form.asa === 'III' || form.asa === 'IV')) {
    suggestions.cardiology.push('Adulto mayor con baja reserva funcional o ASA elevado; no pedir eco rutinario, pero valorar ECG, sintomas y necesidad de cardiologia.');
  }
  if ((form.asa === 'III' || form.asa === 'IV') && textIncludesAny(allComorbidities, cardiologyTerms)) {
    suggestions.cardiology.push('ASA alto con comorbilidad cardiovascular registrada.');
  }
  if (getBpAlert(form.vitals.bp)) {
    suggestions.cardiology.push('Tension arterial fuera de parametros habituales; confirmar control cardiovascular.');
  }
  if (textIncludesAny(clinicalText, cardiologyTerms)) {
    suggestions.cardiology.push('Datos cardiovasculares descritos en antecedentes, procedimiento o notas.');
  }

  if (!Number.isNaN(spo2) && spo2 < 94) {
    suggestions.pulmonology.push('SpO2 basal menor de 94%; valorar reserva respiratoria y optimizacion.');
  }
  if (textIncludesAny(allComorbidities, pulmonaryTerms) || textIncludesAny(clinicalText, pulmonaryTerms)) {
    suggestions.pulmonology.push('Enfermedad o sintomas respiratorios registrados.');
  }
  if (form.asthmaHistory.trim()) {
    suggestions.pulmonology.push('Antecedente asmatico documentado; confirmar control actual y optimizacion broncodilatadora si hay sintomas o crisis recientes.');
  }

  if (form.comorbidities.includes('Diabetes') && !Number.isNaN(glucose) && glucose > 180) {
    suggestions.endocrinology.push('Diabetes con glucemia mayor de 180 mg/dL; definir manejo perioperatorio.');
  }
  if (textIncludesAny(allComorbidities, endocrineTerms) || textIncludesAny(clinicalText, endocrineTerms)) {
    suggestions.endocrinology.push('Comorbilidad endocrina o diabetologica registrada.');
  }

  return suggestions;
}

function getDepartmentLabel(department: ClearanceDepartment) {
  const labels: Record<ClearanceDepartment, string> = {
    cardiology: 'Cardiologia',
    pulmonology: 'Neumologia',
    endocrinology: 'Endocrino',
  };
  return labels[department];
}

function getPendingItems(formInput: FormState, findings: Finding[] = []): PendingItem[] {
  const form = normalizeForm(formInput);
  const items: PendingItem[] = [];
  const suggestions = getClearanceSuggestions(form);
  const altered = getAlteredAnalytics(form);

  getPendingAnalytics(form).forEach((detail) => {
    items.push({
      category: detail.includes('tipificacion') || detail.includes('anticuerpos') ? 'Sangre' : 'Laboratorio',
      priority: detail.includes('regional') || detail.includes('neuroaxial') ? 'importante' : 'rutinaria',
      title: 'Analitica pendiente',
      detail,
      source: 'automatico',
    });
  });

  getPendingSerologies(form).forEach((detail) => {
    items.push({
      category: 'Laboratorio',
      priority: 'rutinaria',
      title: 'Serologia pendiente',
      detail,
      source: 'automatico',
    });
  });

  getReactiveSerologies(form).forEach((detail) => {
    items.push({
      category: 'Laboratorio',
      priority: 'importante',
      title: 'Serologia reactiva',
      detail,
      source: 'automatico',
    });
  });

  if (canBePregnant(form) && !form.obstetricHistory.trim() && !form.comorbidities.includes('Embarazo')) {
    items.push({
      category: 'Laboratorio',
      priority: 'importante',
      title: 'Estado obstetrico pendiente',
      detail: 'Documentar FUM/posibilidad de embarazo o prueba segun protocolo institucional.',
      source: 'automatico',
    });
  }

  if (isPediatric(form) && (!form.weight || !form.height)) {
    items.push({
      category: 'Laboratorio',
      priority: 'importante',
      title: 'Datos pediatricos incompletos',
      detail: 'Peso y talla son obligatorios para dosis, IMC/estado nutricional y seleccion de equipo pediatrico.',
      source: 'automatico',
    });
  }

  if (isOlderAdult(form) && form.mets === '<4') {
    items.push({
      category: 'Cardiologia',
      priority: 'importante',
      title: 'Reserva funcional del adulto mayor',
      detail: 'Adulto mayor con METs <4: documentar sintomas cardiacos, ECG reciente y necesidad de cardiologia/eco segun hallazgos.',
      source: 'automatico',
    });
  }

  if (form.transfusionHistory.trim() && textIncludesAny(form.transfusionHistory, ['reaccion', 'anticuerpo', 'anticuerpos', 'rechaza', 'jehova', 'testigo'])) {
    items.push({
      category: 'Sangre',
      priority: 'importante',
      title: 'Banco de sangre especial',
      detail: 'Antecedente transfusional sensible: confirmar anticuerpos, compatibilidad o negativa a hemoderivados.',
      source: 'automatico',
    });
  }

  altered.forEach((detail) => {
    items.push({
      category: 'Laboratorio',
      priority: findings.some((finding) => finding.level === 'risk' && finding.detail.includes(detail)) ? 'critica' : 'importante',
      title: 'Parametro alterado',
      detail,
      source: 'automatico',
    });
  });

  (Object.keys(suggestions) as ClearanceDepartment[]).forEach((department) => {
    const clearance = form.clearances[department];
    const departmentLabel = getDepartmentLabel(department);
    const departmentCategory = departmentLabel as PendingCategory;
    if (suggestions[department].length && clearance.status !== 'Recibido') {
      items.push({
        category: departmentCategory,
        priority: department === 'cardiology' ? 'importante' : 'rutinaria',
        title: `Apto por ${departmentLabel} sugerido`,
        detail: suggestions[department][0],
        source: 'automatico',
      });
    }
    if (clearance.required && clearance.status !== 'Recibido') {
      items.push({
        category: departmentCategory,
        priority: 'importante',
        title: `Apto por ${departmentLabel} pendiente`,
        detail: `Estado actual: ${clearance.status}.`,
        source: 'automatico',
      });
    }
  });

  form.manualPendingItems
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((detail) => {
      items.push({
        category: 'Manual',
        priority: 'importante',
        title: 'Pendiente manual',
        detail,
        source: 'manual',
      });
    });

  return items.filter((item, index, all) => all.findIndex((other) => `${other.category}-${other.title}-${other.detail}` === `${item.category}-${item.title}-${item.detail}`) === index);
}

function getPriorityRank(priority: PendingPriority) {
  const ranks: Record<PendingPriority, number> = { critica: 0, importante: 1, rutinaria: 2 };
  return ranks[priority];
}

function getPrintValue(value: string) {
  return value.trim() || '--';
}

function getMetricClass(field: string, value: string) {
  return getFieldAlert(field, value) ? 'is-abnormal' : '';
}

function getSerologyClass(value: string) {
  return value === 'Reactivo' ? 'is-abnormal' : '';
}

function getRecommendations(form: FormState, findings: Finding[]) {
  const recommendations: string[] = [
    'Ayuno preoperatorio: mantener 8 horas para comida solida o comida grasa, 6 horas para comida ligera/leche no humana, 4 horas para leche materna y 2 horas para liquidos claros, salvo indicacion institucional diferente.',
    `Banco de sangre: reservar sangre compatible del mismo grupo y tipo (${getBloodTypeLabel(form)}). Confirmar disponibilidad antes de cirugia con riesgo de sangrado o si Hb/plaquetas estan alteradas.`,
  ];
  const altered = getAlteredAnalytics(form);
  const pending = getPendingAnalytics(form);
  const pendingSerologies = getPendingSerologies(form);
  const reactiveSerologies = getReactiveSerologies(form);
  const pendingItems = getPendingItems(form, findings);

  if (isPediatric(form)) {
    recommendations.push('Pediatria: verificar peso exacto del dia, tutor/consentimiento, ayuno pediatrico, infeccion respiratoria reciente, tamaño de equipo de via aerea y dosis por kg.');
  }
  if (isOlderAdult(form)) {
    recommendations.push('Adulto mayor: valorar fragilidad, delirium postoperatorio, funcion renal, polifarmacia, riesgo de caidas, apoyo familiar y destino postoperatorio.');
  }
  if (canBePregnant(form)) {
    recommendations.push('Sexo/edad compatible con embarazo: documentar FUM, posibilidad de embarazo o prueba segun protocolo y explicar riesgos materno-fetales si aplica.');
  }
  if (pending.length) recommendations.push(`Analiticas pendientes: ${pending.join('; ')}.`);
  if (pendingItems.some((item) => ['Cardiologia', 'Neumologia', 'Endocrino', 'Manual'].includes(item.category))) {
    recommendations.push(
      `Pendientes de seguimiento preoperatorio: ${pendingItems
        .filter((item) => ['Cardiologia', 'Neumologia', 'Endocrino', 'Manual'].includes(item.category))
        .slice(0, 5)
        .map((item) => `${item.category}: ${item.detail}`)
        .join('; ')}.`,
    );
  }
  if (pendingSerologies.length) recommendations.push(`Serologias/examenes virales pendientes segun protocolo: ${pendingSerologies.join(', ')}.`);
  if (reactiveSerologies.length) {
    recommendations.push(
      `Serologias reactivas que requieren confirmacion, documentacion y medidas de bioseguridad: ${reactiveSerologies.join(', ')}.`,
    );
  }
  if (altered.length) recommendations.push(`Analiticas o parametros alterados que requieren revision: ${altered.join(', ')}.`);
  if (findings.some((finding) => finding.title.includes('Anemia'))) {
    recommendations.push('Anemia: valorar optimizacion preoperatoria, reserva de hemoderivados y estrategia transfusional segun sangrado esperado.');
  }
  if (findings.some((finding) => finding.title.includes('Plaqueta'))) {
    recommendations.push('Plaquetas bajas: confirmar cifra reciente y evitar tecnicas neuroaxiales/regionales hasta cumplir criterios del protocolo local.');
  }
  if (form.anticoagulants.trim()) {
    recommendations.push('Anticoagulantes/antiagregantes: confirmar ultima dosis y ventana de suspension o reinicio antes de bloqueo, neuroaxial o cirugia con sangrado relevante.');
  }
  if (form.surgicalHistory.trim()) {
    recommendations.push('Antecedentes quirurgicos: revisar cirugias previas relacionadas con el sitio operatorio, sangrado, adherencias, complicaciones o reintervenciones.');
  }
  if (form.anestheticHistory.trim()) {
    recommendations.push('Antecedentes anestesicos: revisar detalles de via aerea, PONV, alergias, hipertermia maligna, despertares o eventos criticos antes de seleccionar tecnica.');
  }
  if (form.asthmaHistory.trim()) {
    recommendations.push('Asma: confirmar control, uso de inhaladores, crisis recientes, infeccion respiratoria y considerar broncodilatador preoperatorio si corresponde.');
  }
  if (form.transfusionHistory.trim()) {
    recommendations.push('Transfusion: coordinar banco de sangre si hubo reaccion, anticuerpos irregulares, transfusion dificil o negativa a hemoderivados.');
  }
  if (form.toxicHabits.trim()) {
    recommendations.push('Habitos toxicos: documentar ultima exposicion y anticipar broncoespasmo, abstinencia, interacciones, tolerancia analgesica o inestabilidad hemodinamica.');
  }
  if (form.mets === '<4') {
    recommendations.push('Capacidad funcional baja: correlacionar con riesgo cardiaco, sintomas activos y magnitud quirurgica antes de autorizar procedimiento electivo.');
  }
  if (form.airway.mallampati === 'III' || form.airway.mallampati === 'IV' || form.airway.neckMobility === 'Limitada') {
    recommendations.push('Via aerea: preparar plan de via aerea dificil, equipo alterno y personal de apoyo si se confirma dificultad.');
  }
  if (form.comorbidities.includes('Diabetes')) {
    recommendations.push('Diabetes: indicar manejo perioperatorio de hipoglucemiantes/insulina y control de glucemia el dia del procedimiento.');
  }
  if (form.comorbidities.includes('Apnea del sueno')) {
    recommendations.push('Apnea del sueno: llevar CPAP/BiPAP si lo usa y planificar vigilancia respiratoria postoperatoria.');
  }
  (Object.entries(form.clearances) as [ClearanceDepartment, ClearanceState][]).forEach(([department, clearance]) => {
    if (clearance.recommendations.trim()) {
      recommendations.push(`${getDepartmentLabel(department)}: ${clearance.recommendations.trim()}`);
    }
  });
  if (form.notes.trim()) recommendations.push(`Pendientes documentados por anestesiologia: ${form.notes.trim()}`);

  return recommendations;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function getReportPayload(form: FormState, bmi: string, findings: Finding[], recommendations: string[]) {
  return {
    ...form,
    bmi,
    weightKg: getWeightKg(form),
    heightCm: getHeightCm(form),
    findings,
    recommendations,
    comorbiditiesAll: getAllComorbidities(form),
    bloodType: getBloodTypeLabel(form),
  };
}

function readStoredRecords() {
  try {
    return JSON.parse(window.localStorage.getItem(RECORDS_KEY) || '{}') as Record<string, StoredEvaluation>;
  } catch {
    return {};
  }
}

function writeStoredRecords(records: Record<string, StoredEvaluation>) {
  window.localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

function buildStoredEvaluation(form: FormState, bmi: string, findings: Finding[], recommendations: string[]): StoredEvaluation {
  return {
    ...form,
    bmi,
    weightKg: getWeightKg(form),
    heightCm: getHeightCm(form),
    bloodType: getBloodTypeLabel(form),
    comorbiditiesAll: getAllComorbidities(form),
    findings,
    recommendations,
    savedAt: new Date().toISOString(),
  };
}

function normalizeStoredEvaluation(value?: Partial<StoredEvaluation>): StoredEvaluation {
  const normalized = normalizeForm(value);
  return {
    ...normalized,
    bmi: value?.bmi,
    bloodType: value?.bloodType,
    comorbiditiesAll: value?.comorbiditiesAll || getAllComorbidities(normalized),
    findings: value?.findings || getFindings(normalized),
    heightCm: value?.heightCm || getHeightCm(normalized),
    recommendations: value?.recommendations || getRecommendations(normalized, getFindings(normalized)),
    savedAt: value?.savedAt,
    weightKg: value?.weightKg || getWeightKg(normalized),
  };
}

function getRecordTimestamp(record?: StoredEvaluation) {
  if (!record?.savedAt) return 0;
  const timestamp = Date.parse(record.savedAt);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function mergeRecordMaps(
  localRecords: Record<string, StoredEvaluation>,
  cloudRecords: Record<string, StoredEvaluation>,
) {
  const merged = { ...localRecords };
  Object.entries(cloudRecords).forEach(([recordKey, cloudRecord]) => {
    const localRecord = merged[recordKey];
    if (!localRecord || getRecordTimestamp(cloudRecord) >= getRecordTimestamp(localRecord)) {
      merged[recordKey] = cloudRecord;
    }
  });
  return merged;
}

function cloudRowToRecord(row: CloudEvaluationRow): [string, StoredEvaluation] {
  const savedAt = row.payload.savedAt || row.updated_at || row.created_at || new Date().toISOString();
  return [
    row.record_key,
    normalizeStoredEvaluation({
      ...row.payload,
      hcn: row.payload.hcn || row.hcn || '',
      patientName: row.payload.patientName || row.patient_name || '',
      savedAt,
    }),
  ];
}

async function fetchCloudRecords() {
  if (!supabase) return {};
  const { data, error } = await supabase
    .from(CLOUD_TABLE)
    .select('id, record_key, patient_name, hcn, payload, created_at, updated_at')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return Object.fromEntries(((data || []) as CloudEvaluationRow[]).map(cloudRowToRecord));
}

async function upsertCloudRecord(recordKey: string, record: StoredEvaluation, user: SupabaseUser) {
  if (!supabase) return;
  const { error } = await supabase.from(CLOUD_TABLE).upsert(
    {
      evaluation_date: (record.savedAt || new Date().toISOString()).slice(0, 10),
      hcn: record.hcn || '',
      patient_name: record.patientName || '',
      payload: record,
      record_key: recordKey,
      user_id: user.id,
    },
    { onConflict: 'user_id,record_key' },
  );

  if (error) throw error;
}

function downloadJson(form: FormState, bmi: string, findings: Finding[], recommendations: string[]) {
  const blob = new Blob([JSON.stringify(getReportPayload(form, bmi, findings, recommendations), null, 2)], {
    type: 'application/json',
  });
  downloadBlob(blob, `${getRecordBaseName(form)}.json`);
}

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildDocHtml(form: FormState, bmi: string, findings: Finding[], recommendations: string[]) {
  const list = (items: string[]) => items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(getRecordBaseName(form))}</title>
  <style>body{font-family:Arial,sans-serif;color:#182329}h1,h2{color:#16496f}.box{border:1px solid #cfd8dc;padding:12px;margin:10px 0}.signature{margin-top:36px;display:flex;gap:48px}.line{border-top:1px solid #333;width:240px;padding-top:8px}</style>
  </head><body>
  <h1>Hoja Preanestesica HOSGEDOPOL</h1>
  <p><strong>Paciente:</strong> ${escapeHtml(form.patientName || 'Sin nombre')} | <strong>HCN:</strong> ${escapeHtml(form.hcn || '--')} | <strong>Edad:</strong> ${escapeHtml(form.age || '--')} | <strong>Sexo:</strong> ${escapeHtml(form.biologicalSex)} | <strong>Contexto:</strong> ${escapeHtml(getAgeContextLabel(form))}</p>
  <p><strong>Procedimiento:</strong> ${escapeHtml(form.procedure || 'Pendiente')} | <strong>ASA:</strong> ${escapeHtml(formatAsa(form))} | <strong>Peso:</strong> ${escapeHtml(getWeightKg(form) || '--')} kg | <strong>Talla:</strong> ${escapeHtml(getHeightCm(form) || '--')} cm | <strong>IMC:</strong> ${escapeHtml(bmi || '--')}</p>
  <div class="box"><h2>Antecedentes dirigidos</h2><p><strong>Quirurgicos:</strong> ${escapeHtml(form.surgicalHistory || '--')}</p><p><strong>Anestesicos:</strong> ${escapeHtml(form.anestheticHistory || '--')}</p><p><strong>Asma:</strong> ${escapeHtml(form.asthmaHistory || '--')}</p><p><strong>Transfusionales:</strong> ${escapeHtml(form.transfusionHistory || '--')}</p><p><strong>Obstetricos:</strong> ${escapeHtml(form.obstetricHistory || '--')}</p><p><strong>Habitos toxicos:</strong> ${escapeHtml(form.toxicHabits || '--')}</p></div>
  <div class="box"><h2>Laboratorios y tipificacion</h2><p>Hb ${escapeHtml(form.labs.hb || '--')} | Hto ${escapeHtml(form.labs.hct || '--')} | Plaquetas ${escapeHtml(form.labs.platelets || '--')} | Grupo ${escapeHtml(getBloodTypeLabel(form))} | Anticuerpos: ${escapeHtml(form.labs.antibodyScreen || '--')}</p></div>
  <div class="box"><h2>Serologias / examenes virales</h2><p>VDRL/RPR: ${escapeHtml(form.labs.vdrl || 'pendiente')} | HBsAg: ${escapeHtml(form.labs.hbsAg || 'pendiente')} | Anti-HBs/HVB: ${escapeHtml(form.labs.antiHbs || 'pendiente')} | Anti-HCV/HVC: ${escapeHtml(form.labs.antiHcv || 'pendiente')} | VIH: ${escapeHtml(form.labs.hiv || 'pendiente')}</p></div>
  <div class="box"><h2>Hallazgos relevantes</h2><ul>${list(findings.map((finding) => `${finding.title}: ${finding.detail}`))}</ul></div>
  <div class="box"><h2>Recomendaciones personalizadas</h2><ol>${list(recommendations)}</ol></div>
  <div class="signature"><div class="line">Firma del anestesiologo</div><div class="line">Sello del anestesiologo</div></div>
  </body></html>`;
}

function downloadDoc(form: FormState, bmi: string, findings: Finding[], recommendations: string[]) {
  const blob = new Blob([buildDocHtml(form, bmi, findings, recommendations)], { type: 'application/msword' });
  downloadBlob(blob, `${getRecordBaseName(form)}.doc`);
}

function normalizeClearances(clearances?: Partial<ClearanceMap>): ClearanceMap {
  return {
    cardiology: { ...emptyClearance, ...clearances?.cardiology },
    pulmonology: { ...emptyClearance, ...clearances?.pulmonology },
    endocrinology: { ...emptyClearance, ...clearances?.endocrinology },
  };
}

function normalizeForm(value?: Partial<FormState>): FormState {
  return {
    ...initialForm,
    ...value,
    airway: { ...initialForm.airway, ...value?.airway },
    vitals: { ...initialForm.vitals, ...value?.vitals },
    labs: { ...initialForm.labs, ...value?.labs },
    clearances: normalizeClearances(value?.clearances),
    plan: value?.plan?.length ? value.plan : initialForm.plan,
    comorbidities: value?.comorbidities || [],
    weightUnit: value?.weightUnit || 'kg',
    heightUnit: value?.heightUnit || 'cm',
    heightInches: value?.heightInches || '',
    biologicalSex: value?.biologicalSex || 'No especificado',
    surgicalHistory: value?.surgicalHistory || '',
    anestheticHistory: value?.anestheticHistory || '',
    asthmaHistory: value?.asthmaHistory || '',
    transfusionHistory: value?.transfusionHistory || '',
    obstetricHistory: value?.obstetricHistory || '',
    toxicHabits: value?.toxicHabits || '',
    manualPendingItems: value?.manualPendingItems || '',
  };
}

function loadStoredForm() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? normalizeForm(JSON.parse(stored)) : initialForm;
  } catch {
    return initialForm;
  }
}

export default function App() {
  const [route, setRoute] = useState(() => window.location.hash);
  const [form, setForm] = useState<FormState>(() => loadStoredForm());
  const [saveStatus, setSaveStatus] = useState('Guardado local activo');
  const [records, setRecords] = useState<Record<string, StoredEvaluation>>(() => readStoredRecords());
  const [activeRecordKey, setActiveRecordKey] = useState(() => (canAutoSave(loadStoredForm() as FormState) ? getRecordBaseName(loadStoredForm() as FormState) : ''));
  const [cloudUser, setCloudUser] = useState<SupabaseUser | null>(null);
  const [cloudEmail, setCloudEmail] = useState('');
  const [cloudPassword, setCloudPassword] = useState('');
  const [cloudStatus, setCloudStatus] = useState(
    isSupabaseConfigured ? 'Nube lista: inicia sesion para sincronizar' : 'Modo local: falta configurar Supabase',
  );
  const [cloudBusy, setCloudBusy] = useState(false);
  const findings = useMemo(() => getFindings(form), [form]);
  const bmi = useMemo(
    () => calculateBmi(form.weight, form.height, form.weightUnit, form.heightUnit, form.heightInches),
    [form.height, form.heightInches, form.heightUnit, form.weight, form.weightUnit],
  );
  const weightKg = useMemo(() => getWeightKg(form), [form.weight, form.weightUnit]);
  const heightCm = useMemo(() => getHeightCm(form), [form.height, form.heightInches, form.heightUnit]);
  const riskCount = findings.filter((finding) => finding.level === 'risk').length;
  const watchCount = findings.filter((finding) => finding.level === 'watch').length;
  const allComorbidities = useMemo(() => getAllComorbidities(form), [form]);
  const recommendations = useMemo(() => getRecommendations(form, findings), [form, findings]);
  const clearanceSuggestions = useMemo(() => getClearanceSuggestions(form), [form]);
  const pendingItems = useMemo(() => getPendingItems(form, findings), [findings, form]);
  const patientContext = useMemo(() => getAgeContextLabel(form), [form.age]);

  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  async function syncCloudRecords(user = cloudUser, options: { uploadLocal?: boolean } = {}) {
    if (!supabase || !user) {
      setRecords(readStoredRecords());
      return;
    }

    setCloudBusy(true);
    try {
      const localRecords = readStoredRecords();
      const cloudRecords = await fetchCloudRecords();
      const mergedRecords = mergeRecordMaps(localRecords, cloudRecords);
      writeStoredRecords(mergedRecords);
      setRecords(mergedRecords);

      if (options.uploadLocal) {
        await Promise.all(
          Object.entries(localRecords).map(([recordKey, record]) =>
            upsertCloudRecord(recordKey, record, user),
          ),
        );
      }

      setCloudStatus(`Nube sincronizada (${Object.keys(mergedRecords).length} evaluaciones)`);
    } catch (error) {
      setCloudStatus(`Error de nube: ${error instanceof Error ? error.message : 'no se pudo sincronizar'}`);
    } finally {
      setCloudBusy(false);
    }
  }

  useEffect(() => {
    if (!supabase) return;

    let isMounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      const user = data.session?.user || null;
      setCloudUser(user);
      setCloudStatus(user ? `Nube conectada: ${user.email || 'usuario autenticado'}` : 'Nube lista: inicia sesion para sincronizar');
      if (user) void syncCloudRecords(user, { uploadLocal: true });
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user || null;
      setCloudUser(user);
      setCloudStatus(user ? `Nube conectada: ${user.email || 'usuario autenticado'}` : 'Nube desconectada: guardado local activo');
      if (user) void syncCloudRecords(user, { uploadLocal: true });
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase || !cloudUser) return;

    const client = supabase;
    const channel = client
      .channel('anesthesia-evaluations-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: CLOUD_TABLE },
        () => void syncCloudRecords(cloudUser),
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [cloudUser]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    if (!canAutoSave(form)) return;

    const recordName = getRecordBaseName(form);
    const record = buildStoredEvaluation(form, bmi, findings, recommendations);
    const nextRecords = { ...readStoredRecords() };

    if (activeRecordKey && activeRecordKey !== recordName) {
      delete nextRecords[activeRecordKey];
    }

    nextRecords[recordName] = record;
    writeStoredRecords(nextRecords);
    setRecords(nextRecords);
    setActiveRecordKey(recordName);
    setSaveStatus(`Autoguardado como ${recordName}`);

    if (!supabase || !cloudUser) return;

    setCloudStatus(`Sincronizando ${recordName}...`);
    const syncTimer = window.setTimeout(() => {
      void upsertCloudRecord(recordName, record, cloudUser)
        .then(() => setCloudStatus(`Nube actualizada: ${recordName}`))
        .catch((error) => setCloudStatus(`Error de nube: ${error instanceof Error ? error.message : 'no se pudo guardar'}`));
    }, 900);

    return () => window.clearTimeout(syncTimer);
  }, [activeRecordKey, bmi, cloudUser, findings, form, recommendations]);

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

  function updateClearance(department: ClearanceDepartment, field: keyof ClearanceState, value: string | boolean) {
    setForm((current) => ({
      ...current,
      clearances: {
        ...current.clearances,
        [department]: {
          ...current.clearances[department],
          [field]: value,
          ...(field === 'required' && value === true && current.clearances[department].status === 'No requerido' ? { status: 'Pendiente' as ClearanceStatus } : {}),
          ...(field === 'required' && value === false ? { status: 'No requerido' as ClearanceStatus } : {}),
        },
      },
    }));
    setSaveStatus('Cambios sin guardar como registro');
  }

  async function handleCloudAuth(mode: 'signin' | 'signup') {
    if (!supabase) {
      setCloudStatus('Configura VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY para activar la nube');
      return;
    }

    if (!cloudEmail.trim() || !cloudPassword.trim()) {
      setCloudStatus('Escribe correo y clave para conectarte a la nube');
      return;
    }

    setCloudBusy(true);
    try {
      const authCall =
        mode === 'signin'
          ? supabase.auth.signInWithPassword({ email: cloudEmail.trim(), password: cloudPassword })
          : supabase.auth.signUp({ email: cloudEmail.trim(), password: cloudPassword });
      const { data, error } = await authCall;
      if (error) throw error;
      setCloudPassword('');
      setCloudStatus(
        mode === 'signup' && !data.session
          ? 'Cuenta creada: revisa el correo si Supabase pide confirmacion'
          : `Nube conectada: ${data.user?.email || cloudEmail.trim()}`,
      );
    } catch (error) {
      setCloudStatus(`Error de acceso: ${error instanceof Error ? error.message : 'no se pudo iniciar sesion'}`);
    } finally {
      setCloudBusy(false);
    }
  }

  async function handleCloudSignOut() {
    if (!supabase) return;
    setCloudBusy(true);
    try {
      await supabase.auth.signOut();
      setCloudUser(null);
      setCloudStatus('Nube desconectada: guardado local activo');
    } catch (error) {
      setCloudStatus(`Error al cerrar sesion: ${error instanceof Error ? error.message : 'intenta nuevamente'}`);
    } finally {
      setCloudBusy(false);
    }
  }

  async function refreshRecords() {
    if (cloudUser) {
      await syncCloudRecords(cloudUser);
      return;
    }
    setRecords(readStoredRecords());
  }

  function exportJson() {
    downloadJson(form, bmi, findings, recommendations);
  }

  function exportDoc() {
    downloadDoc(form, bmi, findings, recommendations);
  }

  function exportPdf() {
    window.print();
  }

  async function saveRecord() {
    const recordName = getRecordBaseName(form);
    const record = buildStoredEvaluation(form, bmi, findings, recommendations);
    const nextRecords = { ...readStoredRecords(), [recordName]: record };
    writeStoredRecords(nextRecords);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    setRecords(nextRecords);
    setActiveRecordKey(recordName);
    setSaveStatus(`Guardado como ${recordName}`);

    if (cloudUser) {
      setCloudStatus(`Sincronizando ${recordName}...`);
      try {
        await upsertCloudRecord(recordName, record, cloudUser);
        setCloudStatus(`Nube actualizada: ${recordName}`);
      } catch (error) {
        setCloudStatus(`Guardado local; error de nube: ${error instanceof Error ? error.message : 'no se pudo subir'}`);
      }
    }
  }

  function resetForm() {
    setForm(initialForm);
    setActiveRecordKey('');
    setSaveStatus('Formulario limpio');
  }

  function navigateTo(nextRoute: '' | '#pacientes' | '#pendientes') {
    window.location.hash = nextRoute;
    setRoute(nextRoute);
  }

  function loadFormAndNavigate(nextForm: Partial<FormState>, statusMessage = 'Evaluacion cargada') {
    const normalized = normalizeForm(nextForm);
    setForm(normalized);
    setActiveRecordKey(canAutoSave(normalized) ? getRecordBaseName(normalized) : '');
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    setSaveStatus(statusMessage);
    navigateTo('');
  }

  function startCleanEvaluation() {
    setForm(initialForm);
    setActiveRecordKey('');
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initialForm));
    setSaveStatus('Formulario limpio');
    navigateTo('');
  }

  if (route === '#pacientes') {
    return (
      <PatientsView
        cloudStatus={cloudStatus}
        loadForm={loadFormAndNavigate}
        navigateTo={navigateTo}
        records={records}
        refreshRecords={refreshRecords}
        startNew={startCleanEvaluation}
      />
    );
  }

  if (route === '#pendientes') {
    return (
      <PendingView
        cloudStatus={cloudStatus}
        loadForm={loadFormAndNavigate}
        navigateTo={navigateTo}
        records={records}
        refreshRecords={refreshRecords}
        startNew={startCleanEvaluation}
      />
    );
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
        <CloudSyncPanel
          busy={cloudBusy}
          email={cloudEmail}
          password={cloudPassword}
          status={cloudStatus}
          userEmail={cloudUser?.email || ''}
          onEmailChange={setCloudEmail}
          onPasswordChange={setCloudPassword}
          onRefresh={refreshRecords}
          onSignIn={() => void handleCloudAuth('signin')}
          onSignOut={() => void handleCloudSignOut()}
          onSignUp={() => void handleCloudAuth('signup')}
        />
        <div className="header-actions">
          <button type="button" onClick={() => navigateTo('')} title="Abrir una evaluacion nueva o continuar la actual">
            <ClipboardCheck size={17} />
            Nueva evaluacion
          </button>
          <button type="button" onClick={() => navigateTo('#pacientes')} title="Abrir archivo de pacientes dentro de la app">
            <UserRound size={17} />
            Pacientes
          </button>
          <button type="button" onClick={() => navigateTo('#pendientes')} title="Ver pacientes con pruebas o aptos pendientes">
            <AlertTriangle size={17} />
            Pendientes
          </button>
          <div className="export-menu">
            <Download size={17} />
            Exportar
            <div className="export-options">
              <button type="button" onClick={exportPdf} title="Abre el cuadro de impresion para guardar como PDF">
                PDF
              </button>
              <button type="button" onClick={exportDoc} title="Descarga un archivo DOC editable">
                DOC
              </button>
              <button type="button" onClick={exportJson} title="Descarga datos estructurados JSON">
                JSON
              </button>
            </div>
          </div>
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
          <small>{form.hcn ? `HCN ${form.hcn}` : 'HCN pendiente'} | {patientContext}</small>
        </div>
        <div>
          <span>Clasificacion</span>
          <strong>{formatAsa(form)}</strong>
          <small>{form.urgency}</small>
        </div>
        <div>
          <span>IMC</span>
          <strong>{bmi || '--'}</strong>
          <small>{weightKg && heightCm ? `${weightKg} kg / ${heightCm} cm` : 'Completar peso y talla'}</small>
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
            <SelectField
              help={helpText.biologicalSex}
              label="Sexo biologico"
              value={form.biologicalSex}
              options={biologicalSexOptions}
              onChange={(value) => updateField('biologicalSex', value as BiologicalSex)}
            />
            <TextField
              alert={getWeightAlert(form)}
              help={helpText.weight}
              label="Peso"
              value={form.weight}
              onChange={(value) => updateField('weight', value)}
            />
            <SelectField
              help="Selecciona la unidad que muestra la bascula. El sistema convierte todo a kg automaticamente."
              label="Unidad de peso"
              value={form.weightUnit}
              options={weightUnitOptions}
              onChange={(value) => updateField('weightUnit', value as WeightUnit)}
            />
            <TextField
              alert={getHeightAlert(form)}
              help={helpText.height}
              label="Talla"
              value={form.height}
              onChange={(value) => updateField('height', value)}
            />
            <SelectField
              help="Selecciona la unidad de estatura. Si eliges pies, completa pulgadas si aplica."
              label="Unidad de talla"
              value={form.heightUnit}
              options={heightUnitOptions}
              onChange={(value) => updateField('heightUnit', value as HeightUnit)}
            />
            {form.heightUnit === 'ft' ? (
              <TextField
                help="Pulgadas adicionales. Ejemplo: para 5 pies 7 pulgadas, escribe 5 en talla y 7 aqui."
                label="Pulgadas"
                value={form.heightInches}
                onChange={(value) => updateField('heightInches', value)}
              />
            ) : null}
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

        <section className="panel history-panel">
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
          <div className="subsection-title">Antecedentes dirigidos de anestesia</div>
          <div className="field-grid two">
            <TextArea help={helpText.surgicalHistory} label="Antecedentes quirurgicos" value={form.surgicalHistory} onChange={(value) => updateField('surgicalHistory', value)} />
            <TextArea help={helpText.anestheticHistory} label="Antecedentes anestesicos" value={form.anestheticHistory} onChange={(value) => updateField('anestheticHistory', value)} />
            <TextArea help={helpText.asthmaHistory} label="Antecedentes asmaticos" value={form.asthmaHistory} onChange={(value) => updateField('asthmaHistory', value)} />
            <TextArea help={helpText.transfusionHistory} label="Antecedentes transfusionales" value={form.transfusionHistory} onChange={(value) => updateField('transfusionHistory', value)} />
            {(form.biologicalSex === 'Femenino' || form.biologicalSex === 'Intersexual' || form.comorbidities.includes('Embarazo')) ? (
              <TextArea help={helpText.obstetricHistory} label="Antecedentes obstetricos" value={form.obstetricHistory} onChange={(value) => updateField('obstetricHistory', value)} />
            ) : null}
            <TextArea help={helpText.toxicHabits} label="Habitos toxicos" value={form.toxicHabits} onChange={(value) => updateField('toxicHabits', value)} />
          </div>
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
          <div className="subsection-title">Tipificacion y reserva transfusional</div>
          <div className="field-grid three">
            <SelectField
              help={helpText.aboGroup}
              label="Grupo ABO"
              value={form.labs.aboGroup}
              options={aboOptions}
              onChange={(value) => updateNested('labs', 'aboGroup', value)}
            />
            <SelectField
              help={helpText.rhFactor}
              label="Factor Rh"
              value={form.labs.rhFactor}
              options={rhOptions}
              onChange={(value) => updateNested('labs', 'rhFactor', value)}
            />
            <SelectField
              help={helpText.antibodyScreen}
              label="Anticuerpos irregulares"
              value={form.labs.antibodyScreen}
              options={antibodyOptions}
              onChange={(value) => updateNested('labs', 'antibodyScreen', value)}
            />
          </div>
          <div className="subsection-title">Serologias / examenes virales preoperatorios</div>
          <div className="field-grid five">
            <SelectField help={helpText.vdrl} label="VDRL / RPR" value={form.labs.vdrl} options={serologyOptions} onChange={(value) => updateNested('labs', 'vdrl', value)} />
            <SelectField help={helpText.hbsAg} label="HBsAg" value={form.labs.hbsAg} options={serologyOptions} onChange={(value) => updateNested('labs', 'hbsAg', value)} />
            <SelectField help={helpText.antiHbs} label="Anti-HBs / HVB" value={form.labs.antiHbs} options={serologyOptions} onChange={(value) => updateNested('labs', 'antiHbs', value)} />
            <SelectField help={helpText.antiHcv} label="Anti-HCV / HVC" value={form.labs.antiHcv} options={serologyOptions} onChange={(value) => updateNested('labs', 'antiHcv', value)} />
            <SelectField help={helpText.hiv} label="VIH" value={form.labs.hiv} options={serologyOptions} onChange={(value) => updateNested('labs', 'hiv', value)} />
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

        <section className="panel clearances-panel">
          <PanelTitle icon={<ClipboardCheck size={19} />} title="Aptos / Interconsultas" />
          <div className="clearance-grid">
            <ClearanceCard
              clearance={form.clearances.cardiology}
              department="cardiology"
              requiredLabel="Cardiologia requerida"
              suggestionLabel="Cardiologia sugerida"
              suggestions={clearanceSuggestions.cardiology}
              title="Cardiologia"
              onChange={updateClearance}
            >
              <TextField label="FEVI %" value={form.clearances.cardiology.ejectionFraction} onChange={(value) => updateClearance('cardiology', 'ejectionFraction', value)} />
              <TextArea label="Eco relevante" value={form.clearances.cardiology.echoSummary} onChange={(value) => updateClearance('cardiology', 'echoSummary', value)} />
              <TextArea label="EKG / riesgo cardiaco" value={form.clearances.cardiology.ekgSummary} onChange={(value) => updateClearance('cardiology', 'ekgSummary', value)} />
              <TextArea label="Recomendaciones cardiologia" value={form.clearances.cardiology.recommendations} onChange={(value) => updateClearance('cardiology', 'recommendations', value)} />
            </ClearanceCard>
            <ClearanceCard
              clearance={form.clearances.pulmonology}
              department="pulmonology"
              requiredLabel="Neumologia requerida"
              suggestionLabel="Neumologia sugerida"
              suggestions={clearanceSuggestions.pulmonology}
              title="Neumologia"
              onChange={updateClearance}
            >
              <TextField label="SpO2 basal neumologia" value={form.clearances.pulmonology.baselineSpo2} onChange={(value) => updateClearance('pulmonology', 'baselineSpo2', value)} />
              <TextArea label="Espirometria / funcion pulmonar" value={form.clearances.pulmonology.spirometrySummary} onChange={(value) => updateClearance('pulmonology', 'spirometrySummary', value)} />
              <TextArea label="Diagnostico respiratorio" value={form.clearances.pulmonology.diagnosisSummary} onChange={(value) => updateClearance('pulmonology', 'diagnosisSummary', value)} />
              <TextArea label="Recomendaciones neumologia" value={form.clearances.pulmonology.recommendations} onChange={(value) => updateClearance('pulmonology', 'recommendations', value)} />
            </ClearanceCard>
            <ClearanceCard
              clearance={form.clearances.endocrinology}
              department="endocrinology"
              requiredLabel="Endocrinologia requerida"
              suggestionLabel="Endocrinologia sugerida"
              suggestions={clearanceSuggestions.endocrinology}
              title="Endocrino / Diabetologia"
              onChange={updateClearance}
            >
              <TextField label="HbA1c %" value={form.clearances.endocrinology.hba1c} onChange={(value) => updateClearance('endocrinology', 'hba1c', value)} />
              <TextArea label="Plan glucemias / insulina" value={form.clearances.endocrinology.glucosePlan} onChange={(value) => updateClearance('endocrinology', 'glucosePlan', value)} />
              <TextArea label="Tiroides / endocrino relevante" value={form.clearances.endocrinology.thyroidSummary} onChange={(value) => updateClearance('endocrinology', 'thyroidSummary', value)} />
              <TextArea label="Recomendaciones endocrino" value={form.clearances.endocrinology.recommendations} onChange={(value) => updateClearance('endocrinology', 'recommendations', value)} />
            </ClearanceCard>
          </div>
          <TextArea
            help="Pendientes escritos por anestesiologia. Usa una linea por pendiente para que aparezcan en la pestaña Pendientes."
            label="Pendientes manuales"
            value={form.manualPendingItems}
            onChange={(value) => updateField('manualPendingItems', value)}
          />
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

        <section className="panel recommendations-panel">
          <PanelTitle icon={<ClipboardCheck size={19} />} title="Recomendaciones Personalizadas al Paciente" />
          <ol className="recommendation-list">
            {recommendations.map((recommendation) => (
              <li key={recommendation}>{recommendation}</li>
            ))}
          </ol>
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
          <div className="pending-mini-list">
            <strong>Pendientes activos</strong>
            {pendingItems.length ? (
              pendingItems.slice(0, 6).map((item) => (
                <span className={`pending-chip ${item.priority}`} key={`${item.category}-${item.title}-${item.detail}`}>
                  {item.category}: {item.title}
                </span>
              ))
            ) : (
              <span className="pending-chip ok">Sin pendientes activos calculados</span>
            )}
          </div>
          <div className="print-summary">
            <PanelTitle icon={<FileText size={18} />} title="Resumen" />
            <img alt="HOSGEDOPOL" className="print-logo" src={hospitalLogo} />
            <p>
              {form.patientName || 'Paciente'} | HCN {form.hcn || '--'} | {form.age || '--'} anos | {form.procedure || 'procedimiento pendiente'} | {formatAsa(form)}
            </p>
            <p>Plan: {form.plan.length ? form.plan.join(', ') : 'pendiente'}.</p>
            <p>Tipificacion: {getBloodTypeLabel(form)}. Anticuerpos: {form.labs.antibodyScreen || 'pendiente'}.</p>
            <p>
              Serologias: VDRL {form.labs.vdrl || 'pendiente'} | HBsAg {form.labs.hbsAg || 'pendiente'} | HVC{' '}
              {form.labs.antiHcv || 'pendiente'} | VIH {form.labs.hiv || 'pendiente'}.
            </p>
            <p>Comorbilidades: {allComorbidities.length ? allComorbidities.join(', ') : 'no registradas'}.</p>
          </div>
          <button className="save-button" type="button" onClick={saveRecord} title="Guarda este registro en el navegador con nombre y HCN">
            <Save size={17} />
            Guardar
          </button>
          <span className="save-status">{saveStatus}</span>
        </aside>
      </div>
      <footer className="signature-footer">
        <div>
          <span>Firma del anestesiologo</span>
        </div>
        <div>
          <span>Sello del anestesiologo</span>
        </div>
      </footer>
      <section className="print-report">
        <header className="print-report-header">
          <img alt="HOSGEDOPOL" src={hospitalLogo} />
          <div>
            <h1>Evaluacion Preanestesica</h1>
            <p>Hospital General Docente de la Policia Nacional</p>
          </div>
        </header>

        <div className="print-report-meta">
          <div><span>Paciente</span><strong>{form.patientName || 'Sin nombre'}</strong></div>
          <div><span>HCN</span><strong>{form.hcn || '--'}</strong></div>
          <div><span>Edad</span><strong>{form.age || '--'}</strong></div>
          <div><span>Sexo / contexto</span><strong>{form.biologicalSex} / {patientContext}</strong></div>
          <div><span>Peso</span><strong>{weightKg ? `${weightKg} kg` : '--'}</strong></div>
          <div><span>Talla</span><strong>{heightCm ? `${heightCm} cm` : '--'}</strong></div>
          <div><span>ASA</span><strong>{formatAsa(form)}</strong></div>
          <div><span>METs</span><strong>{form.mets}</strong></div>
          <div><span>IMC</span><strong>{bmi || '--'}</strong></div>
        </div>

        <PrintSection title="Procedimiento y Antecedentes">
          <PrintRow label="Procedimiento" value={form.procedure || 'Pendiente'} />
          <PrintRow label="Cirujano / servicio" value={form.surgeon || 'Pendiente'} />
          <PrintRow label="Urgencia" value={form.urgency} />
          <PrintRow label="Comorbilidades" value={allComorbidities.length ? allComorbidities.join(', ') : 'No registradas'} />
          <PrintRow label="Alergias" value={form.allergies || 'No registradas'} />
          <PrintRow label="Medicamentos" value={form.meds || 'No registrados'} />
          <PrintRow label="Anticoagulantes / antiagregantes" value={form.anticoagulants || 'No registrados'} />
        </PrintSection>

        <PrintSection title="Antecedentes Dirigidos">
          <PrintRow label="Quirurgicos" value={form.surgicalHistory || 'No registrados'} />
          <PrintRow label="Anestesicos" value={form.anestheticHistory || 'No registrados'} className={form.anestheticHistory ? 'is-abnormal' : ''} />
          <PrintRow label="Asmaticos" value={form.asthmaHistory || 'No registrados'} className={form.asthmaHistory ? 'is-abnormal' : ''} />
          <PrintRow label="Transfusionales" value={form.transfusionHistory || 'No registrados'} className={form.transfusionHistory ? 'is-abnormal' : ''} />
          <PrintRow label="Obstetricos" value={form.obstetricHistory || 'No aplica / no registrado'} className={form.obstetricHistory || canBePregnant(form) ? 'is-abnormal' : ''} />
          <PrintRow label="Habitos toxicos" value={form.toxicHabits || 'No registrados'} className={form.toxicHabits ? 'is-abnormal' : ''} />
        </PrintSection>

        <PrintSection title="Signos Vitales y Laboratorios">
          <PrintMetric field="bp" label="TA" value={form.vitals.bp} />
          <PrintMetric field="hr" label="FC" value={form.vitals.hr} />
          <PrintMetric field="spo2" label="SpO2" value={form.vitals.spo2} suffix="%" />
          <PrintMetric field="glucose" label="Glucemia" value={form.vitals.glucose} suffix="mg/dL" />
          <PrintMetric field="hb" label="Hb" value={form.labs.hb} suffix="g/dL" />
          <PrintMetric field="hct" label="Hto" value={form.labs.hct} suffix="%" />
          <PrintMetric field="platelets" label="Plaquetas" value={form.labs.platelets} suffix="x10^3/uL" />
          <PrintMetric field="wbc" label="WBC" value={form.labs.wbc} suffix="x10^3/uL" />
          <PrintMetric field="neutrophils" label="Neutrofilos abs." value={form.labs.neutrophils} />
          <PrintMetric field="creatinine" label="Creatinina" value={form.labs.creatinine} suffix="mg/dL" />
          <PrintMetric field="potassium" label="K" value={form.labs.potassium} suffix="mmol/L" />
          <PrintMetric field="sodium" label="Na" value={form.labs.sodium} suffix="mmol/L" />
        </PrintSection>

        <PrintSection title="Coagulacion, Tipificacion y Serologias">
          <PrintMetric field="pt" label="PT/TP" value={form.labs.pt} suffix="s" />
          <PrintMetric field="inr" label="INR" value={form.labs.inr} />
          <PrintMetric field="aptt" label="aPTT" value={form.labs.aptt} suffix="s" />
          <PrintMetric field="fibrinogen" label="Fibrinogeno" value={form.labs.fibrinogen} suffix="mg/dL" />
          <PrintRow label="Anti-Xa / DOAC" value={form.labs.antiXa || '--'} />
          <PrintRow label="Grupo y Rh" value={getBloodTypeLabel(form)} />
          <PrintRow label="Anticuerpos irregulares" value={form.labs.antibodyScreen || 'Pendiente'} className={form.labs.antibodyScreen === 'Positivo' ? 'is-abnormal' : ''} />
          <PrintRow label="VDRL/RPR" value={form.labs.vdrl || 'Pendiente'} className={getSerologyClass(form.labs.vdrl)} />
          <PrintRow label="HBsAg" value={form.labs.hbsAg || 'Pendiente'} className={getSerologyClass(form.labs.hbsAg)} />
          <PrintRow label="Anti-HBs/HVB" value={form.labs.antiHbs || 'Pendiente'} />
          <PrintRow label="Anti-HCV/HVC" value={form.labs.antiHcv || 'Pendiente'} className={getSerologyClass(form.labs.antiHcv)} />
          <PrintRow label="VIH" value={form.labs.hiv || 'Pendiente'} className={getSerologyClass(form.labs.hiv)} />
        </PrintSection>

        <PrintSection title="Aptos / Interconsultas">
          <PrintRow label="Cardiologia" value={`${form.clearances.cardiology.status}${form.clearances.cardiology.ejectionFraction ? ` | FEVI ${form.clearances.cardiology.ejectionFraction}%` : ''}`} />
          <PrintRow label="Eco / EKG" value={[form.clearances.cardiology.echoSummary, form.clearances.cardiology.ekgSummary].filter(Boolean).join(' | ') || 'Sin datos registrados'} />
          <PrintRow label="Neumologia" value={`${form.clearances.pulmonology.status}${form.clearances.pulmonology.baselineSpo2 ? ` | SpO2 basal ${form.clearances.pulmonology.baselineSpo2}%` : ''}`} />
          <PrintRow label="Endocrino / diabetologia" value={`${form.clearances.endocrinology.status}${form.clearances.endocrinology.hba1c ? ` | HbA1c ${form.clearances.endocrinology.hba1c}%` : ''}`} />
          <PrintRow label="Pendientes activos" value={pendingItems.length ? pendingItems.slice(0, 6).map((item) => `${item.category}: ${item.detail}`).join(' | ') : 'Sin pendientes activos calculados'} />
        </PrintSection>

        <PrintSection title="Via Aerea y Plan">
          <PrintRow label="Mallampati" value={form.airway.mallampati} className={form.airway.mallampati === 'III' || form.airway.mallampati === 'IV' ? 'is-abnormal' : ''} />
          <PrintMetric field="mouthOpening" label="Apertura oral" value={form.airway.mouthOpening} suffix="cm" />
          <PrintMetric field="thyromental" label="Tiromentoniana" value={form.airway.thyromental} suffix="cm" />
          <PrintRow label="Movilidad cervical" value={form.airway.neckMobility} className={form.airway.neckMobility === 'Limitada' ? 'is-abnormal' : ''} />
          <PrintRow label="Denticion" value={form.airway.teeth.length ? form.airway.teeth.join(', ') : 'Sin hallazgos registrados'} />
          <PrintRow label="Plan anestesico" value={form.plan.length ? form.plan.join(', ') : 'Pendiente'} />
          <PrintRow label="Analgesia postoperatoria" value={form.postOpPain || 'Pendiente'} />
        </PrintSection>

        <PrintTextSection title="Hallazgos Relevantes" items={findings.map((finding) => `${finding.title}: ${finding.detail}`)} />
        <PrintTextSection title="Recomendaciones Personalizadas" items={recommendations} ordered />
        <PrintSection title="Notas / Optimizacion Pendiente">
          <PrintRow label="Notas" value={form.notes || 'Sin notas adicionales'} />
        </PrintSection>

        <footer className="print-signature">
          <div><span>Firma del anestesiologo</span></div>
          <div><span>Sello del anestesiologo</span></div>
        </footer>
      </section>
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

function CloudSyncPanel({
  busy,
  email,
  onEmailChange,
  onPasswordChange,
  onRefresh,
  onSignIn,
  onSignOut,
  onSignUp,
  password,
  status,
  userEmail,
}: {
  busy: boolean;
  email: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onRefresh: () => void | Promise<void>;
  onSignIn: () => void;
  onSignOut: () => void;
  onSignUp: () => void;
  password: string;
  status: string;
  userEmail: string;
}) {
  return (
    <section className={`cloud-sync ${userEmail ? 'is-connected' : ''}`} aria-label="Sincronizacion en la nube">
      <div className="cloud-sync-title">
        <Cloud size={17} />
        <span>{userEmail ? 'Nube activa' : 'Supabase'}</span>
      </div>
      <p>{status}</p>
      {isSupabaseConfigured ? (
        userEmail ? (
          <div className="cloud-sync-actions">
            <button disabled={busy} type="button" onClick={() => void onRefresh()}>
              Actualizar
            </button>
            <button disabled={busy} type="button" onClick={onSignOut}>
              <LogOut size={15} />
              Salir
            </button>
          </div>
        ) : (
          <div className="cloud-login">
            <input
              aria-label="Correo Supabase"
              autoComplete="email"
              placeholder="correo"
              type="email"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
            />
            <input
              aria-label="Clave Supabase"
              autoComplete="current-password"
              placeholder="clave"
              type="password"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
            />
            <button disabled={busy} type="button" onClick={onSignIn}>
              <LogIn size={15} />
              Entrar
            </button>
            <button disabled={busy} type="button" onClick={onSignUp}>
              Crear cuenta
            </button>
          </div>
        )
      ) : (
        <small>Agrega las variables VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY para activar el guardado online.</small>
      )}
    </section>
  );
}

function PrintSection({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="print-section">
      <h2>{title}</h2>
      <div className="print-grid">{children}</div>
    </section>
  );
}

function PrintRow({ className = '', label, value }: { className?: string; label: string; value: string }) {
  return (
    <div className={`print-cell ${className}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PrintMetric({ field, label, suffix = '', value }: { field: string; label: string; suffix?: string; value: string }) {
  const display = getPrintValue(value);
  return (
    <PrintRow
      className={getMetricClass(field, value)}
      label={label}
      value={display === '--' || !suffix ? display : `${display} ${suffix}`}
    />
  );
}

function PrintTextSection({ items, ordered = false, title }: { items: string[]; ordered?: boolean; title: string }) {
  const ListTag = ordered ? 'ol' : 'ul';
  return (
    <section className="print-section">
      <h2>{title}</h2>
      <ListTag className="print-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ListTag>
    </section>
  );
}

function PatientsView({
  cloudStatus,
  loadForm,
  navigateTo,
  records,
  refreshRecords,
  startNew,
}: {
  cloudStatus: string;
  loadForm: (form: Partial<FormState>, statusMessage?: string) => void;
  navigateTo: (route: '' | '#pacientes' | '#pendientes') => void;
  records: Record<string, StoredEvaluation>;
  refreshRecords: () => void | Promise<void>;
  startNew: () => void;
}) {
  const [nameQuery, setNameQuery] = useState('');
  const [hcnQuery, setHcnQuery] = useState('');
  const [dateQuery, setDateQuery] = useState('');
  const sortedRecords = useMemo(
    () => Object.entries(records).sort(([, a], [, b]) => (b.savedAt || '').localeCompare(a.savedAt || '')),
    [records],
  );
  const filteredRecords = useMemo(() => {
    const name = nameQuery.trim().toLowerCase();
    const hcn = hcnQuery.trim().toLowerCase();
    return sortedRecords.filter(([, record]) => {
      const savedDate = record.savedAt ? record.savedAt.slice(0, 10) : '';
      const matchesName = !name || record.patientName.toLowerCase().includes(name);
      const matchesHcn = !hcn || record.hcn.toLowerCase().includes(hcn);
      const matchesDate = !dateQuery || savedDate === dateQuery;
      return matchesName && matchesHcn && matchesDate;
    });
  }, [dateQuery, hcnQuery, nameQuery, sortedRecords]);

  function openEvaluation(record: StoredEvaluation) {
    loadForm(record, `Evaluacion cargada: ${getRecordBaseName(normalizeForm(record))}`);
  }

  return (
    <main className="patients-page">
      <header className="patients-header">
        <div className="brand">
          <img alt="HOSGEDOPOL - Hospital General Docente de la Policia Nacional" className="hospital-logo" src={hospitalLogo} />
          <div>
            <strong>Pacientes</strong>
            <span>Archivo de evaluaciones preanestesicas</span>
          </div>
        </div>
        <div className="header-actions">
          <button type="button" onClick={() => navigateTo('')}>Nueva evaluacion</button>
          <button type="button" onClick={() => navigateTo('#pendientes')}>Pendientes</button>
          <button type="button" onClick={() => void refreshRecords()}>Actualizar</button>
          <button type="button" onClick={startNew}>Formulario limpio</button>
        </div>
      </header>
      <p className="cloud-page-status">{cloudStatus}</p>

      <section className="patients-toolbar">
        <label className="field">
          <FieldLabel label="Buscar por nombre" />
          <input aria-label="Buscar paciente por nombre" value={nameQuery} onChange={(event) => setNameQuery(event.target.value)} />
        </label>
        <label className="field">
          <FieldLabel label="Buscar por HCN" />
          <input aria-label="Buscar paciente por HCN" value={hcnQuery} onChange={(event) => setHcnQuery(event.target.value)} />
        </label>
        <label className="field">
          <FieldLabel label="Buscar por fecha" />
          <input aria-label="Buscar evaluacion por fecha" type="date" value={dateQuery} onChange={(event) => setDateQuery(event.target.value)} />
        </label>
      </section>

      <section className="patients-summary">
        <div><span>Total</span><strong>{Object.keys(records).length}</strong></div>
        <div><span>Resultados</span><strong>{filteredRecords.length}</strong></div>
        <div><span>Ultima evaluacion</span><strong>{sortedRecords[0]?.[1].savedAt ? new Date(sortedRecords[0][1].savedAt || '').toLocaleDateString() : '--'}</strong></div>
      </section>

      <section className="patients-list-section">
        <div className="patients-list-heading">
          <h1>Ultimas evaluaciones</h1>
          <p>Filtra por nombre, HCN o fecha. Haz clic en abrir para revisar o continuar una evaluacion.</p>
        </div>
        <div className="patients-table">
          {filteredRecords.length ? (
            filteredRecords.map(([recordKey, record]) => (
              <article className="patient-row" key={recordKey}>
                <div>
                  <strong>{record.patientName || 'Paciente sin nombre'}</strong>
                  <span>HCN {record.hcn || '--'}</span>
                </div>
                <div>
                  <span>Fecha</span>
                  <strong>{record.savedAt ? new Date(record.savedAt).toLocaleString() : '--'}</strong>
                </div>
                <div>
                  <span>ASA / Procedimiento</span>
                  <strong>{formatAsa(record)} | {record.procedure || 'Procedimiento pendiente'}</strong>
                </div>
                <div>
                  <span>Alertas</span>
                  <strong>{record.findings?.filter((finding) => finding.level === 'risk').length ?? 0} altas</strong>
                </div>
                <button type="button" onClick={() => openEvaluation(record)}>
                  Abrir evaluacion
                </button>
              </article>
            ))
          ) : (
            <p className="empty-records">No hay evaluaciones que coincidan con los filtros.</p>
          )}
        </div>
      </section>
    </main>
  );
}

function PendingView({
  cloudStatus,
  loadForm,
  navigateTo,
  records,
  refreshRecords,
  startNew,
}: {
  cloudStatus: string;
  loadForm: (form: Partial<FormState>, statusMessage?: string) => void;
  navigateTo: (route: '' | '#pacientes' | '#pendientes') => void;
  records: Record<string, StoredEvaluation>;
  refreshRecords: () => void | Promise<void>;
  startNew: () => void;
}) {
  const [nameQuery, setNameQuery] = useState('');
  const [hcnQuery, setHcnQuery] = useState('');
  const [categoryQuery, setCategoryQuery] = useState('');
  const [priorityQuery, setPriorityQuery] = useState('');
  const pendingRows = useMemo(() => {
    return Object.entries(records)
      .map(([recordKey, record]) => {
        const form = normalizeForm(record);
        const findings = getFindings(form);
        const pending = getPendingItems(form, findings);
        const highestPriority = pending.sort((a, b) => getPriorityRank(a.priority) - getPriorityRank(b.priority))[0]?.priority || 'rutinaria';
        return { findings, form, highestPriority, pending, recordKey, savedAt: record.savedAt || '' };
      })
      .filter((row) => row.pending.length)
      .sort((a, b) => getPriorityRank(a.highestPriority) - getPriorityRank(b.highestPriority) || b.savedAt.localeCompare(a.savedAt));
  }, [records]);
  const filteredRows = useMemo(() => {
    const name = nameQuery.trim().toLowerCase();
    const hcn = hcnQuery.trim().toLowerCase();
    return pendingRows.filter((row) => {
      const matchesName = !name || row.form.patientName.toLowerCase().includes(name);
      const matchesHcn = !hcn || row.form.hcn.toLowerCase().includes(hcn);
      const matchesCategory = !categoryQuery || row.pending.some((item) => item.category === categoryQuery);
      const matchesPriority = !priorityQuery || row.pending.some((item) => item.priority === priorityQuery);
      return matchesName && matchesHcn && matchesCategory && matchesPriority;
    });
  }, [categoryQuery, hcnQuery, nameQuery, pendingRows, priorityQuery]);

  return (
    <main className="patients-page">
      <header className="patients-header">
        <div className="brand">
          <img alt="HOSGEDOPOL - Hospital General Docente de la Policia Nacional" className="hospital-logo" src={hospitalLogo} />
          <div>
            <strong>Pendientes</strong>
            <span>Pacientes con pruebas, aptos o analiticas por completar</span>
          </div>
        </div>
        <div className="header-actions">
          <button type="button" onClick={startNew}>Nueva evaluacion</button>
          <button type="button" onClick={() => navigateTo('#pacientes')}>Pacientes</button>
          <button type="button" onClick={() => void refreshRecords()}>Actualizar</button>
        </div>
      </header>
      <p className="cloud-page-status">{cloudStatus}</p>

      <section className="patients-toolbar pending-toolbar">
        <label className="field">
          <FieldLabel label="Buscar por nombre" />
          <input aria-label="Buscar pendiente por nombre" value={nameQuery} onChange={(event) => setNameQuery(event.target.value)} />
        </label>
        <label className="field">
          <FieldLabel label="Buscar por HCN" />
          <input aria-label="Buscar pendiente por HCN" value={hcnQuery} onChange={(event) => setHcnQuery(event.target.value)} />
        </label>
        <label className="field">
          <FieldLabel label="Categoria" />
          <select aria-label="Filtrar pendientes por categoria" value={categoryQuery} onChange={(event) => setCategoryQuery(event.target.value)}>
            <option value="">Todas</option>
            <option value="Laboratorio">Laboratorio</option>
            <option value="Sangre">Sangre</option>
            <option value="Cardiologia">Cardiologia</option>
            <option value="Neumologia">Neumologia</option>
            <option value="Endocrino">Endocrino</option>
            <option value="Manual">Manual</option>
          </select>
        </label>
        <label className="field">
          <FieldLabel label="Prioridad" />
          <select aria-label="Filtrar pendientes por prioridad" value={priorityQuery} onChange={(event) => setPriorityQuery(event.target.value)}>
            <option value="">Todas</option>
            <option value="critica">Critica</option>
            <option value="importante">Importante</option>
            <option value="rutinaria">Rutinaria</option>
          </select>
        </label>
      </section>

      <section className="patients-summary">
        <div><span>Con pendientes</span><strong>{pendingRows.length}</strong></div>
        <div><span>Resultados</span><strong>{filteredRows.length}</strong></div>
        <div><span>Criticos</span><strong>{pendingRows.filter((row) => row.highestPriority === 'critica').length}</strong></div>
      </section>

      <section className="patients-list-section">
        <div className="patients-list-heading">
          <h1>Pacientes pendientes</h1>
          <p>Ordenados por prioridad. Abre la evaluacion para completar aptos, resultados o recomendaciones.</p>
        </div>
        <div className="patients-table">
          {filteredRows.length ? (
            filteredRows.map((row) => (
              <article className="patient-row pending-row" key={row.recordKey}>
                <div>
                  <strong>{row.form.patientName || 'Paciente sin nombre'}</strong>
                  <span>HCN {row.form.hcn || '--'}</span>
                </div>
                <div>
                  <span>Prioridad</span>
                  <strong className={`priority ${row.highestPriority}`}>{row.highestPriority}</strong>
                </div>
                <div className="pending-items-cell">
                  <span>Pendientes principales</span>
                  <strong>{row.pending.slice(0, 3).map((item) => item.title).join(' | ')}</strong>
                  <small>{row.pending.slice(0, 2).map((item) => `${item.category}: ${item.detail}`).join(' / ')}</small>
                </div>
                <div>
                  <span>Procedimiento</span>
                  <strong>{row.form.procedure || 'Pendiente'}</strong>
                </div>
                <button type="button" onClick={() => loadForm(row.form, `Evaluacion cargada: ${row.recordKey}`)}>
                  Abrir evaluacion
                </button>
              </article>
            ))
          ) : (
            <p className="empty-records">No hay pacientes con pendientes activos para esos filtros.</p>
          )}
        </div>
      </section>
    </main>
  );
}

function ClearanceCard({
  children,
  clearance,
  department,
  onChange,
  requiredLabel,
  suggestionLabel,
  suggestions,
  title,
}: {
  children: React.ReactNode;
  clearance: ClearanceState;
  department: ClearanceDepartment;
  onChange: (department: ClearanceDepartment, field: keyof ClearanceState, value: string | boolean) => void;
  requiredLabel: string;
  suggestionLabel: string;
  suggestions: string[];
  title: string;
}) {
  return (
    <article className={`clearance-card ${suggestions.length ? 'is-suggested' : ''}`}>
      <div className="clearance-card-header">
        <div>
          <strong>{title}</strong>
          {suggestions.length ? <span className="suggestion-badge">{suggestionLabel}</span> : <span className="suggestion-badge neutral">Sin alerta automatica</span>}
        </div>
        <label className="check-card compact">
          <input
            aria-label={requiredLabel}
            checked={clearance.required}
            type="checkbox"
            onChange={(event) => onChange(department, 'required', event.target.checked)}
          />
          <span>Requerido</span>
        </label>
      </div>
      {suggestions.length ? (
        <ul className="suggestion-list">
          {suggestions.map((suggestion) => (
            <li key={suggestion}>{suggestion}</li>
          ))}
        </ul>
      ) : null}
      <div className="field-grid two">
        <SelectField
          label={`Estado ${title}`}
          options={clearanceStatusOptions}
          value={clearance.status}
          onChange={(value) => onChange(department, 'status', value as ClearanceStatus)}
        />
        <TextField label={`Fecha apto ${title}`} type="date" value={clearance.date} onChange={(value) => onChange(department, 'date', value)} />
      </div>
      <div className="clearance-fields">{children}</div>
    </article>
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
            <input aria-label={option} checked={values.includes(option)} type="checkbox" onChange={() => onChange(option)} />
            <span>{option}</span>
            {optionHelp[option] ? <HelpButton text={optionHelp[option]} /> : null}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
