-- ============================================================================
-- Script para limpiar todas las tablas excepto usuarios y centros de costo
-- ============================================================================
-- Este script elimina todos los datos de las tablas operativas
-- Mantiene intactas: profiles, razones_sociales, centros_costo
-- ============================================================================

BEGIN;

-- Limpiar en orden para respetar foreign keys
DELETE FROM permisos_usuario;
DELETE FROM herramientas;
DELETE FROM modulos;
DELETE FROM usuario_departamentos;
DELETE FROM conceptos_departamento;
DELETE FROM presupuestos;
DELETE FROM movimientos;
DELETE FROM departamentos;

COMMIT;

-- Verificar que las tablas de usuarios y centros de costo están intactas
SELECT 'profiles' as tabla, COUNT(*) as registros FROM profiles
UNION ALL
SELECT 'razones_sociales', COUNT(*) FROM razones_sociales
UNION ALL
SELECT 'centros_costo', COUNT(*) FROM centros_costo;
