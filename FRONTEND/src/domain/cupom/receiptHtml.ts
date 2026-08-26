/**
 * Arquivo: src/domain/cupom/receiptHtml.ts
 * Objetivo: gera o HTML de impressão do cupom não fiscal, honrando a configuração da loja.
 * Entradas esperadas: dados do cupom, formatador de moeda e configuração do cupom.
 */
import type { SaleReceipt } from "@/components/Admin/ReceiptPreviewModal";
import type { CupomConfig } from "@/domain/cupom/cupomConfig";
import { DEFAULT_CUPOM_CONFIG } from "@/domain/cupom/cupomConfig";

export function formatReceiptDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export type ReceiptHtmlOptions = {
  /** Dispara window.print() ao carregar (padrão true). Use false para prévia em iframe. */
  autoPrint?: boolean;
};

/** Gera o documento HTML completo do cupom, pronto para impressão. */
export function buildReceiptPrintHtml(
  receipt: SaleReceipt,
  formatMoney: (value: number) => string,
  config: CupomConfig = DEFAULT_CUPOM_CONFIG,
  options: ReceiptHtmlOptions = {},
): string {
  const autoPrint = options.autoPrint ?? true;
  const is58 = config.paperWidth === "58";
  const pageWidth = is58 ? "58mm" : "80mm";
  const contentWidth = is58 ? "50mm" : "72mm";
  // Colunas do grid de itens ajustadas por largura de papel.
  const gridCols = is58 ? "18px 1fr 26px 46px" : "24px 1fr 34px 54px";

  const companyName =
    receipt.company?.fantasyName || receipt.company?.corporateName || "Evelyn Acessórios";
  const companyAddress = [
    receipt.company?.address,
    receipt.company?.number,
    receipt.company?.neighborhood,
  ]
    .filter(Boolean)
    .join(", ");
  const companyCity = [receipt.company?.city, receipt.company?.uf].filter(Boolean).join(" - ");

  const rows = receipt.items
    .map(
      (item, index) => `
        <div class="item">
          <div class="line grid">
            <span>${String(index + 1).padStart(2, "0")}</span>
            <span>${escapeHtml(item.name)}</span>
            <span class="right">${item.quantity}</span>
            <span class="right">${formatMoney(item.total)}</span>
          </div>
          <div class="item-meta">${escapeHtml(item.code)} - UN ${formatMoney(item.unitPrice)}</div>
        </div>
      `,
    )
    .join("");

  const headerMessage = config.headerMessage.trim();
  const footerMessage = config.footerMessage.trim();

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>Cupom ${escapeHtml(receipt.saleNumber)}</title>
    <style>
      @page { size: ${pageWidth} auto; margin: 3mm; }
      * { box-sizing: border-box; }
      body { margin: 0; color: #020617; font: ${is58 ? "11px" : "12px"}/1.25 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
      .receipt { width: ${contentWidth}; margin: 0 auto; }
      .center { text-align: center; }
      .brand { font-size: ${is58 ? "13px" : "14px"}; font-weight: 800; text-transform: uppercase; }
      .slogan { margin-top: 2px; }
      .divider { border-top: 1px dashed #475569; margin: 9px 0; }
      .line { display: flex; justify-content: space-between; gap: 8px; }
      .grid { display: grid; grid-template-columns: ${gridCols}; gap: 4px; }
      .right { text-align: right; }
      .bold { font-weight: 800; }
      .item { margin-top: 6px; }
      .item-meta { padding-left: ${is58 ? "20px" : "28px"}; font-size: ${is58 ? "10px" : "11px"}; }
      .footer { margin-top: 4px; white-space: pre-line; }
    </style>
  </head>
  <body>
    <main class="receipt">
      <section class="center">
        ${config.showStoreName ? `<div class="brand">${escapeHtml(companyName)}</div>` : ""}
        ${headerMessage ? `<div class="slogan">${escapeHtml(headerMessage)}</div>` : ""}
        <div>${escapeHtml(receipt.company?.corporateName || companyName)}</div>
        <div>CNPJ: ${escapeHtml(receipt.company?.cnpj || "-")}</div>
        ${companyAddress ? `<div>${escapeHtml(companyAddress)}</div>` : ""}
        ${companyCity ? `<div>${escapeHtml(companyCity)}</div>` : ""}
        <div>Telefone: ${escapeHtml(receipt.company?.phone || receipt.company?.sacPhone || "-")}</div>
      </section>
      <div class="divider"></div>
      <section>
        <div>CUPOM NAO FISCAL</div>
        <div>Venda: ${escapeHtml(receipt.saleNumber)}</div>
        <div>Emissao: ${escapeHtml(formatReceiptDate(receipt.issuedAt))}</div>
        <div>Operador: ${escapeHtml(receipt.operatorName || "-")}</div>
        <div>CPF/CNPJ consumidor: ${escapeHtml(receipt.customerCpf || "-")}</div>
      </section>
      <div class="divider"></div>
      <section>
        <div class="grid bold"><span>#</span><span>ITEM</span><span class="right">QTD</span><span class="right">TOTAL</span></div>
        ${rows}
      </section>
      <div class="divider"></div>
      <section>
        <div class="line bold"><span>TOTAL</span><span>R$ ${formatMoney(receipt.subtotal)}</span></div>
        <div class="line"><span>Pagamento</span><span>${escapeHtml(receipt.paymentLabel || "-")}</span></div>
        ${
          receipt.paymentType === "dinheiro"
            ? `<div class="line"><span>Valor recebido</span><span>R$ ${formatMoney(receipt.cashGiven)}</span></div>
               <div class="line"><span>Troco</span><span>R$ ${formatMoney(receipt.change)}</span></div>`
            : ""
        }
      </section>
      <div class="divider"></div>
      ${footerMessage ? `<p class="center footer">${escapeHtml(footerMessage)}</p>` : ""}
    </main>
    ${autoPrint ? `<script>window.addEventListener("load", () => window.print());</script>` : ""}
  </body>
</html>`;
}
