-- ============================================================================
-- Migración: Tabla de conceptos por departamento
-- Permite reutilizar conceptos de gastos/ingresos por unidad presupuestaria
-- ============================================================================

CREATE TABLE IF NOT EXISTS conceptos_departamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  departamento_id UUID NOT NULL REFERENCES departamentos(id) ON DELETE CASCADE,
  concepto TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(departamento_id, concepto)
);

-- Índice para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_conceptos_departamento ON conceptos_departamento(departamento_id);
CREATE INDEX IF NOT EXISTS idx_conceptos_texto ON conceptos_departamento(concepto);

-- Función para obtener conceptos de un departamento
CREATE OR REPLACE FUNCTION obtener_conceptos_departamento(p_departamento_id UUID)
RETURNS TABLE(concepto TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT c.concepto
  FROM conceptos_departamento c
  WHERE c.departamento_id = p_departamento_id
  ORDER BY c.concepto;
END;
$$ LANGUAGE plpgsql;

-- Función para agregar concepto si no existe
CREATE OR REPLACE FUNCTION agregar_concepto_departamento(
  p_departamento_id UUID,
  p_concepto TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO conceptos_departamento (departamento_id, concepto)
  VALUES (p_departamento_id, TRIM(p_concepto))
  ON CONFLICT (departamento_id, concepto) DO NOTHING;
END;
$$ LANGUAGE plpgsql;
