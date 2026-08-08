-- ============================================================================
-- Script para simular datos de los últimos 3 meses
-- ============================================================================
-- Genera datos realistas para: departamentos, presupuestos, conceptos y movimientos
-- Mantiene intactas: profiles, razones_sociales, centros_costo
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. DEPARTAMENTOS
-- ============================================================================
INSERT INTO departamentos (nombre) VALUES 
  ('Administración'),
  ('Recursos Humanos'),
  ('Contabilidad'),
  ('Ventas'),
  ('Marketing'),
  ('Tecnología'),
  ('Operaciones'),
  ('Logística')
ON CONFLICT (nombre) DO NOTHING;

-- Obtener IDs de departamentos
DO $$
DECLARE
  dept_admin UUID;
  dept_rrhh UUID;
  dept_cont UUID;
  dept_ventas UUID;
  dept_marketing UUID;
  dept_tech UUID;
  dept_ops UUID;
  dept_log UUID;
  usuario_registrado UUID;
  
  -- Fechas para los últimos 3 meses
  fecha_inicio DATE := CURRENT_DATE - INTERVAL '3 months';
  fecha_fin DATE := CURRENT_DATE;
  mes_actual DATE;
  v_anio INT;
  v_mes INT;
BEGIN
  -- Obtener un usuario para registrar los movimientos
  SELECT id INTO usuario_registrado FROM profiles WHERE role = 'admin' LIMIT 1;
  
  -- Si no hay admin, usar cualquier usuario
  IF usuario_registrado IS NULL THEN
    SELECT id INTO usuario_registrado FROM profiles LIMIT 1;
  END IF;
  
  -- Obtener IDs de departamentos
  SELECT id INTO dept_admin FROM departamentos WHERE nombre = 'Administración';
  SELECT id INTO dept_rrhh FROM departamentos WHERE nombre = 'Recursos Humanos';
  SELECT id INTO dept_cont FROM departamentos WHERE nombre = 'Contabilidad';
  SELECT id INTO dept_ventas FROM departamentos WHERE nombre = 'Ventas';
  SELECT id INTO dept_marketing FROM departamentos WHERE nombre = 'Marketing';
  SELECT id INTO dept_tech FROM departamentos WHERE nombre = 'Tecnología';
  SELECT id INTO dept_ops FROM departamentos WHERE nombre = 'Operaciones';
  SELECT id INTO dept_log FROM departamentos WHERE nombre = 'Logística';
  
  -- ============================================================================
  -- 2. PRESUPUESTOS MENSUALES (últimos 3 meses)
  -- ============================================================================
  mes_actual := fecha_inicio;
  WHILE mes_actual <= fecha_fin LOOP
    v_anio := EXTRACT(YEAR FROM mes_actual);
    v_mes := EXTRACT(MONTH FROM mes_actual);
    
    -- Insertar presupuestos para cada departamento
    INSERT INTO presupuestos (departamento_id, anio, mes, monto_usd) VALUES
      (dept_admin, v_anio, v_mes, 5000),
      (dept_rrhh, v_anio, v_mes, 8000),
      (dept_cont, v_anio, v_mes, 6000),
      (dept_ventas, v_anio, v_mes, 12000),
      (dept_marketing, v_anio, v_mes, 10000),
      (dept_tech, v_anio, v_mes, 15000),
      (dept_ops, v_anio, v_mes, 9000),
      (dept_log, v_anio, v_mes, 7000)
    ON CONFLICT (departamento_id, anio, mes) DO UPDATE 
    SET monto_usd = EXCLUDED.monto_usd;
    
    mes_actual := mes_actual + INTERVAL '1 month';
  END LOOP;
  
  -- ============================================================================
  -- 3. CONCEPTOS POR DEPARTAMENTO
  -- ============================================================================
  INSERT INTO conceptos_departamento (departamento_id, concepto) VALUES
    -- Administración
    (dept_admin, 'Material de oficina'),
    (dept_admin, 'Papelería'),
    (dept_admin, 'Servicios de limpieza'),
    (dept_admin, 'Mantenimiento de instalaciones'),
    
    -- Recursos Humanos
    (dept_rrhh, 'Capacitación'),
    (dept_rrhh, 'Reclutamiento'),
    (dept_rrhh, 'Eventos corporativos'),
    (dept_rrhh, 'Beneficios empleados'),
    
    -- Contabilidad
    (dept_cont, 'Software contable'),
    (dept_cont, 'Auditoría externa'),
    (dept_cont, 'Servicios profesionales'),
    (dept_cont, 'Impuestos'),
    
    -- Ventas
    (dept_ventas, 'Viajes de negocios'),
    (dept_ventas, 'Comisiones'),
    (dept_ventas, 'Material promocional'),
    (dept_ventas, 'Cenas con clientes'),
    
    -- Marketing
    (dept_marketing, 'Publicidad digital'),
    (dept_marketing, 'Redes sociales'),
    (dept_marketing, 'Diseño gráfico'),
    (dept_marketing, 'Eventos de marketing'),
    
    -- Tecnología
    (dept_tech, 'Licencias de software'),
    (dept_tech, 'Equipos de cómputo'),
    (dept_tech, 'Servidores y hosting'),
    (dept_tech, 'Soporte técnico'),
    
    -- Operaciones
    (dept_ops, 'Mantenimiento de equipos'),
    (dept_ops, 'Suministros operativos'),
    (dept_ops, 'Servicios públicos'),
    (dept_ops, 'Seguridad industrial'),
    
    -- Logística
    (dept_log, 'Transporte'),
    (dept_log, 'Almacenamiento'),
    (dept_log, 'Combustible'),
    (dept_log, 'Embalaje')
  ON CONFLICT (departamento_id, concepto) DO NOTHING;
  
  -- ============================================================================
  -- 4. MOVIMIENTOS (gastos e ingresos variados)
  -- ============================================================================
  
  -- Generar movimientos para cada mes
  mes_actual := fecha_inicio;
  WHILE mes_actual <= fecha_fin LOOP
    
    -- ADMINISTRACIÓN - Gastos
    INSERT INTO movimientos (tipo, departamento_id, concepto, numero_factura, fecha, moneda, monto, tasa_cambio, monto_usd, monto_bs, registrado_por)
    VALUES
      ('gasto', dept_admin, 'Material de oficina', 'F-' || TO_CHAR(mes_actual, 'YYYYMM') || '-001', 
       mes_actual + INTERVAL '5 days', 'USD', 250.00, 36.50, 250.00, 9125.00, usuario_registrado),
      ('gasto', dept_admin, 'Servicios de limpieza', 'F-' || TO_CHAR(mes_actual, 'YYYYMM') || '-002',
       mes_actual + INTERVAL '10 days', 'USD', 180.00, 36.50, 180.00, 6570.00, usuario_registrado),
      ('gasto', dept_admin, 'Papelería', 'F-' || TO_CHAR(mes_actual, 'YYYYMM') || '-003',
       mes_actual + INTERVAL '15 days', 'VES', 5000.00, 36.50, 136.99, 5000.00, usuario_registrado);
    
    -- RECURSOS HUMANOS - Gastos e Ingresos
    INSERT INTO movimientos (tipo, departamento_id, concepto, numero_factura, fecha, moneda, monto, tasa_cambio, monto_usd, monto_bs, registrado_por)
    VALUES
      ('gasto', dept_rrhh, 'Capacitación', 'F-' || TO_CHAR(mes_actual, 'YYYYMM') || '-004',
       mes_actual + INTERVAL '8 days', 'USD', 1200.00, 36.50, 1200.00, 43800.00, usuario_registrado),
      ('gasto', dept_rrhh, 'Eventos corporativos', 'F-' || TO_CHAR(mes_actual, 'YYYYMM') || '-005',
       mes_actual + INTERVAL '20 days', 'USD', 800.00, 36.50, 800.00, 29200.00, usuario_registrado),
      ('ingreso', dept_rrhh, 'Reembolso capacitación', 'F-' || TO_CHAR(mes_actual, 'YYYYMM') || '-006',
       mes_actual + INTERVAL '25 days', 'USD', 300.00, 36.50, 300.00, 10950.00, usuario_registrado);
    
    -- CONTABILIDAD - Gastos
    INSERT INTO movimientos (tipo, departamento_id, concepto, numero_factura, fecha, moneda, monto, tasa_cambio, monto_usd, monto_bs, registrado_por)
    VALUES
      ('gasto', dept_cont, 'Software contable', 'F-' || TO_CHAR(mes_actual, 'YYYYMM') || '-007',
       mes_actual + INTERVAL '3 days', 'USD', 450.00, 36.50, 450.00, 16425.00, usuario_registrado),
      ('gasto', dept_cont, 'Servicios profesionales', 'F-' || TO_CHAR(mes_actual, 'YYYYMM') || '-008',
       mes_actual + INTERVAL '12 days', 'USD', 1500.00, 36.50, 1500.00, 54750.00, usuario_registrado);
    
    -- VENTAS - Gastos e Ingresos
    INSERT INTO movimientos (tipo, departamento_id, concepto, numero_factura, fecha, moneda, monto, tasa_cambio, monto_usd, monto_bs, registrado_por)
    VALUES
      ('gasto', dept_ventas, 'Viajes de negocios', 'F-' || TO_CHAR(mes_actual, 'YYYYMM') || '-009',
       mes_actual + INTERVAL '7 days', 'USD', 2500.00, 36.50, 2500.00, 91250.00, usuario_registrado),
      ('gasto', dept_ventas, 'Cenas con clientes', 'F-' || TO_CHAR(mes_actual, 'YYYYMM') || '-010',
       mes_actual + INTERVAL '18 days', 'USD', 650.00, 36.50, 650.00, 23725.00, usuario_registrado),
      ('ingreso', dept_ventas, 'Venta de servicios', 'F-' || TO_CHAR(mes_actual, 'YYYYMM') || '-011',
       mes_actual + INTERVAL '22 days', 'USD', 8500.00, 36.50, 8500.00, 310250.00, usuario_registrado),
      ('ingreso', dept_ventas, 'Comisiones recibidas', 'F-' || TO_CHAR(mes_actual, 'YYYYMM') || '-012',
       mes_actual + INTERVAL '28 days', 'VES', 45000.00, 36.50, 1232.88, 45000.00, usuario_registrado);
    
    -- MARKETING - Gastos
    INSERT INTO movimientos (tipo, departamento_id, concepto, numero_factura, fecha, moneda, monto, tasa_cambio, monto_usd, monto_bs, registrado_por)
    VALUES
      ('gasto', dept_marketing, 'Publicidad digital', 'F-' || TO_CHAR(mes_actual, 'YYYYMM') || '-013',
       mes_actual + INTERVAL '4 days', 'USD', 3200.00, 36.50, 3200.00, 116800.00, usuario_registrado),
      ('gasto', dept_marketing, 'Redes sociales', 'F-' || TO_CHAR(mes_actual, 'YYYYMM') || '-014',
       mes_actual + INTERVAL '14 days', 'USD', 1800.00, 36.50, 1800.00, 65700.00, usuario_registrado),
      ('gasto', dept_marketing, 'Diseño gráfico', 'F-' || TO_CHAR(mes_actual, 'YYYYMM') || '-015',
       mes_actual + INTERVAL '21 days', 'VES', 25000.00, 36.50, 684.93, 25000.00, usuario_registrado);
    
    -- TECNOLOGÍA - Gastos
    INSERT INTO movimientos (tipo, departamento_id, concepto, numero_factura, fecha, moneda, monto, tasa_cambio, monto_usd, monto_bs, registrado_por)
    VALUES
      ('gasto', dept_tech, 'Licencias de software', 'F-' || TO_CHAR(mes_actual, 'YYYYMM') || '-016',
       mes_actual + INTERVAL '2 days', 'USD', 4500.00, 36.50, 4500.00, 164250.00, usuario_registrado),
      ('gasto', dept_tech, 'Servidores y hosting', 'F-' || TO_CHAR(mes_actual, 'YYYYMM') || '-017',
       mes_actual + INTERVAL '11 days', 'USD', 2800.00, 36.50, 2800.00, 102200.00, usuario_registrado),
      ('gasto', dept_tech, 'Soporte técnico', 'F-' || TO_CHAR(mes_actual, 'YYYYMM') || '-018',
       mes_actual + INTERVAL '19 days', 'USD', 1200.00, 36.50, 1200.00, 43800.00, usuario_registrado);
    
    -- OPERACIONES - Gastos
    INSERT INTO movimientos (tipo, departamento_id, concepto, numero_factura, fecha, moneda, monto, tasa_cambio, monto_usd, monto_bs, registrado_por)
    VALUES
      ('gasto', dept_ops, 'Mantenimiento de equipos', 'F-' || TO_CHAR(mes_actual, 'YYYYMM') || '-019',
       mes_actual + INTERVAL '6 days', 'USD', 950.00, 36.50, 950.00, 34675.00, usuario_registrado),
      ('gasto', dept_ops, 'Servicios públicos', 'F-' || TO_CHAR(mes_actual, 'YYYYMM') || '-020',
       mes_actual + INTERVAL '16 days', 'VES', 18000.00, 36.50, 493.15, 18000.00, usuario_registrado),
      ('ingreso', dept_ops, 'Reembolso servicios', 'F-' || TO_CHAR(mes_actual, 'YYYYMM') || '-021',
       mes_actual + INTERVAL '24 days', 'USD', 200.00, 36.50, 200.00, 7300.00, usuario_registrado);
    
    -- LOGÍSTICA - Gastos
    INSERT INTO movimientos (tipo, departamento_id, concepto, numero_factura, fecha, moneda, monto, tasa_cambio, monto_usd, monto_bs, registrado_por)
    VALUES
      ('gasto', dept_log, 'Transporte', 'F-' || TO_CHAR(mes_actual, 'YYYYMM') || '-022',
       mes_actual + INTERVAL '9 days', 'USD', 1800.00, 36.50, 1800.00, 65700.00, usuario_registrado),
      ('gasto', dept_log, 'Combustible', 'F-' || TO_CHAR(mes_actual, 'YYYYMM') || '-023',
       mes_actual + INTERVAL '17 days', 'VES', 32000.00, 36.50, 876.71, 32000.00, usuario_registrado),
      ('gasto', dept_log, 'Embalaje', 'F-' || TO_CHAR(mes_actual, 'YYYYMM') || '-024',
       mes_actual + INTERVAL '26 days', 'USD', 650.00, 36.50, 650.00, 23725.00, usuario_registrado);
    
    mes_actual := mes_actual + INTERVAL '1 month';
  END LOOP;
END $$;

COMMIT;

-- ============================================================================
-- VERIFICACIÓN DE DATOS
-- ============================================================================
SELECT 'departamentos' as tabla, COUNT(*) as registros FROM departamentos
UNION ALL
SELECT 'presupuestos', COUNT(*) FROM presupuestos
UNION ALL
SELECT 'conceptos_departamento', COUNT(*) FROM conceptos_departamento
UNION ALL
SELECT 'movimientos', COUNT(*) FROM movimientos
UNION ALL
SELECT 'movimientos (gastos)', COUNT(*) FROM movimientos WHERE tipo = 'gasto'
UNION ALL
SELECT 'movimientos (ingresos)', COUNT(*) FROM movimientos WHERE tipo = 'ingreso';

-- Resumen por departamento
SELECT 
  d.nombre as departamento,
  COUNT(m.id) as total_movimientos,
  COALESCE(SUM(CASE WHEN m.tipo = 'gasto' THEN m.monto_usd ELSE 0 END), 0) as total_gastos_usd,
  COALESCE(SUM(CASE WHEN m.tipo = 'ingreso' THEN m.monto_usd ELSE 0 END), 0) as total_ingresos_usd
FROM departamentos d
LEFT JOIN movimientos m ON d.id = m.departamento_id
GROUP BY d.id, d.nombre
ORDER BY d.nombre;
