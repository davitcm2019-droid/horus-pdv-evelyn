/**
 * Arquivo: src/domain/etiquetas/etiquetaHtml.ts
 * Objetivo: montar o HTML/CSS de impressão da folha ou rolo de etiquetas de produto.
 * Entradas esperadas: recebe as etiquetas já expandidas por quantidade e a configuração de layout.
 */
import { renderBarcodeSvg } from "./barcode";
import {
  getMediaWidthMm,
  getRowHeightMm,
  type EtiquetaConfig,
} from "./etiquetaConfig";

export type EtiquetaItem = {
  /** Código do produto, usado nas barras e no texto abaixo delas. */
  code: string;
  /** Descrição impressa na etiqueta. */
  name: string;
  /** Preço de venda como gravado no cadastro (string, ex.: "12,90"). */
  price: string;
};

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Formata o preço tolerando os formatos que aparecem no cadastro:
 * "12,90", "12.90" e "1.234,56". Se não for numérico, devolve o texto original.
 */
export function formatEtiquetaPrice(rawPrice: string): string {
  const raw = String(rawPrice ?? "").trim();
  if (!raw) return "";

  const digitsOnly = raw.replace(/[^\d,.-]/g, "");
  const lastComma = digitsOnly.lastIndexOf(",");
  const lastDot = digitsOnly.lastIndexOf(".");

  // O separador decimal é o último a aparecer; o outro é separador de milhar.
  let normalized = digitsOnly;
  if (lastComma > lastDot) {
    normalized = digitsOnly.replace(/\./g, "").replace(",", ".");
  } else if (lastDot > lastComma) {
    normalized = digitsOnly.replace(/,/g, "");
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return raw;

  return parsed.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/** Quantas linhas de etiquetas cabem em uma página, conforme a mídia escolhida. */
function getRowsPerPage(config: EtiquetaConfig): number {
  if (config.mediaMode === "rolo") return 1;

  const rowHeightMm = getRowHeightMm(config);
  if (rowHeightMm <= 0) return 1;

  const usableHeightMm = A4_HEIGHT_MM - config.marginTopMm * 2;
  // Soma-se o gap porque a última linha da página não precisa do espaçamento.
  const rows = Math.floor((usableHeightMm + config.gapYMm) / rowHeightMm);
  return Math.max(1, rows);
}

function chunk<T>(items: T[], size: number): T[][] {
  if (size <= 0) return [items];
  const pages: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    pages.push(items.slice(index, index + size));
  }
  return pages;
}

function buildLabelHtml(
  item: EtiquetaItem,
  config: EtiquetaConfig,
  barcodeCache: Map<string, string | null>,
): string {
  const parts: string[] = [];

  if (config.showStoreName && config.storeName.trim()) {
    parts.push(`<div class="store">${escapeHtml(config.storeName.trim())}</div>`);
  }

  if (config.showName) {
    parts.push(`<div class="name">${escapeHtml(item.name)}</div>`);
  }

  if (config.showBarcode) {
    if (!barcodeCache.has(item.code)) {
      barcodeCache.set(
        item.code,
        renderBarcodeSvg(item.code, {
          heightPx: 60,
          moduleWidth: 2,
        }),
      );
    }
    const svg = barcodeCache.get(item.code) ?? null;
    parts.push(
      svg
        ? `<div class="barcode">${svg}</div>`
        : `<div class="barcode barcode-failed">${escapeHtml(item.code)}</div>`,
    );
  }

  if (config.showCode) {
    parts.push(`<div class="code">${escapeHtml(item.code)}</div>`);
  }

  if (config.showPrice) {
    const price = formatEtiquetaPrice(item.price);
    if (price) parts.push(`<div class="price">${escapeHtml(price)}</div>`);
  }

  return `<div class="label">${parts.join("")}</div>`;
}

/**
 * Monta o documento HTML completo das etiquetas.
 *
 * No modo "rolo" cada página equivale a uma única linha de etiquetas, que é como
 * a impressora térmica trata a mídia contínua: ela avança exatamente uma linha
 * por página. No modo "folha" a página é A4 e as linhas fluem até encher.
 */
export function buildEtiquetaPrintHtml(
  items: EtiquetaItem[],
  config: EtiquetaConfig,
): string {
  const columns = Math.max(1, config.columns);
  const mediaWidthMm = getMediaWidthMm(config);
  const rowHeightMm = getRowHeightMm(config);
  const rowsPerPage = getRowsPerPage(config);
  const labelsPerPage = columns * rowsPerPage;

  const isRoll = config.mediaMode === "rolo";
  const pageWidthMm = isRoll ? mediaWidthMm : A4_WIDTH_MM;
  const pageHeightMm = isRoll ? rowHeightMm : A4_HEIGHT_MM;

  // Tipografia derivada da altura da etiqueta, para o layout acompanhar
  // mudanças de medida sem precisar de ajuste manual.
  const baseFontPt = (config.labelHeightMm * 0.24).toFixed(2);
  const smallFontPt = (config.labelHeightMm * 0.21).toFixed(2);
  const priceFontPt = (config.labelHeightMm * 0.43).toFixed(2);

  const barcodeCache = new Map<string, string | null>();
  const pages = chunk(items, labelsPerPage);

  const pagesHtml = pages
    .map((pageItems) => {
      const labelsHtml = pageItems
        .map((item) => buildLabelHtml(item, config, barcodeCache))
        .join("");
      return `<section class="page"><div class="grid">${labelsHtml}</div></section>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Etiquetas de produto</title>
<style>
  @page {
    size: ${pageWidthMm}mm ${pageHeightMm}mm;
    margin: 0;
  }

  * { box-sizing: border-box; }

  html, body {
    margin: 0;
    padding: 0;
    font-family: Arial, Helvetica, sans-serif;
    color: #000;
    background: #fff;
    -webkit-font-smoothing: none;
  }

  .page {
    width: ${pageWidthMm}mm;
    height: ${pageHeightMm}mm;
    padding: ${config.marginTopMm}mm ${config.marginLeftMm}mm;
    overflow: hidden;
    break-after: page;
    page-break-after: always;
  }

  .page:last-child {
    break-after: auto;
    page-break-after: auto;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(${columns}, ${config.labelWidthMm}mm);
    grid-auto-rows: ${config.labelHeightMm}mm;
    column-gap: ${config.gapXMm}mm;
    row-gap: ${config.gapYMm}mm;
  }

  .label {
    width: ${config.labelWidthMm}mm;
    height: ${config.labelHeightMm}mm;
    padding: 0.8mm 1mm;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.3mm;
    overflow: hidden;
    text-align: center;
    line-height: 1.1;
  }

  .store {
    font-size: ${smallFontPt}pt;
    font-weight: 700;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    width: 100%;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .name {
    font-size: ${baseFontPt}pt;
    width: 100%;
    max-height: ${(config.labelHeightMm * 0.24 * 0.3528 * 1.15 * 2).toFixed(2)}mm;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    word-break: break-word;
  }

  .barcode {
    width: 100%;
    height: ${config.barcodeHeightMm}mm;
    display: flex;
    align-items: stretch;
    justify-content: center;
  }

  .barcode svg {
    width: 100%;
    height: 100%;
    display: block;
  }

  .barcode-failed {
    font-size: ${smallFontPt}pt;
    align-items: center;
    font-family: "Courier New", monospace;
  }

  .code {
    font-size: ${smallFontPt}pt;
    font-family: "Courier New", monospace;
    letter-spacing: 0.06em;
    width: 100%;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .price {
    font-size: ${priceFontPt}pt;
    font-weight: 700;
    width: 100%;
    overflow: hidden;
    white-space: nowrap;
  }

  /* Só afeta a pré-visualização em tela; a impressão usa @page. */
  @media screen {
    body {
      background: #e5e7eb;
      padding: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    .page {
      background: #fff;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
      outline: 1px solid #cbd5e1;
    }
  }
</style>
</head>
<body>${pagesHtml}</body>
</html>`;
}
