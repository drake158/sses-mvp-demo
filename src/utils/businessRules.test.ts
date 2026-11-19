import { describe, expect, it } from 'vitest';
import type {
  AuditLogEntry,
  Entidad,
  Estrategia,
  Estudiante,
} from '../types/sses';
import {
  aplicarEdicionEstrategia,
  enmascararDocumentoLey1581,
  procesarCargaMasivaEstudiantes,
  puedeEditarEstrategia,
  validarEstudianteInput,
  validarTutorInput,
  vincularEstudiantesAEstrategia,
} from './businessRules';
import {
  computeAuditEntryHash,
  computeSha256Hex,
  GENESIS_HASH,
  verifyAuditChain,
} from './crypto';

const ENTIDADES_TEST: Entidad[] = [
  {
    id: 'ENT-001',
    codigoDane: '111001000101',
    nombre: 'I.E.D. Técnico Bicentenario de Bogotá',
    municipio: 'Bogotá D.C.',
    departamento: 'Cundinamarca',
    estado: 'ACTIVA',
  },
  {
    id: 'ENT-002',
    codigoDane: '105001000202',
    nombre: 'I.E. Maestro Guillermo Vélez de Medellín',
    municipio: 'Medellín',
    departamento: 'Antioquia',
    estado: 'ACTIVA',
  },
];

const ESTUDIANTES_TEST: Estudiante[] = [
  {
    id: 'EST-001',
    tipoDocumento: 'TI',
    numeroDocumento: '1020304821',
    nombreCompleto: 'Valentina Morales Cárdenas',
    entidadId: 'ENT-001',
    grado: '10°',
  },
  {
    id: 'EST-002',
    tipoDocumento: 'CC',
    numeroDocumento: '1014289451',
    nombreCompleto: 'Mariana Ospina Beltrán',
    entidadId: 'ENT-001',
    grado: '11°',
  },
  {
    id: 'EST-004',
    tipoDocumento: 'TI',
    numeroDocumento: '1037651901',
    nombreCompleto: 'Juan Esteban Restrepo Gómez',
    entidadId: 'ENT-002',
    grado: '9°',
  },
];

describe('SSES Reglas de Negocio Críticas (MEN Colombia)', () => {
  it('1. Bloquea permanentemente la edición de una estrategia al vincular estudiantes (SIN_ESTUDIANTES -> CON_ESTUDIANTES) y filtra por entidad', () => {
    const estrategiaInicial: Estrategia = {
      id: 'STR-TEST-001',
      nombre: 'Estrategia Inicial de Lectoescritura',
      descripcion: 'Versión editable inicial',
      entidadId: 'ENT-001',
      fechaInicio: '2026-09-01',
      fechaFin: '2026-12-15',
      estado: 'SIN_ESTUDIANTES',
      estudianteIds: [],
      creadaEn: '2026-09-01T08:00:00.000Z',
      actualizadaEn: '2026-09-01T08:00:00.000Z',
    };

    // En SIN_ESTUDIANTES se permite editar los datos base
    expect(puedeEditarEstrategia(estrategiaInicial)).toBe(true);
    const estrategiaEditada = aplicarEdicionEstrategia(
      estrategiaInicial,
      {
        nombre: 'Estrategia Editada Antes de Vincular',
        descripcion: 'Descripción actualizada',
        entidadId: 'ENT-001',
        fechaInicio: '2026-09-05',
        fechaFin: '2026-12-20',
      },
      ENTIDADES_TEST
    );
    expect(estrategiaEditada.nombre).toBe(
      'Estrategia Editada Antes de Vincular'
    );

    // Al vincular documentos mixtos (1 válido de ENT-001 + 1 de ENT-002 + 1 inexistente)
    const linkResult = vincularEstudiantesAEstrategia(
      estrategiaEditada,
      ['1020304821', '1037651901', '9999999999'],
      ESTUDIANTES_TEST
    );

    expect(linkResult.vinculados.map((s) => s.id)).toEqual(['EST-001']);
    expect(linkResult.otraEntidad).toEqual(['1037651901']);
    expect(linkResult.noEncontrados).toEqual(['9999999999']);
    expect(linkResult.estrategiaActualizada.estado).toBe('CON_ESTUDIANTES');

    // Una vez CON_ESTUDIANTES, la edición de datos base queda bloqueada permanentemente
    expect(puedeEditarEstrategia(linkResult.estrategiaActualizada)).toBe(false);
    expect(() =>
      aplicarEdicionEstrategia(
        linkResult.estrategiaActualizada,
        {
          nombre: 'Intento de Modificación Prohibida',
          descripcion: 'No debe guardarse',
          entidadId: 'ENT-001',
          fechaInicio: '2026-09-05',
          fechaFin: '2026-12-20',
        },
        ENTIDADES_TEST
      )
    ).toThrow(/CON_ESTUDIANTES/i);

    // Debe permitir seguir vinculando estudiantes adicionales de la misma entidad sin desbloquear la edición
    const secondLink = vincularEstudiantesAEstrategia(
      linkResult.estrategiaActualizada,
      ['1014289451', '1020304821'],
      ESTUDIANTES_TEST
    );
    expect(secondLink.vinculados.map((s) => s.id)).toEqual(['EST-002']);
    expect(secondLink.yaVinculados).toEqual(['1020304821']);
    expect(secondLink.estrategiaActualizada.estudianteIds).toEqual([
      'EST-001',
      'EST-002',
    ]);
    expect(puedeEditarEstrategia(secondLink.estrategiaActualizada)).toBe(false);
  });

  it('2. Genera hash SHA-256 real con Web Crypto API y verifica integridad y detección de alteraciones en la cadena de auditoría', async () => {
    // Vector estándar NIST SHA-256 para "abc"
    const abcHash = await computeSha256Hex('abc');
    expect(abcHash).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    );
    expect(abcHash).toMatch(/^[0-9a-f]{64}$/);

    // Encadenamiento de 2 registros de auditoría desde GENESIS_HASH
    const payload1 = {
      id: 'AUD-0001',
      secuencia: 1,
      timestamp: '2026-11-18T10:00:00.000Z',
      rol: 'OFICINA_TECNOLOGIA' as const,
      accion: 'INICIALIZACION_SISTEMA' as const,
      entidadAfectada: 'Sistema',
      registroId: 'SYS-001',
      valoresAnteriores: null,
      valoresNuevos: { version: 1 },
      previousHash: GENESIS_HASH,
    };
    const hash1 = await computeAuditEntryHash(payload1);
    const entry1: AuditLogEntry = { ...payload1, hash: hash1 };

    const payload2 = {
      id: 'AUD-0002',
      secuencia: 2,
      timestamp: '2026-11-18T10:05:00.000Z',
      rol: 'FUNCIONARIO_MEN' as const,
      accion: 'CREAR_ESTRATEGIA' as const,
      entidadAfectada: 'Estrategia',
      registroId: 'STR-001',
      valoresAnteriores: null,
      valoresNuevos: { estado: 'SIN_ESTUDIANTES', nombre: 'Prueba SHA-256' },
      previousHash: entry1.hash,
    };
    const hash2 = await computeAuditEntryHash(payload2);
    const entry2: AuditLogEntry = { ...payload2, hash: hash2 };

    const validCheck = await verifyAuditChain([entry1, entry2]);
    expect(validCheck.valid).toBe(true);
    expect(validCheck.totalVerified).toBe(2);
    expect(validCheck.brokenIndex).toBeNull();

    // Alteración de un campo en entry2 debe romper la verificación criptográfica
    const tamperedEntry2: AuditLogEntry = {
      ...entry2,
      valoresNuevos: { estado: 'CON_ESTUDIANTES', nombre: 'Alterado' },
    };
    const failedCheck = await verifyAuditChain([entry1, tamperedEntry2]);
    expect(failedCheck.valid).toBe(false);
    expect(failedCheck.brokenIndex).toBe(1);
    expect(failedCheck.brokenEntryId).toBe('AUD-0002');
  });

  it('3. Enmascara PII de documentos bajo Ley 1581 conservando solo los últimos 4 dígitos y protegiendo documentos cortos', () => {
    expect(enmascararDocumentoLey1581('CC', '1020304821')).toBe(
      'CC ******4821'
    );
    expect(enmascararDocumentoLey1581('TI', '1144087311')).toBe(
      'TI ******7311'
    );
    // Documento corto (<= 4 dígitos): no debe exponer ningún dígito
    expect(enmascararDocumentoLey1581('CC', '4821')).toBe('CC ******');
    expect(enmascararDocumentoLey1581('CE', '12')).toBe('CE ******');
  });

  it('4. Valida registro manual y carga masiva de estudiantes y tutores para Funcionario MEN', () => {
    // Registro manual válido y rechazo por duplicado
    const okEst = validarEstudianteInput(
      {
        tipoDocumento: 'TI',
        numeroDocumento: '1020555111',
        nombreCompleto: 'Lucía Fernanda Pérez',
        entidadId: 'ENT-001',
        grado: '10°',
      },
      ENTIDADES_TEST,
      ESTUDIANTES_TEST
    );
    expect(okEst.valid).toBe(true);

    const dupEst = validarEstudianteInput(
      {
        tipoDocumento: 'TI',
        numeroDocumento: '1020304821',
        nombreCompleto: 'Duplicado Test',
        entidadId: 'ENT-001',
        grado: '10°',
      },
      ENTIDADES_TEST,
      ESTUDIANTES_TEST
    );
    expect(dupEst.valid).toBe(false);

    // Carga masiva con encabezado CSV, registro válido, duplicado e inválido
    const bulk = procesarCargaMasivaEstudiantes(
      [
        'tipoDocumento,numeroDocumento,nombreCompleto,grado',
        'TI, 1020555222, Tomás Herrera Gil, 11°',
        'TI, 1020304821, Ya Existe, 10°',
        'XX, 123, Corto, 9°',
      ].join('\n'),
      'ENT-001',
      ENTIDADES_TEST,
      ESTUDIANTES_TEST
    );
    expect(bulk.creados).toHaveLength(1);
    expect(bulk.creados[0].numeroDocumento).toBe('1020555222');
    expect(bulk.duplicados).toEqual(['1020304821']);
    expect(bulk.invalidos).toHaveLength(1);

    // Registro manual de tutor válido y duplicado
    const tutoresExistentes = [
      {
        id: 'TUT-001',
        tipoDocumento: 'CC' as const,
        numeroDocumento: '80124589',
        nombreCompleto: 'Alejandro Ramírez',
        zonaAsignada: 'Región Andina',
      },
    ];
    expect(
      validarTutorInput(
        {
          tipoDocumento: 'CC',
          numeroDocumento: '80999111',
          nombreCompleto: 'Andrea Castro',
          zonaAsignada: 'Región Caribe',
        },
        tutoresExistentes
      ).valid
    ).toBe(true);

    expect(
      validarTutorInput(
        {
          tipoDocumento: 'CC',
          numeroDocumento: '80124589',
          nombreCompleto: 'Tutor Duplicado',
          zonaAsignada: 'Región Caribe',
        },
        tutoresExistentes
      ).valid
    ).toBe(false);
  });
});
