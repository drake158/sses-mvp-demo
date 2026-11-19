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
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6">
        <div className="sses-card px-8 py-6 text-center space-y-3">
          <div
            aria-hidden="true"
            className="w-6 h-6 border-2 border-[#E5E7EB] border-t-[#1E3A8A] rounded-full animate-spin mx-auto"
          />
          <p className="text-sm font-medium text-[#0F172A]">Cargando SSES</p>
        </div>
      </div>
    );
  }

  if (!rolActivo) {
    return <RoleSelector />;
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {rolActivo === 'FUNCIONARIO_MEN' && <FuncionarioMenView />}
        {rolActivo === 'TUTOR' && <TutorView />}
        {rolActivo === 'ENTE_CONTROL' && <EnteControlView />}
        {rolActivo === 'OFICINA_TECNOLOGIA' && <AuditoriaView />}
      </main>
    </div>
  );
};
