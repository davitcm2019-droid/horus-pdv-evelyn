/**
 * Arquivo: src/pages/Admin/LabelsPage.tsx
 * Objetivo: selecionar produtos, configurar o layout e imprimir etiquetas com código de barras.
 * Entradas esperadas: não recebe props; carrega produtos da API e a configuração de etiquetas do localStorage.
 */
import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  Barcode,
  Info,
  Printer,
  RotateCcw,
  Save,
  Search,
  Tags,
  Trash2,
} from "lucide-react";
import PageHeader from "@/components/Admin/PageHeader";
import PageLayout from "@/layout/PageLayout";
import { YesNoSegmentedControl } from "@/components/Form";
import { useStatusDialog } from "@/hooks/Dialog/useStatusDialog";
import { productService, type ProductDto } from "@/services/api/productService";
import { detectSymbology } from "@/domain/etiquetas/barcode";
import {
  DEFAULT_ETIQUETA_CONFIG,
  getMediaWidthMm,
  loadEtiquetaConfig,
  saveEtiquetaConfig,
  type EtiquetaConfig,
  type EtiquetaMediaMode,
} from "@/domain/etiquetas/etiquetaConfig";
import {
  buildEtiquetaPrintHtml,
  formatEtiquetaPrice,
  type EtiquetaItem,
} from "@/domain/etiquetas/etiquetaHtml";

/** Limite de páginas renderizadas na prévia, para não travar a tela em tiragens grandes. */
const PREVIEW_PAGE_LIMIT = 6;

type Quantities = Record<string, number>;

export default function LabelsPage() {
  const statusDialog = useStatusDialog();

  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [scanCode, setScanCode] = useState("");
  const [quantities, setQuantities] = useState<Quantities>({});
  const [config, setConfig] = useState<EtiquetaConfig>(() =>
    loadEtiquetaConfig(),
  );

  const set = <K extends keyof EtiquetaConfig>(
    key: K,
    value: EtiquetaConfig[K],
  ) => setConfig((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    let active = true;
    productService
      .list()
      .then((list) => {
        if (active) setProducts(list);
      })
      .catch(() => {
        if (active) {
          statusDialog.error("Não foi possível carregar os produtos.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter(
      (product) =>
        product.productName.toLowerCase().includes(term) ||
        product.productCode.toLowerCase().includes(term),
    );
  }, [products, search]);

  const selectedProducts = useMemo(
    () => products.filter((product) => (quantities[product.id] ?? 0) > 0),
    [products, quantities],
  );

  /** Etiquetas já expandidas pela quantidade escolhida em cada produto. */
  const labelItems = useMemo<EtiquetaItem[]>(() => {
    const items: EtiquetaItem[] = [];
    for (const product of selectedProducts) {
      const quantity = quantities[product.id] ?? 0;
      for (let index = 0; index < quantity; index += 1) {
        items.push({
          code: product.productCode,
          name: product.productName,
          price: product.productSalePrice,
        });
      }
    }
    return items;
  }, [selectedProducts, quantities]);

  /** Produtos selecionados cujo código não gera código de barras legível. */
  const invalidCodeProducts = useMemo(
    () =>
      selectedProducts.filter(
        (product) => detectSymbology(product.productCode) === null,
      ),
    [selectedProducts],
  );

  const totalLabels = labelItems.length;

  const labelsPerPage = useMemo(() => {
    const columns = Math.max(1, config.columns);
    if (config.mediaMode === "rolo") return columns;
    const rowHeight = config.labelHeightMm + config.gapYMm;
    if (rowHeight <= 0) return columns;
    const rows = Math.max(
      1,
      Math.floor((297 - config.marginTopMm * 2 + config.gapYMm) / rowHeight),
    );
    return columns * rows;
  }, [config]);

  const totalPages = Math.ceil(totalLabels / Math.max(1, labelsPerPage));

  const previewHtml = useMemo(() => {
    const previewItems = labelItems.slice(
      0,
      PREVIEW_PAGE_LIMIT * Math.max(1, labelsPerPage),
    );
    return buildEtiquetaPrintHtml(previewItems, config);
  }, [labelItems, config, labelsPerPage]);

  const changeQuantity = (productId: string, rawValue: number) => {
    const value = Number.isFinite(rawValue) ? Math.trunc(rawValue) : 0;
    const clamped = Math.min(999, Math.max(0, value));
    setQuantities((prev) => ({ ...prev, [productId]: clamped }));
  };

  const handleScanSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const code = scanCode.trim();
    if (!code) return;

    const product = products.find(
      (candidate) =>
        candidate.productCode.toLowerCase() === code.toLowerCase(),
    );

    if (!product) {
      statusDialog.error(`Nenhum produto cadastrado com o código "${code}".`);
      setScanCode("");
      return;
    }

    changeQuantity(product.id, (quantities[product.id] ?? 0) + 1);
    setScanCode("");
  };

  const handleClearSelection = () => setQuantities({});

  const handleSaveConfig = () => {
    saveEtiquetaConfig(config);
    statusDialog.success("Configuração de etiquetas salva.");
  };

  const handleResetConfig = () => {
    setConfig({ ...DEFAULT_ETIQUETA_CONFIG });
    statusDialog.success(
      "Medidas restauradas para o padrão 34x23mm em 3 colunas (salve para manter).",
    );
  };

  const handlePrint = () => {
    if (totalLabels === 0) {
      statusDialog.error("Selecione ao menos um produto para imprimir.");
      return;
    }

    const popup = window.open("", "_blank", "width=900,height=700");
    if (!popup) {
      statusDialog.error(
        "Não foi possível abrir a janela de impressão (verifique o bloqueador de pop-up).",
      );
      return;
    }

    popup.document.open();
    popup.document.write(buildEtiquetaPrintHtml(labelItems, config));
    popup.document.close();
    popup.focus();
    popup.print();
  };

  const mediaWidthMm = getMediaWidthMm(config);

  return (
    <PageLayout
      size="wide"
      className="space-y-4 py-4 md:space-y-6 md:py-6 lg:py-8"
    >
      <PageHeader
        title="Etiquetas de Produto"
        description="Selecione os produtos, ajuste as medidas do rolo e imprima as etiquetas com código de barras."
        action={
          <span className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-3 py-2 text-sm font-semibold text-secondary">
            <Tags size={16} />
            {config.labelWidthMm}x{config.labelHeightMm}mm · {config.columns}{" "}
            colunas
          </span>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Coluna de seleção de produtos */}
        <div className="space-y-4">
          <section className="card space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-text-primary">
                Produtos
              </h2>
              {totalLabels > 0 ? (
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary transition hover:text-primary"
                >
                  <Trash2 size={15} />
                  Limpar seleção
                </button>
              ) : null}
            </div>

            <form onSubmit={handleScanSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Barcode
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
                />
                <input
                  className="input-field w-full pl-9"
                  placeholder="Bipe ou digite o código e pressione Enter"
                  value={scanCode}
                  onChange={(event) => setScanCode(event.target.value)}
                  autoComplete="off"
                />
              </div>
              <button type="submit" className="btn-secondary shrink-0 px-4">
                Adicionar
              </button>
            </form>

            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
              />
              <input
                className="input-field w-full pl-9"
                placeholder="Filtrar por nome ou código"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            {loading ? (
              <p className="py-8 text-center text-sm text-text-secondary">
                Carregando produtos...
              </p>
            ) : filteredProducts.length === 0 ? (
              <p className="py-8 text-center text-sm text-text-secondary">
                {products.length === 0
                  ? "Nenhum produto cadastrado ainda."
                  : "Nenhum produto encontrado para esse filtro."}
              </p>
            ) : (
              <div className="max-h-[420px] overflow-y-auto rounded-xl border border-border-primary">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-bg-secondary text-text-secondary">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">
                        Produto
                      </th>
                      <th className="px-3 py-2 text-left font-medium">Código</th>
                      <th className="px-3 py-2 text-right font-medium">Preço</th>
                      <th className="px-3 py-2 text-center font-medium">
                        Etiquetas
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => {
                      const quantity = quantities[product.id] ?? 0;
                      const encodable =
                        detectSymbology(product.productCode) !== null;
                      return (
                        <tr
                          key={product.id}
                          className="border-t border-border-primary/70"
                        >
                          <td className="px-3 py-2 text-text-primary">
                            {product.productName}
                          </td>
                          <td className="px-3 py-2 font-mono text-xs text-text-secondary">
                            {product.productCode || "—"}
                            {!encodable ? (
                              <span
                                className="ml-1 text-primary"
                                title="Sem código válido para gerar código de barras"
                              >
                                !
                              </span>
                            ) : null}
                          </td>
                          <td className="px-3 py-2 text-right text-text-secondary">
                            {formatEtiquetaPrice(product.productSalePrice)}
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min={0}
                              max={999}
                              value={quantity === 0 ? "" : quantity}
                              placeholder="0"
                              onChange={(event) =>
                                changeQuantity(
                                  product.id,
                                  Number(event.target.value),
                                )
                              }
                              className="input-field mx-auto block w-20 text-center"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {invalidCodeProducts.length > 0 ? (
              <InfoNote tone="warning">
                {invalidCodeProducts.length === 1
                  ? "1 produto selecionado está sem código válido"
                  : `${invalidCodeProducts.length} produtos selecionados estão sem código válido`}
                . A etiqueta sai com o código em texto, sem as barras. Preencha o
                campo <strong>Código</strong> no cadastro do produto para gerar o
                código de barras.
              </InfoNote>
            ) : null}
          </section>

          {/* Prévia */}
          <section className="card space-y-3 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-text-primary">Prévia</h2>
              <p className="text-sm text-text-secondary">
                {totalLabels} etiqueta{totalLabels === 1 ? "" : "s"} ·{" "}
                {totalPages} página{totalPages === 1 ? "" : "s"}
              </p>
            </div>

            {totalLabels === 0 ? (
              <p className="py-10 text-center text-sm text-text-secondary">
                Escolha a quantidade de etiquetas de cada produto para ver a
                prévia.
              </p>
            ) : (
              <>
                <iframe
                  title="Prévia das etiquetas"
                  srcDoc={previewHtml}
                  className="h-[420px] w-full rounded-xl border border-border-primary bg-white"
                />
                {totalPages > PREVIEW_PAGE_LIMIT ? (
                  <p className="text-xs text-text-tertiary">
                    Mostrando as primeiras {PREVIEW_PAGE_LIMIT} páginas. A
                    impressão sai completa.
                  </p>
                ) : null}
              </>
            )}

            <button
              type="button"
              onClick={handlePrint}
              disabled={totalLabels === 0}
              className="btn-primary inline-flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Printer size={16} />
              Imprimir {totalLabels > 0 ? `${totalLabels} etiquetas` : ""}
            </button>
          </section>
        </div>

        {/* Coluna de configuração */}
        <aside className="space-y-4">
          <section className="card space-y-4 p-5">
            <h2 className="text-lg font-semibold text-text-primary">
              Medidas da mídia
            </h2>

            <Field label="Tipo de mídia">
              <div className="inline-flex overflow-hidden rounded-lg border border-border-secondary">
                {(
                  [
                    { value: "rolo", label: "Rolo" },
                    { value: "folha", label: "Folha A4" },
                  ] as { value: EtiquetaMediaMode; label: string }[]
                ).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => set("mediaMode", option.value)}
                    className={`px-4 py-2 text-sm font-semibold transition ${
                      config.mediaMode === option.value
                        ? "bg-secondary text-text-light"
                        : "bg-bg-light text-text-secondary hover:bg-hover-light"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <NumberField
                label="Largura (mm)"
                value={config.labelWidthMm}
                min={10}
                max={200}
                step={0.5}
                onChange={(value) => set("labelWidthMm", value)}
              />
              <NumberField
                label="Altura (mm)"
                value={config.labelHeightMm}
                min={10}
                max={200}
                step={0.5}
                onChange={(value) => set("labelHeightMm", value)}
              />
              <NumberField
                label="Colunas"
                value={config.columns}
                min={1}
                max={8}
                step={1}
                onChange={(value) => set("columns", value)}
              />
              <NumberField
                label="Altura das barras (mm)"
                value={config.barcodeHeightMm}
                min={3}
                max={60}
                step={0.5}
                onChange={(value) => set("barcodeHeightMm", value)}
              />
              <NumberField
                label="Espaço entre colunas (mm)"
                value={config.gapXMm}
                min={0}
                max={20}
                step={0.5}
                onChange={(value) => set("gapXMm", value)}
              />
              <NumberField
                label="Espaço entre linhas (mm)"
                value={config.gapYMm}
                min={0}
                max={20}
                step={0.5}
                onChange={(value) => set("gapYMm", value)}
              />
              <NumberField
                label="Margem esquerda (mm)"
                value={config.marginLeftMm}
                min={0}
                max={40}
                step={0.5}
                onChange={(value) => set("marginLeftMm", value)}
              />
              <NumberField
                label="Margem superior (mm)"
                value={config.marginTopMm}
                min={0}
                max={40}
                step={0.5}
                onChange={(value) => set("marginTopMm", value)}
              />
            </div>

            <InfoNote>
              Largura total da mídia:{" "}
              <strong>{mediaWidthMm.toFixed(1)}mm</strong>. Confira se bate com o
              rolo instalado — se não bater, as colunas saem deslocadas.
            </InfoNote>
          </section>

          <section className="card space-y-4 p-5">
            <h2 className="text-lg font-semibold text-text-primary">
              Conteúdo da etiqueta
            </h2>

            <Field label="Descrição do produto">
              <YesNoSegmentedControl
                value={config.showName}
                onChange={(value) => set("showName", value)}
                ariaLabel="Exibir descrição do produto"
              />
            </Field>

            <Field label="Código de barras">
              <YesNoSegmentedControl
                value={config.showBarcode}
                onChange={(value) => set("showBarcode", value)}
                ariaLabel="Exibir código de barras"
              />
            </Field>

            <Field label="Código em texto">
              <YesNoSegmentedControl
                value={config.showCode}
                onChange={(value) => set("showCode", value)}
                ariaLabel="Exibir código em texto"
              />
            </Field>

            <Field label="Preço de venda">
              <YesNoSegmentedControl
                value={config.showPrice}
                onChange={(value) => set("showPrice", value)}
                ariaLabel="Exibir preço de venda"
              />
            </Field>

            <Field
              label="Nome da loja no topo"
              hint="Ocupa espaço; em etiquetas pequenas costuma ser dispensável."
            >
              <YesNoSegmentedControl
                value={config.showStoreName}
                onChange={(value) => set("showStoreName", value)}
                ariaLabel="Exibir nome da loja"
              />
            </Field>

            {config.showStoreName ? (
              <input
                className="input-field w-full"
                placeholder="Nome impresso no topo"
                maxLength={40}
                value={config.storeName}
                onChange={(event) => set("storeName", event.target.value)}
              />
            ) : null}
          </section>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSaveConfig}
              className="btn-primary inline-flex flex-1 items-center justify-center gap-2"
            >
              <Save size={16} />
              Salvar
            </button>
            <button
              type="button"
              onClick={handleResetConfig}
              className="btn-secondary inline-flex items-center justify-center gap-2 px-4"
            >
              <RotateCcw size={16} />
              Padrão
            </button>
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
        {hint ? (
          <p className="mt-0.5 text-xs text-text-tertiary">{hint}</p>
        ) : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-text-secondary">{label}</span>
      <input
        type="number"
        className="input-field w-full"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => {
          const parsed = Number(event.target.value);
          if (!Number.isFinite(parsed)) return;
          onChange(Math.min(max, Math.max(min, parsed)));
        }}
      />
    </label>
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
    <div
      className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${styles}`}
    >
      <Info size={16} className="mt-0.5 shrink-0 text-accent" />
      <p className="leading-5">{children}</p>
    </div>
  );
}
