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
    expect(screen.getByText('Coagulacion y Sangrado')).toBeInTheDocument();
    expect(screen.getByText('Recomendaciones Personalizadas al Paciente')).toBeInTheDocument();
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
});
