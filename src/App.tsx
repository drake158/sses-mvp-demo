import React from 'react';
import { Navbar } from './components/layout/Navbar';
import { RoleSelector } from './components/layout/RoleSelector';
import { AuditoriaView } from './components/roles/AuditoriaView';
import { EnteControlView } from './components/roles/EnteControlView';
import { FuncionarioMenView } from './components/roles/FuncionarioMenView';
import { TutorView } from './components/roles/TutorView';
import { useSses } from './context/SsesContext';

export const App: React.FC = () => {
  const { rolActivo, isReady } = useSses();

  if (!isReady) {
    return (
      <div className="min-h-screen bg-men-bg flex items-center justify-center p-6">
        <div className="gov-card p-6 text-center space-y-3 max-w-sm w-full">
          <div className="w-8 h-8 border-2 border-men-navy border-t-men-accent rounded-full animate-spin mx-auto" />
          <h2 className="text-base font-bold text-men-navy">
            Inicializando SSES
          </h2>
          <p className="text-xs text-[#64748B]">
            Cargando datos sintéticos de Colombia y verificando cadena génesis
            SHA-256...
          </p>
        </div>
      </div>
    );
  }

  if (!rolActivo) {
    return <RoleSelector />;
  }

  return (
    <div className="min-h-screen bg-men-bg flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {rolActivo === 'FUNCIONARIO_MEN' && <FuncionarioMenView />}
        {rolActivo === 'TUTOR' && <TutorView />}
        {rolActivo === 'ENTE_CONTROL' && <EnteControlView />}
        {rolActivo === 'OFICINA_TECNOLOGIA' && <AuditoriaView />}
      </main>
    </div>
  );
};
