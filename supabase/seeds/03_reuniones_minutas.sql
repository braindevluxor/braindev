-- ============================================================================
-- BrainDev · Simulación de minutas y compromisos
-- ----------------------------------------------------------------------------
-- 6 reuniones con sus participantes, observaciones y compromisos (acuerdos),
-- cada uno con responsable y fecha tope de entrega (fechas relativas a hoy).
--
-- Cómo usar: ejecuta este script en el SQL Editor de Supabase o con psql,
-- DESPUÉS de aplicar la migración 009_minutas.sql.
--
-- Idempotente: usa ids fijos de reunión y las elimina al inicio (los
-- compromisos se borran en cascada), así puedes re-ejecutarlo sin duplicar.
--
-- Nota: registrado_por se omite para que lo asigne la BD (default auth.uid());
-- si la migración aún no se ha re-aplicado, queda NULL.
-- ============================================================================

begin;

delete from public.reuniones where id in (
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000004',
  '10000000-0000-0000-0000-000000000005',
  '10000000-0000-0000-0000-000000000006'
);

insert into public.reuniones (id, titulo, fecha, lugar, participantes, observaciones)
values
  (
    '10000000-0000-0000-0000-000000000001',
    'Reunión de planificación semanal',
    current_date - 2,
    'Sala de reuniones principal',
    ARRAY['María Pérez', 'Carlos Rodríguez', 'Luisa Fernández'],
    'Se revisó el avance de la semana, las requisiciones pendientes del taller y el estado de los presupuestos.'
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    'Seguimiento de flota y mantenimiento',
    current_date - 5,
    'Oficina de operaciones',
    ARRAY['Jorge Rivas', 'Ana González', 'Pedro Salazar'],
    'Se priorizaron las reparaciones de los camiones de reparto y se definió el cronograma de mantenimiento preventivo.'
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    'Revisión de presupuesto y gastos',
    current_date - 9,
    'Sala de juntas',
    ARRAY['Luisa Fernández', 'Andrés Blanco', 'María Pérez'],
    'Análisis del comparativo presupuesto vs ejecución del mes. Se detectaron movimientos sin factura por depurar.'
  ),
  (
    '10000000-0000-0000-0000-000000000004',
    'Reunión con personal de taller',
    current_date - 12,
    'Taller mecánico',
    ARRAY['Carlos Rodríguez', 'Jorge Rivas'],
    'Se organizó el orden de trabajo de las requisiciones pendientes y se propuso una hoja de control de horas por reparación.'
  ),
  (
    '10000000-0000-0000-0000-000000000005',
    'Planificación de nómina',
    current_date - 16,
    'Sala de juntas',
    ARRAY['Andrés Blanco', 'Ana González', 'Daniela Martínez'],
    'Revisión del cálculo de la quincena, horas extra y actualización de datos bancarios del personal.'
  ),
  (
    '10000000-0000-0000-0000-000000000006',
    'Reunión de seguridad laboral',
    current_date - 20,
    'Sala de reuniones principal',
    ARRAY['Pedro Salazar', 'María Pérez', 'Jorge Rivas'],
    'Se evaluaron los riesgos del taller y las instalaciones. Queda pendiente la renovación de extintores y la capacitación de la flota.'
  );

insert into public.compromisos (reunion_id, descripcion, responsable, fecha_tope, completado)
values
  -- Reunión 1: planificación semanal
  ('10000000-0000-0000-0000-000000000001', 'Actualizar el plan de compras de suministros del taller',                'María Pérez',      current_date + 3,  true),
  ('10000000-0000-0000-0000-000000000001', 'Enviar presupuesto de la reparación del vehículo A18AE4D',               'Carlos Rodríguez', current_date + 1,  true),
  ('10000000-0000-0000-0000-000000000001', 'Consolidar el informe de gastos del mes anterior',                        'Luisa Fernández',  current_date + 2,  false),
  ('10000000-0000-0000-0000-000000000001', 'Solicitar cotización de aceite y filtros para la flota',                 'María Pérez',      current_date + 6,  false),

  -- Reunión 2: seguimiento de flota y mantenimiento
  ('10000000-0000-0000-0000-000000000002', 'Agendar revisión general de los camiones de reparto',                     'Jorge Rivas',      current_date + 4,  false),
  ('10000000-0000-0000-0000-000000000002', 'Cotizar repuestos para la transmisión del vehículo A40AP6O',             'Pedro Salazar',    current_date + 2,  false),
  ('10000000-0000-0000-0000-000000000002', 'Actualizar el cronograma de mantenimiento preventivo',                    'Ana González',     current_date + 7,  false),

  -- Reunión 3: revisión de presupuesto y gastos
  ('10000000-0000-0000-0000-000000000003', 'Depurar los movimientos sin factura del mes',                            'Luisa Fernández',  current_date + 1,  true),
  ('10000000-0000-0000-0000-000000000003', 'Presentar el comparativo presupuesto vs ejecución',                       'Andrés Blanco',    current_date + 5,  false),
  ('10000000-0000-0000-0000-000000000003', 'Ajustar el presupuesto de nómina del próximo mes',                        'María Pérez',      current_date + 6,  false),

  -- Reunión 4: personal de taller
  ('10000000-0000-0000-0000-000000000004', 'Reorganizar el orden de trabajo de las requisiciones pendientes',        'Carlos Rodríguez', current_date + 2,  false),
  ('10000000-0000-0000-0000-000000000004', 'Implementar la hoja de control de horas por reparación',                 'Jorge Rivas',      current_date + 8,  false),
  ('10000000-0000-0000-0000-000000000004', 'Reparar el sistema eléctrico del vehículo A36AN4M',                       'Carlos Rodríguez', current_date + 3,  false),

  -- Reunión 5: planificación de nómina
  ('10000000-0000-0000-0000-000000000005', 'Revisar el cálculo de horas extra de la quincena',                        'Daniela Martínez', current_date - 1,  true),
  ('10000000-0000-0000-0000-000000000005', 'Actualizar los datos bancarios del personal',                             'Ana González',     current_date - 2,  false),
  ('10000000-0000-0000-0000-000000000005', 'Aprobar los ajustes salariales propuestos',                               'Andrés Blanco',    current_date + 5,  false),

  -- Reunión 6: seguridad laboral
  ('10000000-0000-0000-0000-000000000006', 'Renovar los extintores de las instalaciones',                             'Pedro Salazar',    current_date - 3,  true),
  ('10000000-0000-0000-0000-000000000006', 'Coordinar la capacitación de manejo defensivo de la flota',              'Jorge Rivas',      current_date + 10, false),
  ('10000000-0000-0000-0000-000000000006', 'Elaborar la matriz de riesgos del taller',                               'María Pérez',      current_date + 14, false);

commit;
