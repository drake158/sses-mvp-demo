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
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm px-6 py-5 text-center space-y-2 max-w-sm w-full">
          <div className="w-8 h-8 border-4 border-men-blue border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-sm font-bold text-men-navy">
            Inicializando SSES MVP Demo
          </div>
          <p className="text-xs text-slate-500">
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
