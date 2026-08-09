-- ============================================================================
-- BrainDev · Simulación de flota del Taller Mecánico
-- ----------------------------------------------------------------------------
-- 16 vehículos particulares + 30 camiones de carga (46 unidades).
--
-- Cómo usar: ejecuta este script en el SQL Editor de Supabase o con psql.
-- Es idempotente (ON CONFLICT DO NOTHING por placa): puede ejecutarse varias veces.
--
-- Notas:
--   - registrado_por queda NULL. Si quieres atribuir los registros a un usuario,
--     sustituye NULL por el id del perfil (SELECT id FROM profiles LIMIT 1).
--   - 2 unidades se crean como inactivas (baja/en reparación) para probar el
--     filtro de estado de la pestaña Vehículos.
-- ============================================================================

begin;

insert into public.vehiculos (
  placa, marca, modelo, anio, color, tipo, capacidad,
  serial_motor, serial_carroceria, observaciones, activo, registrado_por
)
values
  -- =============================== PARTICULARES =============================
  ('AB123CD', 'Toyota',        'Corolla',    2021, 'Blanco',   'sedan',     '5 pasajeros', 'MM0001', 'BRAINDEV000000001', 'Uso diario', true, null),
  ('AB456EF', 'Toyota',        'Corolla',    2019, 'Gris',     'sedan',     '5 pasajeros', 'MM0002', 'BRAINDEV000000002', null, true, null),
  ('CD789GH', 'Chevrolet',     'Aveo',       2018, 'Rojo',     'sedan',     '5 pasajeros', 'MM0003', 'BRAINDEV000000003', null, true, null),
  ('CD012IJ', 'Chevrolet',     'Spark GT',   2020, 'Azul',     'sedan',     '5 pasajeros', 'MM0004', 'BRAINDEV000000004', null, true, null),
  ('EF345KL', 'Hyundai',       'Accent',     2017, 'Plata',    'sedan',     '5 pasajeros', 'MM0005', 'BRAINDEV000000005', null, true, null),
  ('EF678MN', 'Hyundai',       'Tucson',     2022, 'Negro',    'camioneta', '5 pasajeros', 'MM0006', 'BRAINDEV000000006', 'Vehículo de gerencia', true, null),
  ('GH901OP', 'Kia',           'Rio',        2019, 'Blanco',   'sedan',     '5 pasajeros', 'MM0007', 'BRAINDEV000000007', null, true, null),
  ('GH234QR', 'Kia',           'Sportage',   2021, 'Gris',     'camioneta', '5 pasajeros', 'MM0008', 'BRAINDEV000000008', null, true, null),
  ('IJ567ST', 'Nissan',        'Sentra',     2016, 'Azul',     'sedan',     '5 pasajeros', 'MM0009', 'BRAINDEV000000009', null, true, null),
  ('IJ890UV', 'Nissan',        'Versa',      2020, 'Rojo',     'sedan',     '5 pasajeros', 'MM0010', 'BRAINDEV000000010', null, true, null),
  ('KL123WX', 'Ford',          'Fiesta',     2018, 'Plata',    'sedan',     '5 pasajeros', 'MM0011', 'BRAINDEV000000011', null, true, null),
  ('KL456YZ', 'Ford',          'Explorer',   2021, 'Negro',    'camioneta', '7 pasajeros', 'MM0012', 'BRAINDEV000000012', null, true, null),
  ('MN789AB', 'Mitsubishi',    'Lancer',     2017, 'Blanco',   'sedan',     '5 pasajeros', 'MM0013', 'BRAINDEV000000013', null, true, null),
  ('MN012CD', 'Mitsubishi',    'Montero',    2020, 'Gris',     'camioneta', '7 pasajeros', 'MM0014', 'BRAINDEV000000014', null, true, null),
  ('OP345EF', 'Jeep',          'Grand Cherokee', 2022, 'Rojo', 'camioneta', '5 pasajeros', 'MM0015', 'BRAINDEV000000015', null, true, null),
  ('OP678GH', 'Ram',           '1500',       2021, 'Azul',     'camioneta', '5 pasajeros', 'MM0016', 'BRAINDEV000000016', 'Dado de baja por venta', false, null),

  -- ========================= CAMIONES DE CARGA ==============================
  ('A12AB1A', 'Toyota',        'Dyna',          2019, 'Blanco', 'camion', '3.5 ton',  'MM0017', 'BRAINDEV000000017', 'Reparto urbano', true, null),
  ('A14AC2B', 'Toyota',        'Dyna',          2020, 'Blanco', 'camion', '3.5 ton',  'MM0018', 'BRAINDEV000000018', 'Reparto urbano', true, null),
  ('A16AD3C', 'Chevrolet',     'NHR',           2018, 'Blanco', 'camion', '3.5 ton',  'MM0019', 'BRAINDEV000000019', null, true, null),
  ('A18AE4D', 'Chevrolet',     'FTR',           2021, 'Azul',   'camion', '8 ton',    'MM0020', 'BRAINDEV000000020', 'Ruta centro-sur', true, null),
  ('A20AF5E', 'Hino',          '300',           2020, 'Blanco', 'camion', '3.5 ton',  'MM0021', 'BRAINDEV000000021', null, true, null),
  ('A22AG6F', 'Hino',          '500',           2021, 'Rojo',   'camion', '8 ton',    'MM0022', 'BRAINDEV000000022', null, true, null),
  ('A24AH7G', 'Isuzu',         'NPR',           2019, 'Blanco', 'camion', '3.5 ton',  'MM0023', 'BRAINDEV000000023', null, true, null),
  ('A26AI8H', 'Isuzu',         'NQR',           2022, 'Azul',   'camion', '5 ton',    'MM0024', 'BRAINDEV000000024', null, true, null),
  ('A28AJ9I', 'Mitsubishi',    'Fuso Canter',   2018, 'Blanco', 'camion', '3.5 ton',  'MM0025', 'BRAINDEV000000025', null, true, null),
  ('A30AK1J', 'Hyundai',       'HD65',          2020, 'Blanco', 'camion', '3.5 ton',  'MM0026', 'BRAINDEV000000026', null, true, null),
  ('A32AL2K', 'Hyundai',       'HD78',          2021, 'Rojo',   'camion', '5 ton',    'MM0027', 'BRAINDEV000000027', null, true, null),
  ('A34AM3L', 'Ford',          'Cargo',         2017, 'Azul',   'camion', '12 ton',   'MM0028', 'BRAINDEV000000028', null, true, null),
  ('A36AN4M', 'Ford',          'Cargo',         2020, 'Blanco', 'camion', '8 ton',    'MM0029', 'BRAINDEV000000029', null, true, null),
  ('A38AO5N', 'Mercedes-Benz', 'Atego',         2019, 'Blanco', 'camion', '8 ton',    'MM0030', 'BRAINDEV000000030', null, true, null),
  ('A40AP6O', 'Mercedes-Benz', 'Actros',        2021, 'Rojo',   'camion', '15 ton',   'MM0031', 'BRAINDEV000000031', 'Ruta larga', true, null),
  ('A42AQ7P', 'International', '4400',          2018, 'Blanco', 'camion', '12 ton',   'MM0032', 'BRAINDEV000000032', null, true, null),
  ('A44AR8Q', 'International', '4900',          2020, 'Azul',   'camion', '15 ton',   'MM0033', 'BRAINDEV000000033', null, true, null),
  ('A46AS9R', 'Kenworth',      'T800',          2019, 'Rojo',   'camion', '15 ton',   'MM0034', 'BRAINDEV000000034', null, true, null),
  ('A48AT1S', 'Kenworth',      'T880',          2021, 'Blanco', 'camion', '15 ton',   'MM0035', 'BRAINDEV000000035', null, true, null),
  ('A50AU2T', 'Freightliner',  'M2',            2018, 'Blanco', 'camion', '12 ton',   'MM0036', 'BRAINDEV000000036', null, true, null),
  ('A52AV3U', 'Freightliner',  'Cascadia',      2020, 'Rojo',   'camion', '15 ton',   'MM0037', 'BRAINDEV000000037', null, true, null),
  ('A54AW4V', 'Mack',          'Granite',       2019, 'Blanco', 'camion', '15 ton',   'MM0038', 'BRAINDEV000000038', null, true, null),
  ('A56AX5W', 'Mack',          'CHU',           2021, 'Azul',   'camion', '15 ton',   'MM0039', 'BRAINDEV000000039', null, true, null),
  ('A58AY6X', 'Volvo',         'FH',            2020, 'Rojo',   'camion', '15 ton',   'MM0040', 'BRAINDEV000000040', null, true, null),
  ('A60AZ7Y', 'Volvo',         'VM',            2019, 'Blanco', 'camion', '8 ton',    'MM0041', 'BRAINDEV000000041', null, true, null),
  ('A62AA8Z', 'Nissan',        'Cabstar',       2018, 'Blanco', 'camion', '3.5 ton',  'MM0042', 'BRAINDEV000000042', null, true, null),
  ('A64AB9A', 'Chevrolet',     'Kodiak',        2019, 'Blanco', 'camion', '8 ton',    'MM0043', 'BRAINDEV000000043', null, true, null),
  ('A66AC1B', 'Kenworth',      'T370',          2020, 'Blanco', 'camion', '8 ton',    'MM0044', 'BRAINDEV000000044', null, true, null),
  ('A68AD2C', 'Freightliner',  'M2 112',        2022, 'Rojo',   'camion', '15 ton',   'MM0045', 'BRAINDEV000000045', null, true, null),
  ('A70AE3D', 'International', 'LT',            2021, 'Blanco', 'camion', '15 ton',   'MM0046', 'BRAINDEV000000046', 'En reparación mayor', false, null)
on conflict (placa) do nothing;

commit;
