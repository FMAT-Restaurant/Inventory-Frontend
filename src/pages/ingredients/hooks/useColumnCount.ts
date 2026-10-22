import { useEffect, useState } from "react";

/**
 * Número de columnas del catálogo, según los mismos breakpoints que usa
 * `.grid-responsive` en `index.css`:
 *   - <= 1199px -> 2 columnas
 *   - <= 767px  -> 1 columna
 *   - resto     -> 3 columnas
 */
const COLUMNAS_POR_ANCHO = (): number => {
  if (typeof window === "undefined") return 3;
  if (window.matchMedia("(max-width: 767px)").matches) return 1;
  if (window.matchMedia("(max-width: 1199px)").matches) return 2;
  return 3;
};

/**
 * Hook que expone cuántas columnas debe usar la vista para repartir las
 * cards. Permite que el reparto en columnas se mantenga fijo: al expandir
 * una card solo se desplazan hacia abajo las de su propia columna.
 */
export function useColumnCount(): number {
  const [columnCount, setColumnCount] = useState(COLUMNAS_POR_ANCHO);

  useEffect(() => {
    const update = () => setColumnCount(COLUMNAS_POR_ANCHO());

    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return columnCount;
}
