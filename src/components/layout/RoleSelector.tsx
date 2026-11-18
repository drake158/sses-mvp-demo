import React from 'react';
import {
  ArrowRight,
  Building2,
  Database,
  FileSearch,
  GraduationCap,
  Lock,
  ShieldCheck,
  WifiOff,
} from 'lucide-react';
import { useSses } from '../../context/SsesContext';
import type { RolUsuario } from '../../types/sses';

interface RoleCardConfig {
  rol: RolUsuario;
  titulo: string;
  subtitulo: string;
  permisoBadge: string;
  badgeClass: string;
  icon: React.ComponentType<{ className?: string }>;
  capacidades: string[];
}

const ROLE_CARDS: RoleCardConfig[] = [
  {
    rol: 'FUNCIONARIO_MEN',
    titulo: 'Funcionario MEN',
    subtitulo: 'Gestión de Estrategias y Cumplimiento',
    permisoBadge: 'Lectura y Escritura',
    badgeClass: 'bg-blue-50 text-men-blue border-blue-200',
    icon: Building2,
    capacidades: [
      'Crear estrategias en entidades activas (fecha fin > fecha inicio)',
      'Inmutabilidad automática al pasar de SIN_ESTUDIANTES a CON_ESTUDIANTES',
      'Vinculación individual filtrada por entidad y carga masiva de documentos',
      'Tablero KPI, alertas de atraso y reporte CSV con constancia SHA-256',
    ],
  },
  {
    rol: 'TUTOR',
    titulo: 'Tutor Territorial',
    subtitulo: 'Acompañamientos y Operación Offline',
    permisoBadge: 'Operación en Campo',
    badgeClass: 'bg-amber-50 text-men-amber border-amber-200',
    icon: GraduationCap,
    capacidades: [
      'Registrar acompañamientos Individual (1 docente) o Grupal (>= 2 docentes)',
      'Autogeneración de 4 semanas PENDIENTE por acompañamiento mensual',
      'Avance semanal REALIZADO o NO_REALIZADO (motivo obligatorio >= 10 chars)',
      'Simulador Sin conexión con cola local e Idempotency-Key sin duplicados',
    ],
  },
  {
    rol: 'ENTE_CONTROL',
    titulo: 'Ente de Control',
    subtitulo: 'Vigilancia Solo Lectura y Ley 1581',
    permisoBadge: 'Solo Lectura · Ley 1581',
    badgeClass: 'bg-emerald-50 text-men-emerald border-emerald-200',
    icon: ShieldCheck,
    capacidades: [
      'Acceso 100% de solo lectura a indicadores, estrategias y seguimientos',
      'Enmascaramiento automático PII de documentos (ej. CC ******4821)',
      'Protección aplicada en tablas de estudiantes, docentes y tutores',
      'Descarga de Reporte de Ley CSV enmascarado con constancia SHA-256',
    ],
  },
  {
    rol: 'OFICINA_TECNOLOGIA',
    titulo: 'Oficina de Tecnología',
    subtitulo: 'Auditoría Inmutable y Verificación SHA-256',
    permisoBadge: 'Auditoría Criptográfica',
    badgeClass: 'bg-slate-100 text-men-navy border-slate-300',
    icon: FileSearch,
    capacidades: [
      'Consulta de audit_log append-only con timestamp, rol y acción',
      'Inspección JSON lado a lado de valores anteriores vs. nuevos',
      'Encadenamiento criptográfico real SHA-256 vía Web Crypto API',
      'Verificación de integridad de cadena y simulador de alteración (Demo)',
    ],
  },
];

export const RoleSelector: React.FC = () => {
  const { state, seleccionarRol } = useSses();

  const entidadesActivas = state.entidades.filter(
    (e) => e.estado === 'ACTIVA'
  ).length;

  return (
    <div className="min-h-screen bg-men-bg flex flex-col">
      {/* Institutional Header */}
      <header className="bg-men-navy text-white border-b-4 border-men-blue shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-medium tracking-wide uppercase mb-3">
                <Lock className="w-3.5 h-3.5 text-sky-300" />
                <span>República de Colombia · Ministerio de Educación Nacional</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                SSES — Sistema de Seguimiento de Estrategias Estudiantiles
              </h1>
              <p className="mt-2 text-slate-200 max-w-3xl text-sm sm:text-base">
                Demostración interactiva multi-rol sin contraseñas. Seleccione un
                perfil institucional para explorar los flujos operativos, la
                protección de datos Ley 1581, el modo offline idempotente y la
                auditoría encadenada SHA-256.
              </p>
            </div>
            <div className="shrink-0 bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-xs space-y-1">
              <div className="font-semibold text-sky-200 uppercase tracking-wider">
                Escenario Sintético Colombia
              </div>
              <div className="text-slate-100">
                {entidadesActivas} entidades activas ·{' '}
                {state.entidades.length - entidadesActivas} inactiva
              </div>
              <div className="text-slate-100">
                {state.estrategias.length} estrategias · {state.estudiantes.length}{' '}
                estudiantes · {state.auditLog.length} eventos auditados
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Role Cards Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-men-navy">
              Selector Interactivo de Rol
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Elija el perfil con el que desea iniciar. Podrá cambiar entre los 4
              perfiles en cualquier momento desde la barra superior conservando
              los datos de su sesión.
            </p>
          </div>
          {state.isOffline && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-men-amber text-men-amber text-xs font-semibold">
              <WifiOff className="w-4 h-4" />
              <span>Modo Sin conexión activo ({state.offlineQueue.length} en cola)</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ROLE_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.rol}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-men-blue/50 transition-all flex flex-col justify-between p-6"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-lg bg-men-navy/10 text-men-navy flex items-center justify-center shrink-0">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-men-navy">
                          {card.titulo}
                        </h3>
                        <p className="text-xs font-medium text-slate-500">
                          {card.subtitulo}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${card.badgeClass}`}
                    >
                      {card.permisoBadge}
                    </span>
                  </div>

                  <ul className="space-y-2 mb-6 text-sm text-slate-700">
                    {card.capacidades.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-men-blue mt-2 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => seleccionarRol(card.rol)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-men-blue hover:bg-[#0052A3] text-white font-semibold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-men-blue focus:ring-offset-2"
                >
                  <span>Ingresar como {card.titulo}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </main>

      {/* Institutional Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-men-navy" />
            <span>
              MVP Frontend-Only · Persistencia local en navegador · Web Crypto
              SHA-256 nativo
            </span>
          </div>
          <span>Datos 100% sintéticos y ficticios · MEN Colombia</span>
        </div>
      </footer>
    </div>
  );
};
