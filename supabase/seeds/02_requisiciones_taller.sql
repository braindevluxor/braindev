-- ============================================================================
-- BrainDev · Simulación de requisiciones de taller
-- ----------------------------------------------------------------------------
-- Solicitudes de revisión, reparación u otros para parte de la flota
-- (28 requisiciones en 24 vehículos, con fechas relativas a hoy).
--
-- Cómo usar: ejecuta en el SQL Editor de Supabase o con psql, DESPUÉS de
-- ejecutar 01_flota_vehiculos.sql (los vehículos se referencian por placa).
--
-- Idempotente: elimina las requisiciones de simulación anteriores (las que
-- tienen registrado_por NULL) antes de insertar, así puedes re-ejecutarlo.
-- ============================================================================

begin;

delete from public.requisiciones where registrado_por is null;

insert into public.requisiciones (
  vehiculo_id, tipo, prioridad, descripcion, estado,
  fecha_solicitud, fecha_estimada, registrado_por
)
values
  -- (select id from public.vehiculos where placa = 'XXXXXXX')
  ((select id from public.vehiculos where placa = 'A18AE4D'), 'reparacion', 'alta',   'Reparación de compresor de frenos de aire',                  'pendiente',  current_date - 1,  current_date + 5,  null),
  ((select id from public.vehiculos where placa = 'AB123CD'), 'revision',   'media',  'Cambio de aceite y filtros',                                'en_proceso', current_date - 2,  current_date + 2,  null),
  ((select id from public.vehiculos where placa = 'A40AP6O'), 'reparacion', 'alta',   'Reparación de caja de transmisión',                         'pendiente',  current_date - 1,  current_date + 7,  null),
  ((select id from public.vehiculos where placa = 'A12AB1A'), 'revision',   'baja',   'Alineación y balanceo',                                     'completado', current_date - 25, null,             null),
  ((select id from public.vehiculos where placa = 'A26AI8H'), 'reparacion', 'media',  'Cambio de embrague y kit de arrastre',                      'en_proceso', current_date - 6,  current_date + 3,  null),
  ((select id from public.vehiculos where placa = 'CD789GH'), 'revision',   'baja',   'Revisión general pre-venta',                                'completado', current_date - 40, null,             null),
  ((select id from public.vehiculos where placa = 'A52AV3U'), 'reparacion', 'alta',   'Reparación de radiador por fuga de refrigerante',           'pendiente',  current_date - 2,  current_date + 4,  null),
  ((select id from public.vehiculos where placa = 'EF678MN'), 'revision',   'media',  'Cambio de batería y revisión del sistema eléctrico',        'en_proceso', current_date - 4,  current_date + 1,  null),
  ((select id from public.vehiculos where placa = 'A34AM3L'), 'reparacion', 'media',  'Cambio de amortiguadores delanteros',                       'pendiente',  current_date - 5,  current_date + 6,  null),
  ((select id from public.vehiculos where placa = 'GH234QR'), 'otro',       'baja',   'Instalación de cámara de retroceso',                        'completado', current_date - 30, null,             null),
  ((select id from public.vehiculos where placa = 'A46AS9R'), 'reparacion', 'alta',   'Reparación de motor: templado de cabezote',                 'pendiente',  current_date - 3,  current_date + 10, null),
  ((select id from public.vehiculos where placa = 'IJ890UV'), 'revision',   'baja',   'Cambio de llantas y alineación',                            'completado', current_date - 18, null,             null),
  ((select id from public.vehiculos where placa = 'A58AY6X'), 'reparacion', 'alta',   'Reparación de compresor de aire y sistema de frenos',       'en_proceso', current_date - 8,  current_date + 4,  null),
  ((select id from public.vehiculos where placa = 'A20AF5E'), 'revision',   'media',  'Revisión de frenos delanteros',                             'pendiente',  current_date - 2,  current_date + 3,  null),
  ((select id from public.vehiculos where placa = 'MN012CD'), 'otro',       'baja',   'Cambio de llantas todo terreno',                            'completado', current_date - 22, null,             null),
  ((select id from public.vehiculos where placa = 'A70AE3D'), 'reparacion', 'alta',   'Reparación mayor en curso',                                 'en_proceso', current_date - 12, current_date + 15, null),
  ((select id from public.vehiculos where placa = 'OP345EF'), 'revision',   'media',  'Cambio de aceite y revisión de suspensión',                 'pendiente',  current_date - 1,  current_date + 2,  null),
  ((select id from public.vehiculos where placa = 'KL456YZ'), 'otro',       'baja',   'Instalación de radio con GPS',                              'completado', current_date - 35, null,             null),
  ((select id from public.vehiculos where placa = 'A48AT1S'), 'reparacion', 'media',  'Cambio de neumáticos y revisión de rodamiento',             'en_proceso', current_date - 7,  current_date + 3,  null),
  ((select id from public.vehiculos where placa = 'A12AB1A'), 'reparacion', 'baja',   'Cambio de llanta trasera derecha',                          'cancelado',  current_date - 15, null,             null),
  ((select id from public.vehiculos where placa = 'A24AH7G'), 'revision',   'baja',   'Revisión general preventiva',                               'completado', current_date - 20, null,             null),
  ((select id from public.vehiculos where placa = 'A36AN4M'), 'reparacion', 'media',  'Reparación de sistema eléctrico (luminarias)',              'pendiente',  current_date - 4,  current_date + 3,  null),
  ((select id from public.vehiculos where placa = 'A18AE4D'), 'otro',       'baja',   'Adecuación de carrocería (lona)',                          'completado', current_date - 28, null,             null),
  ((select id from public.vehiculos where placa = 'A60AZ7Y'), 'revision',   'media',  'Cambio de aceite y filtros de aire',                        'en_proceso', current_date - 5,  current_date + 2,  null),
  ((select id from public.vehiculos where placa = 'AB456EF'), 'otro',       'baja',   'Limpieza de inyectores',                                   'cancelado',  current_date - 20, null,             null),
  ((select id from public.vehiculos where placa = 'A50AU2T'), 'reparacion', 'alta',   'Cambio de clutch y volante bimasa',                         'pendiente',  current_date - 6,  current_date + 8,  null),
  ((select id from public.vehiculos where placa = 'A28AJ9I'), 'revision',   'baja',   'Revisión de frenos traseros',                               'completado', current_date - 32, null,             null),
  ((select id from public.vehiculos where placa = 'A54AW4V'), 'reparacion', 'media',  'Cambio de bomba de agua y termostato',                      'en_proceso', current_date - 3,  current_date + 5,  null);

commit;
