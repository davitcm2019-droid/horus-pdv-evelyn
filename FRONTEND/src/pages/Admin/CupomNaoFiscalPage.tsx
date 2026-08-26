/**
 * Arquivo: src/pages/Admin/CupomNaoFiscalPage.tsx
 * Objetivo: configurar o cupom não fiscal e a integração de impressão da frente de caixa.
 * Entradas esperadas: não recebe props; carrega/salva a configuração do cupom em localStorage.
 */
import { type ReactNode, useMemo, useState } from "react";
import { Info, Printer, ReceiptText, Save } from "lucide-react";
import PageHeader from "@/components/Admin/PageHeader";
import PageLayout from "@/layout/PageLayout";
import { YesNoSegmentedControl } from "@/components/Form";
import { useStatusDialog } from "@/hooks/Dialog/useStatusDialog";
import type { SaleReceipt } from "@/components/Admin/ReceiptPreviewModal";
import {
  type CupomConfig,
  type CupomPaperWidth,
  type CupomPrintMode,
  DEFAULT_CUPOM_CONFIG,
  loadCupomConfig,
  saveCupomConfig,
} from "@/domain/cupom/cupomConfig";
import { buildReceiptPrintHtml } from "@/domain/cupom/receiptHtml";

const money = (value: number) =>
  value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Cupom de exemplo usado na prévia e na impressão de teste. */
const SAMPLE_RECEIPT: SaleReceipt = {
  saleNumber: "TESTE-0001",
  issuedAt: new Date().toISOString(),
  company: null,
  customerCpf: "",
  paymentType: "dinheiro",
  paymentLabel: "Dinheiro",
  operatorName: "Operador de teste",
  subtotal: 89.9,
  cashGiven: 100,
  change: 10.1,
  items: [
    { id: "1", code: "7891000", name: "Capa de silicone", quantity: 1, unitPrice: 39.9, total: 39.9 },
    { id: "2", code: "7891001", name: "Pelicula 3D", quantity: 2, unitPrice: 25.0, total: 50.0 },
  ],
};

export default function CupomNaoFiscalPage() {
  const statusDialog = useStatusDialog();
  const [config, setConfig] = useState<CupomConfig>(() => loadCupomConfig());

  const set = <K extends keyof CupomConfig>(key: K, value: CupomConfig[K]) =>
    setConfig((prev) => ({ ...prev, [key]: value }));

  const previewHtml = useMemo(
    () => buildReceiptPrintHtml(SAMPLE_RECEIPT, money, config, { autoPrint: false }),
    [config],
  );

  const handleSave = () => {
    saveCupomConfig(config);
    statusDialog.success("Configuração do cupom salva com sucesso.");
  };

  const handleReset = () => {
    setConfig({ ...DEFAULT_CUPOM_CONFIG });
    statusDialog.success("Configuração restaurada para o padrão (não esqueça de salvar).");
  };

  const handleTestPrint = () => {
    const popup = window.open("", "_blank", "width=420,height=720");
    if (!popup) {
      statusDialog.error("Não foi possível abrir a janela de impressão (verifique o bloqueador de pop-up).");
      return;
    }
    popup.document.open();
    popup.document.write(buildReceiptPrintHtml(SAMPLE_RECEIPT, money, config));
    popup.document.close();
  };

  return (
    <PageLayout size="wide" className="space-y-4 py-4 md:space-y-6 md:py-6 lg:py-8">
      <PageHeader
        title="Cupom Não Fiscal"
        description="Configure o layout do cupom e a integração com a impressora da frente de caixa."
        action={
          <span className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-3 py-2 text-sm font-semibold text-secondary">
            <ReceiptText size={16} />
            Sem valor fiscal
          </span>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Coluna de configuração */}
        <div className="space-y-4">
          <section className="card space-y-4 p-5">
            <h2 className="text-lg font-semibold text-text-primary">Layout do cupom</h2>

            <Field label="Largura do papel">
              <div className="inline-flex overflow-hidden rounded-lg border border-border-secondary">
                {(["58", "80"] as CupomPaperWidth[]).map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => set("paperWidth", w)}
                    className={`px-4 py-2 text-sm font-semibold transition ${
                      config.paperWidth === w
                        ? "bg-secondary text-text-light"
                        : "bg-bg-light text-text-secondary hover:bg-hover-light"
                    }`}
                  >
                    {w}mm
                  </button>
                ))}
              </div>
            </Field>

            <Field
              label="Exibir nome da loja em destaque"
              hint="Nome fantasia no topo do cupom, em maiúsculas."
            >
              <YesNoSegmentedControl
                value={config.showStoreName}
                onChange={(v) => set("showStoreName", v)}
                ariaLabel="Exibir nome da loja"
              />
            </Field>

            <Field label="Slogan / linha de destaque (opcional)">
              <input
                className="input-field w-full"
                value={config.headerMessage}
                maxLength={60}
                placeholder="Ex.: Acessórios que combinam com você"
                onChange={(e) => set("headerMessage", e.target.value)}
              />
            </Field>

            <Field label="Mensagem de rodapé" hint="Ex.: política de troca. Aceita mais de uma linha.">
              <textarea
                className="input-field min-h-20 w-full resize-y"
                value={config.footerMessage}
                maxLength={220}
                placeholder="Obrigado pela preferência! Trocas em até 7 dias com este cupom."
                onChange={(e) => set("footerMessage", e.target.value)}
              />
            </Field>
          </section>

          <section className="card space-y-4 p-5">
            <h2 className="text-lg font-semibold text-text-primary">Comportamento de impressão</h2>

            <Field
              label="Abrir prévia ao finalizar a venda"
              hint="Mostra o cupom automaticamente quando a venda é confirmada."
            >
              <YesNoSegmentedControl
                value={config.autoPreview}
                onChange={(v) => set("autoPreview", v)}
                ariaLabel="Abrir prévia automaticamente"
              />
            </Field>

            <Field
              label="Imprimir automaticamente"
              hint="Dispara a impressão assim que a prévia abre, sem clique extra."
            >
              <YesNoSegmentedControl
                value={config.autoPrint}
                onChange={(v) => set("autoPrint", v)}
                ariaLabel="Imprimir automaticamente"
              />
            </Field>

            <Field label="Envio para a impressora">
              <div className="inline-flex overflow-hidden rounded-lg border border-border-secondary">
                {(
                  [
                    { key: "navegador", label: "Navegador" },
                    { key: "rede", label: "Rede (ESC/POS)" },
                  ] as { key: CupomPrintMode; label: string }[]
                ).map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => set("printMode", opt.key)}
                    className={`px-4 py-2 text-sm font-semibold transition ${
                      config.printMode === opt.key
                        ? "bg-secondary text-text-light"
                        : "bg-bg-light text-text-secondary hover:bg-hover-light"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </Field>

            {config.printMode === "navegador" ? (
              <InfoNote>
                A impressão usa o diálogo do navegador na máquina do caixa. Funciona com qualquer
                impressora instalada no Windows — inclusive térmicas USB. Selecione a térmica como
                impressora padrão para agilizar.
              </InfoNote>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
                  <Field label="IP da impressora">
                    <input
                      className="input-field w-full"
                      value={config.printerIp}
                      placeholder="192.168.0.100"
                      inputMode="decimal"
                      onChange={(e) => set("printerIp", e.target.value)}
                    />
                  </Field>
                  <Field label="Porta">
                    <input
                      className="input-field w-full"
                      value={config.printerPort}
                      placeholder="9100"
                      inputMode="numeric"
                      onChange={(e) => set("printerPort", e.target.value)}
                    />
                  </Field>
                </div>
                <InfoNote tone="warning">
                  Impressão ESC/POS direta para impressora de rede: exige impressora com porta
                  Ethernet/Wi-Fi. O envio pelo servidor ainda será habilitado — por enquanto, use o
                  modo Navegador para operar.
                </InfoNote>
              </div>
            )}
          </section>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <button type="button" onClick={handleReset} className="btn-secondary">
              Restaurar padrão
            </button>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleTestPrint}
                className="btn-secondary inline-flex items-center justify-center gap-2"
              >
                <Printer size={16} />
                Imprimir teste
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="btn-primary inline-flex items-center justify-center gap-2"
              >
                <Save size={16} />
                Salvar configuração
              </button>
            </div>
          </div>
        </div>

        {/* Coluna de prévia ao vivo */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="card overflow-hidden p-4">
            <p className="mb-3 text-sm font-semibold text-text-secondary">Prévia do cupom</p>
            <div className="rounded-xl bg-bg-gray-theme p-3">
              <iframe
                title="Prévia do cupom não fiscal"
                srcDoc={previewHtml}
                className="h-[520px] w-full rounded-lg border border-border-secondary bg-white"
              />
            </div>
            <p className="mt-3 text-xs text-text-tertiary">
              Prévia com dados de exemplo. Na venda real, o cabeçalho usa os dados de{" "}
              <strong>Minha Empresa</strong>.
            </p>
          </div>
        </aside>
      </div>

      {statusDialog.Dialog}
    </PageLayout>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        {hint ? <p className="mt-0.5 text-xs text-text-tertiary">{hint}</p> : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function InfoNote({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: "info" | "warning";
}) {
  const styles =
    tone === "warning"
      ? "border-primary/25 bg-primary/8 text-text-secondary"
      : "border-accent/25 bg-accent/8 text-text-secondary";
  return (
    <div className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${styles}`}>
      <Info size={16} className="mt-0.5 shrink-0 text-accent" />
      <p className="leading-5">{children}</p>
    </div>
  );
}
