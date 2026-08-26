/**
 * Arquivo: src/components/Admin/ReceiptPreviewModal.tsx
 * Objetivo: exibir e imprimir uma prévia de cupom não fiscal reutilizável no PDV.
  * Entradas esperadas: recebe dados da venda, itens, empresa e callbacks para fechar/imprimir o recibo.
*/
import { Printer, ReceiptText, X } from "lucide-react";
import { loadCupomConfig } from "@/domain/cupom/cupomConfig";
import { buildReceiptPrintHtml, formatReceiptDate } from "@/domain/cupom/receiptHtml";

export type PaymentType = "dinheiro" | "pix" | "debito" | "credito" | string;

export type ReceiptCompany = {
  fantasyName?: string;
  corporateName?: string;
  cnpj?: string;
  address?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  uf?: string;
  phone?: string;
  sacPhone?: string;
} | null;

export type SaleReceiptItem = {
  id: string;
  code: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type SaleReceipt = {
  saleNumber: string;
  issuedAt: string;
  printedAt?: string;
  company: ReceiptCompany;
  customerCpf: string;
  paymentType: PaymentType;
  paymentLabel: string;
  operatorName: string;
  subtotal: number;
  cashGiven: number;
  change: number;
  items: SaleReceiptItem[];
};

export default function ReceiptPreviewModal({
  receipt,
  formatMoney,
  onClose,
}: {
  receipt: SaleReceipt;
  formatMoney: (value: number) => string;
  onClose: () => void;
}) {
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
  const cupomConfig = loadCupomConfig();
  const headerMessage = cupomConfig.headerMessage.trim();
  const footerMessage = cupomConfig.footerMessage.trim();

  const printReceipt = () => {
    const popup = window.open("", "_blank", "width=420,height=720");
    if (!popup) return;
    popup.document.open();
    popup.document.write(buildReceiptPrintHtml(receipt, formatMoney, cupomConfig));
    popup.document.close();
  };

  return (
    <div className="fixed inset-0 z-layer-dialog flex items-end bg-black/55 px-3 backdrop-blur-sm md:items-center md:justify-center">
      <div className="w-full max-w-4xl overflow-hidden rounded-t-2xl border border-border-primary bg-bg-light shadow-2xl md:rounded-2xl">
        <div className="flex items-center justify-between border-b border-border-primary px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <ReceiptText size={18} />
            </span>
            <div>
              <h2 className="text-base font-semibold text-text-primary">Previa de impressao</h2>
              <p className="text-xs text-text-secondary">Cupom da venda {receipt.saleNumber}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border-primary text-text-secondary hover:bg-hover-light"
            aria-label="Fechar prévia de impressão"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid max-h-[74vh] overflow-y-auto bg-bg-primary md:grid-cols-[minmax(0,1fr)_320px]">
          <div className="p-4">
            <div className="mx-auto w-full max-w-[360px] border border-border-secondary bg-white px-5 py-4 font-mono text-[12px] leading-tight text-slate-950 shadow-sm">
              <div className="text-center">
                {cupomConfig.showStoreName ? (
                  <p className="text-sm font-bold uppercase">{companyName}</p>
                ) : null}
                {headerMessage ? <p>{headerMessage}</p> : null}
                <p>{receipt.company?.corporateName || companyName}</p>
                <p>CNPJ: {receipt.company?.cnpj || "-"}</p>
                {companyAddress ? <p>{companyAddress}</p> : null}
                {companyCity ? <p>{companyCity}</p> : null}
                <p>Telefone: {receipt.company?.phone || receipt.company?.sacPhone || "-"}</p>
              </div>

              <div className="my-3 border-t border-dashed border-slate-500" />

              <div className="space-y-1">
                <p>CUPOM NAO FISCAL</p>
                <p>Venda: {receipt.saleNumber}</p>
                <p>Emissao: {formatReceiptDate(receipt.issuedAt)}</p>
                <p>Operador: {receipt.operatorName}</p>
                <p>CPF/CNPJ consumidor: {receipt.customerCpf || "-"}</p>
              </div>

              <div className="my-3 border-t border-dashed border-slate-500" />

              <div className="grid grid-cols-[28px_1fr_44px_64px] gap-1 font-bold">
                <span>#</span>
                <span>ITEM</span>
                <span className="text-right">QTD</span>
                <span className="text-right">TOTAL</span>
              </div>
              <div className="mt-1 space-y-2">
                {receipt.items.map((item, index) => (
                  <div key={`${item.id}-${index}`}>
                    <div className="grid grid-cols-[28px_1fr_44px_64px] gap-1">
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <span className="truncate">{item.name}</span>
                      <span className="text-right">{item.quantity}</span>
                      <span className="text-right">{formatMoney(item.total)}</span>
                    </div>
                    <p className="pl-7 text-[11px]">
                      {item.code} - UN {formatMoney(item.unitPrice)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="my-3 border-t border-dashed border-slate-500" />

              <div className="space-y-1">
                <div className="flex justify-between font-bold">
                  <span>TOTAL</span>
                  <span>R$ {formatMoney(receipt.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pagamento</span>
                  <span>{receipt.paymentLabel}</span>
                </div>
                {receipt.paymentType === "dinheiro" ? (
                  <>
                    <div className="flex justify-between">
                      <span>Valor recebido</span>
                      <span>R$ {formatMoney(receipt.cashGiven)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Troco</span>
                      <span>R$ {formatMoney(receipt.change)}</span>
                    </div>
                  </>
                ) : null}
              </div>

              {footerMessage ? (
                <>
                  <div className="my-3 border-t border-dashed border-slate-500" />
                  <p className="whitespace-pre-line text-center">{footerMessage}</p>
                </>
              ) : null}
            </div>
          </div>

          <aside className="border-t border-border-primary bg-bg-light p-4 md:border-l md:border-t-0">
            <div className="rounded-xl border border-success/25 bg-success/10 px-3 py-2 text-sm font-semibold text-success">
              Pronto para reimpressao
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs uppercase text-text-tertiary">Venda</dt>
                <dd className="font-semibold text-text-primary">{receipt.saleNumber}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-text-tertiary">Emissao</dt>
                <dd className="font-semibold text-text-primary">
                  {formatReceiptDate(receipt.issuedAt)}
                </dd>
              </div>
              {receipt.printedAt ? (
                <div>
                  <dt className="text-xs uppercase text-text-tertiary">Solicitada em</dt>
                  <dd className="font-semibold text-text-primary">{receipt.printedAt}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-xs uppercase text-text-tertiary">Itens</dt>
                <dd className="font-semibold text-text-primary">{receipt.items.length}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-text-tertiary">Total</dt>
                <dd className="text-2xl font-bold text-text-primary">
                  R$ {formatMoney(receipt.subtotal)}
                </dd>
              </div>
            </dl>
          </aside>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-border-primary px-4 py-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="btn-secondary">
            Fechar
          </button>
          <button type="button" onClick={printReceipt} className="btn-primary inline-flex items-center justify-center gap-2">
            <Printer size={16} />
            Imprimir agora
          </button>
        </div>
      </div>
    </div>
  );
}
