/**
 * Arquivo: src/domain/etiquetas/etiquetaConfig.ts
 * Objetivo: centraliza a configuração de impressão de etiquetas de produto (medidas, colunas, conteúdo).
 * Entradas esperadas: nenhuma; expõe tipo, padrão e funções de carga/gravação em localStorage.
 */

/** Rolo térmico (uma linha de etiquetas por página) ou folha A4 avulsa. */
export type EtiquetaMediaMode = "rolo" | "folha";

export type EtiquetaConfig = {
  /** Largura de cada etiqueta, em milímetros. */
  labelWidthMm: number;
  /** Altura de cada etiqueta, em milímetros. */
  labelHeightMm: number;
  /** Quantas etiquetas cabem lado a lado na mídia. */
  columns: number;
  /** Espaço horizontal entre colunas, em milímetros (varia por fabricante do rolo). */
  gapXMm: number;
  /** Espaço vertical entre linhas, em milímetros. */
  gapYMm: number;
  /** Margem superior da mídia, em milímetros. */
  marginTopMm: number;
  /** Margem esquerda da mídia, em milímetros. */
  marginLeftMm: number;
  /** Tipo de mídia usada na impressão. */
  mediaMode: EtiquetaMediaMode;
  /** Altura reservada para o código de barras, em milímetros. */
  barcodeHeightMm: number;
  /** Exibe o nome fantasia da loja no topo da etiqueta. */
  showStoreName: boolean;
  /** Nome da loja impresso quando showStoreName está ativo. */
  storeName: string;
  /** Exibe a descrição do produto. */
  showName: boolean;
  /** Exibe o código de barras. */
  showBarcode: boolean;
  /** Exibe o código do produto em texto, abaixo das barras. */
  showCode: boolean;
  /** Exibe o preço de venda. */
  showPrice: boolean;
};

export const ETIQUETA_CONFIG_STORAGE_KEY = "horuspdv.etiquetas.config";

/**
 * Padrão do rolo mais comum no varejo brasileiro: 34x23mm em 3 colunas.
 * O gap horizontal de 2mm resulta em mídia de 106mm (3*34 + 2*2).
 */
export const DEFAULT_ETIQUETA_CONFIG: EtiquetaConfig = {
  labelWidthMm: 34,
  labelHeightMm: 23,
  columns: 3,
  gapXMm: 2,
  gapYMm: 2,
  marginTopMm: 0,
  marginLeftMm: 0,
  mediaMode: "rolo",
  barcodeHeightMm: 9,
  showStoreName: false,
  storeName: "",
  showName: true,
  showBarcode: true,
  showCode: true,
  showPrice: true,
};

/** Largura total da mídia derivada da configuração, em milímetros. */
export function getMediaWidthMm(config: EtiquetaConfig): number {
  const columns = Math.max(1, config.columns);
  return (
    columns * config.labelWidthMm +
    (columns - 1) * config.gapXMm +
    config.marginLeftMm * 2
  );
}

/** Altura de uma linha de etiquetas (etiqueta + espaçamento vertical), em milímetros. */
export function getRowHeightMm(config: EtiquetaConfig): number {
  return config.labelHeightMm + config.gapYMm;
}

/** Carrega a configuração salva, mesclada sobre os padrões (tolerante a chaves ausentes). */
export function loadEtiquetaConfig(): EtiquetaConfig {
  if (typeof window === "undefined") return { ...DEFAULT_ETIQUETA_CONFIG };
  try {
    const raw = window.localStorage.getItem(ETIQUETA_CONFIG_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_ETIQUETA_CONFIG };
    const parsed = JSON.parse(raw) as Partial<EtiquetaConfig>;
    return { ...DEFAULT_ETIQUETA_CONFIG, ...parsed };
  } catch {
    return { ...DEFAULT_ETIQUETA_CONFIG };
  }
}

/** Persiste a configuração no navegador. */
export function saveEtiquetaConfig(config: EtiquetaConfig): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    ETIQUETA_CONFIG_STORAGE_KEY,
    JSON.stringify(config),
  );
}
