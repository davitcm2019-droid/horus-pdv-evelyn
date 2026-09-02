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
  /**
   * Margem branca de cada lado das barras (quiet zone), em milímetros.
   * Sem ela o leitor não identifica onde o código começa e termina.
   * EAN-13 pede cerca de 2,3mm à esquerda; Code 128 é mais tolerante.
   */
  barcodeQuietZoneMm: number;
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
 * Versão do formato/calibração salvos.
 *
 * Suba este número sempre que corrigir uma MEDIDA padrão. Configuração
 * gravada com versão anterior é descartada, porque senão o valor errado
 * gravado no navegador continua vencendo o padrão corrigido — e o usuário
 * não tem como saber disso.
 *
 * 1 - versão inicial (assumia 2mm entre colunas)
 * 2 - calibrado para o rolo Artgraf: colunas coladas, margem 3,5mm, rolo 109mm
 */
export const ETIQUETA_CONFIG_VERSION = 2;

type StoredEtiquetaConfig = Partial<EtiquetaConfig> & { version?: number };

/**
 * Padrão calibrado para o rolo couchê 34x23mm x 3 colunas da Artgraf.
 *
 * Especificação do fabricante: colunas UNIDAS (sem espaçamento horizontal),
 * 2mm entre linhas, rolo de 109mm, tubete de 1 polegada, 3.600 etiquetas em
 * 30 metros.
 *
 * Confere: 3*34 + 2*3,5 de margem = 109mm de largura; e 30.000mm / (23+2)mm
 * = 1.200 linhas x 3 colunas = 3.600 etiquetas, exatamente o que o
 * fabricante informa.
 *
 * Como as colunas são coladas, a quiet zone do código de barras precisa sair
 * inteira de dentro dos 34mm da própria etiqueta — não há folga entre elas.
 */
export const DEFAULT_ETIQUETA_CONFIG: EtiquetaConfig = {
  labelWidthMm: 34,
  labelHeightMm: 23,
  columns: 3,
  gapXMm: 0,
  gapYMm: 2,
  marginTopMm: 0,
  marginLeftMm: 3.5,
  mediaMode: "rolo",
  barcodeHeightMm: 9,
  barcodeQuietZoneMm: 2.5,
  showStoreName: false,
  storeName: "",
  showName: true,
  showBarcode: true,
  showCode: true,
  showPrice: true,
};

/** Recuo interno horizontal da etiqueta, em milímetros (espelha o CSS de impressão). */
export const LABEL_PADDING_X_MM = 1;

/** Largura nominal do módulo (barra mais fina) do EAN-13, em milímetros. */
const EAN13_NOMINAL_MODULE_MM = 0.33;

/** Um EAN-13 ocupa 95 módulos entre a primeira e a última barra. */
const EAN13_MODULES = 95;

/** Largura disponível para as barras dentro da etiqueta, em milímetros. */
export function getBarcodeUsableWidthMm(config: EtiquetaConfig): number {
  return Math.max(
    0,
    config.labelWidthMm -
      2 * (LABEL_PADDING_X_MM + config.barcodeQuietZoneMm),
  );
}

/**
 * Fator de ampliação do EAN-13 resultante das medidas atuais.
 *
 * A norma admite de 0,80 a 2,00; abaixo de 0,80 as barras ficam finas demais
 * para a resolução da térmica e a leitura começa a falhar.
 */
export function getEan13Magnification(config: EtiquetaConfig): number {
  const moduleMm = getBarcodeUsableWidthMm(config) / EAN13_MODULES;
  return moduleMm / EAN13_NOMINAL_MODULE_MM;
}

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

/**
 * Carrega a configuração salva, mesclada sobre os padrões.
 *
 * Configuração gravada por uma versão anterior é ignorada: as medidas padrão
 * mudaram e manter o valor antigo faria a impressão sair errada silenciosamente.
 */
export function loadEtiquetaConfig(): EtiquetaConfig {
  if (typeof window === "undefined") return { ...DEFAULT_ETIQUETA_CONFIG };
  try {
    const raw = window.localStorage.getItem(ETIQUETA_CONFIG_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_ETIQUETA_CONFIG };

    const { version, ...parsed } = JSON.parse(raw) as StoredEtiquetaConfig;
    if (version !== ETIQUETA_CONFIG_VERSION) {
      return { ...DEFAULT_ETIQUETA_CONFIG };
    }

    return { ...DEFAULT_ETIQUETA_CONFIG, ...parsed };
  } catch {
    return { ...DEFAULT_ETIQUETA_CONFIG };
  }
}

/** Persiste a configuração no navegador, carimbada com a versão atual. */
export function saveEtiquetaConfig(config: EtiquetaConfig): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    ETIQUETA_CONFIG_STORAGE_KEY,
    JSON.stringify({ ...config, version: ETIQUETA_CONFIG_VERSION }),
  );
}
