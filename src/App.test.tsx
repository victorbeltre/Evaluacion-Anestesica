import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState(null, '', '/');
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
    expect(screen.getByRole('button', { name: /Pacientes/ })).toBeInTheDocument();
    expect(screen.queryByText('Archivo de evaluaciones')).not.toBeInTheDocument();
    expect(screen.getByText('Otras comorbilidades')).toBeInTheDocument();
    expect(screen.getAllByText('Firma del anestesiologo')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Sello del anestesiologo')[0]).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.getByText('DOC')).toBeInTheDocument();
    expect(screen.getByText('JSON')).toBeInTheDocument();
    expect(screen.queryByText('Ultimo solido')).not.toBeInTheDocument();
    expect(screen.queryByText('Ultimo liquido claro')).not.toBeInTheDocument();
  }, 10000);

  it('flags clinically relevant anemia from hemoglobin input', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Hb g/dL'), { target: { value: '7.8' } });

    expect(screen.getByText('Anemia significativa')).toBeInTheDocument();
    expect(screen.getAllByText(/Hb 7.8 g\/dL/).length).toBeGreaterThanOrEqual(1);
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

    expect(screen.getAllByText(/Ayuno preoperatorio/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/reservar sangre compatible/)[0]).toHaveTextContent('O Rh+');
  });

  it('recommends follow-up for reactive viral screening', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('HBsAg'), { target: { value: 'Reactivo' } });

    expect(screen.getAllByText(/Serologias reactivas/)[0]).toHaveTextContent('HBsAg');
  });

  it('auto-saves evaluations without showing the archive on the form page', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Nombre y apellido'), { target: { value: 'Juan Garcia' } });
    fireEvent.change(screen.getByLabelText('HCN'), { target: { value: 'HC-777' } });

    expect(screen.queryByRole('button', { name: /Juan Garcia HCN HC-777/ })).not.toBeInTheDocument();
    expect(window.localStorage.getItem('preanes-consulta-v2-records')).toContain('Juan_Garcia_HCN-HC-777');
  });

  it('shows a separate patients view with filters by name, HCN, and date', () => {
    window.localStorage.setItem(
      'preanes-consulta-v2-records',
      JSON.stringify({
        'Ana_Rodriguez_HCN-999': {
          patientName: 'Ana Rodriguez',
          hcn: '999',
          asa: 'II',
          emergencyAsa: false,
          procedure: 'Colecistectomia',
          savedAt: '2026-06-03T10:15:00.000Z',
          findings: [{ level: 'risk', title: 'Anemia significativa', detail: 'Hb baja' }],
        },
      }),
    );
    window.history.replaceState(null, '', '/#pacientes');

    render(<App />);

    expect(screen.getByText('Pacientes')).toBeInTheDocument();
    expect(screen.getByText('Ultimas evaluaciones')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Buscar paciente por HCN'), { target: { value: '999' } });
    fireEvent.change(screen.getByLabelText('Buscar evaluacion por fecha'), { target: { value: '2026-06-03' } });

    expect(screen.getByText('Ana Rodriguez')).toBeInTheDocument();
    expect(screen.getByText(/Colecistectomia/)).toBeInTheDocument();
  });

  it('renders a formal print report with abnormal values emphasized', () => {
    const { container } = render(<App />);

    fireEvent.change(screen.getByLabelText('Hb g/dL'), { target: { value: '7.2' } });
    fireEvent.change(screen.getByLabelText('HBsAg'), { target: { value: 'Reactivo' } });

    expect(container.querySelector('.print-report')).toBeInTheDocument();
    expect(container.querySelectorAll('.print-report .is-abnormal').length).toBeGreaterThanOrEqual(2);
  });
});
