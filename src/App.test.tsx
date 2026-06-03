import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders the pre-anesthesia consultation workspace', () => {
    render(<App />);

    expect(screen.getByText('Hoja Preanestesica HOSGEDOPOL')).toBeInTheDocument();
    expect(screen.getByAltText('HOSGEDOPOL - Hospital General Docente de la Policia Nacional')).toBeInTheDocument();
    expect(screen.getByText('Hemograma y Quimica Util para Anestesia')).toBeInTheDocument();
    expect(screen.getByText('Tipificacion y reserva transfusional')).toBeInTheDocument();
    expect(screen.getByText('Serologias / examenes virales preoperatorios')).toBeInTheDocument();
    expect(screen.getByLabelText('VDRL / RPR')).toBeInTheDocument();
    expect(screen.getByLabelText('HBsAg')).toBeInTheDocument();
    expect(screen.getByLabelText('Anti-HCV / HVC')).toBeInTheDocument();
    expect(screen.getByText('Coagulacion y Sangrado')).toBeInTheDocument();
    expect(screen.getByText('Recomendaciones Personalizadas al Paciente')).toBeInTheDocument();
    expect(screen.getByText('Archivo de evaluaciones')).toBeInTheDocument();
    expect(screen.getByLabelText('Buscar evaluacion por nombre o HCN')).toBeInTheDocument();
    expect(screen.getByText('Otras comorbilidades')).toBeInTheDocument();
    expect(screen.getByText('Firma del anestesiologo')).toBeInTheDocument();
    expect(screen.getByText('Sello del anestesiologo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'PDF' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'DOC' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'JSON' })).toBeInTheDocument();
    expect(screen.queryByText('Ultimo solido')).not.toBeInTheDocument();
    expect(screen.queryByText('Ultimo liquido claro')).not.toBeInTheDocument();
  });

  it('flags clinically relevant anemia from hemoglobin input', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Hb g/dL'), { target: { value: '7.8' } });

    expect(screen.getByText('Anemia significativa')).toBeInTheDocument();
    expect(screen.getByText(/Hb 7.8 g\/dL/)).toBeInTheDocument();
    expect(screen.getByText(/Hb fuera de rango normal/)).toBeInTheDocument();
  });

  it('shows educational details for ASA and METs dropdowns', () => {
    render(<App />);

    expect(screen.getByRole('option', { name: 'ASA III - enfermedad severa con limitacion' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '<4 METs - baja capacidad funcional' })).toBeInTheDocument();
  });

  it('includes blood typing and personalized recommendations', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Grupo ABO'), { target: { value: 'O' } });
    fireEvent.change(screen.getByLabelText('Factor Rh'), { target: { value: 'Positivo' } });

    expect(screen.getByText(/Ayuno preoperatorio/)).toBeInTheDocument();
    expect(screen.getByText(/reservar sangre compatible/)).toHaveTextContent('O Rh+');
  });

  it('recommends follow-up for reactive viral screening', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('HBsAg'), { target: { value: 'Reactivo' } });

    expect(screen.getByText(/Serologias reactivas/)).toHaveTextContent('HBsAg');
  });

  it('auto-saves evaluations and filters them by HCN', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Nombre y apellido'), { target: { value: 'Juan Garcia' } });
    fireEvent.change(screen.getByLabelText('HCN'), { target: { value: 'HC-777' } });
    fireEvent.change(screen.getByLabelText('Buscar evaluacion por nombre o HCN'), { target: { value: '777' } });

    expect(screen.getByRole('button', { name: /Juan Garcia HCN HC-777/ })).toBeInTheDocument();
    expect(window.localStorage.getItem('preanes-consulta-v2-records')).toContain('Juan_Garcia_HCN-HC-777');
  });
});
