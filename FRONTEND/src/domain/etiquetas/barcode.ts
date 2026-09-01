/**
 * Arquivo: src/domain/etiquetas/barcode.ts
 * Objetivo: detectar a simbologia adequada ao código do produto e gerar o SVG do código de barras.
 * Entradas esperadas: recebe o código cadastrado do produto e opções de altura/espessura das barras.
 */
import JsBarcode from "jsbarcode";

export type BarcodeSymbology = "EAN13" | "EAN8" | "CODE128";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

/** Calcula o dígito verificador de EAN-13/EAN-8 a partir dos dígitos sem o verificador. */
function calcEanCheckDigit(digitsWithoutCheck: string): number {
  // EAN-13 pondera 1,3,1,3... da esquerda; EAN-8 pondera 3,1,3,1...
  const startsWithThree = digitsWithoutCheck.length % 2 === 1;
  let sum = 0;

  for (let index = 0; index < digitsWithoutCheck.length; index += 1) {
    const digit = Number(digitsWithoutCheck[index]);
    const isThreeWeighted = startsWithThree
      ? index % 2 === 0
      : index % 2 === 1;
    sum += isThreeWeighted ? digit * 3 : digit;
  }

  return (10 - (sum % 10)) % 10;
}

function isValidEan(code: string, totalLength: 8 | 13): boolean {
  if (code.length !== totalLength || !/^\d+$/.test(code)) return false;
  const body = code.slice(0, totalLength - 1);
  const check = Number(code[totalLength - 1]);
  return calcEanCheckDigit(body) === check;
}

/**
 * Escolhe a simbologia pelo formato do código.
 *
 * O cadastro guarda ProductCode como texto livre, então só usamos EAN quando o
 * código realmente é um EAN válido (tamanho e dígito verificador corretos).
 * Qualquer outra coisa vira Code 128, que aceita alfanumérico de tamanho variável.
 */
export function detectSymbology(rawCode: string): BarcodeSymbology | null {
  const code = rawCode.trim();
  if (!code) return null;
  if (isValidEan(code, 13)) return "EAN13";
  if (isValidEan(code, 8)) return "EAN8";
  return "CODE128";
}

export type BarcodeSvgOptions = {
  /** Espessura do módulo mais fino, em px do viewBox. */
  moduleWidth?: number;
  /** Altura das barras, em px do viewBox. */
  heightPx?: number;
};

/**
 * Gera o SVG do código de barras como string, pronto para embutir no HTML de impressão.
 *
 * O SVG sai sem width/height fixos e com viewBox + preserveAspectRatio="none",
 * para que o CSS estique as barras exatamente até a largura útil da etiqueta.
 * shape-rendering="crispEdges" evita o antialiasing que borra as barras e
 * atrapalha a leitura no scanner.
 *
 * Retorna null quando o código não pode ser codificado (ex.: caractere inválido).
 */
export function renderBarcodeSvg(
  rawCode: string,
  options: BarcodeSvgOptions = {},
): string | null {
  if (typeof document === "undefined") return null;

  const code = rawCode.trim();
  const format = detectSymbology(code);
  if (!format) return null;

  const { moduleWidth = 2, heightPx = 60 } = options;
  const svg = document.createElementNS(SVG_NAMESPACE, "svg");

  try {
    JsBarcode(svg, code, {
      format,
      width: moduleWidth,
      height: heightPx,
      displayValue: false,
      margin: 0,
      background: "transparent",
      lineColor: "#000000",
    });
  } catch {
    return null;
  }

  // O JsBarcode grava as medidas com unidade (ex.: "190px"), então é parseFloat
  // e não Number: Number("190px") é NaN e descartaria todo SVG válido.
  const width = Number.parseFloat(svg.getAttribute("width") ?? "");
  const height = Number.parseFloat(svg.getAttribute("height") ?? "");
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    return null;
  }

  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute("shape-rendering", "crispEdges");
  svg.removeAttribute("width");
  svg.removeAttribute("height");

  return new XMLSerializer().serializeToString(svg);
}
