/**
 * Arquivo: src/domain/cupom/cupomConfig.ts
 * Objetivo: centraliza a configuração do Cupom Não Fiscal (largura, mensagens, impressora).
 * Entradas esperadas: nenhuma; expõe tipo, padrão e funções de carga/gravação em localStorage.
 */

export type CupomPaperWidth = "58" | "80";
export type CupomPrintMode = "navegador" | "rede";

export type CupomConfig = {
  /** Largura do papel da bobina térmica. */
  paperWidth: CupomPaperWidth;
  /** Abre a prévia do cupom automaticamente ao confirmar a venda. */
  autoPreview: boolean;
  /** Dispara a impressão automaticamente ao abrir a prévia. */
  autoPrint: boolean;
  /** Exibe o nome da loja em destaque no topo do cupom. */
  showStoreName: boolean;
  /** Linha extra opcional logo abaixo do cabeçalho (ex.: slogan). */
  headerMessage: string;
  /** Rodapé do cupom (ex.: política de troca). */
  footerMessage: string;
  /** Como o cupom é enviado à impressora. */
  printMode: CupomPrintMode;
  /** IP da impressora térmica de rede (usado quando printMode = "rede"). */
  printerIp: string;
  /** Porta da impressora de rede (padrão ESC/POS: 9100). */
  printerPort: string;
};

export const CUPOM_CONFIG_STORAGE_KEY = "horuspdv.cupom.config";

export const DEFAULT_CUPOM_CONFIG: CupomConfig = {
  paperWidth: "80",
  autoPreview: true,
  autoPrint: false,
  showStoreName: true,
  headerMessage: "",
  footerMessage: "Obrigado pela preferencia! Volte sempre.",
  printMode: "navegador",
  printerIp: "",
  printerPort: "9100",
};

/** Carrega a configuração salva, mesclada sobre os padrões (tolerante a chaves ausentes). */
export function loadCupomConfig(): CupomConfig {
  if (typeof window === "undefined") return { ...DEFAULT_CUPOM_CONFIG };
  try {
    const raw = window.localStorage.getItem(CUPOM_CONFIG_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CUPOM_CONFIG };
    const parsed = JSON.parse(raw) as Partial<CupomConfig>;
    return { ...DEFAULT_CUPOM_CONFIG, ...parsed };
  } catch {
    return { ...DEFAULT_CUPOM_CONFIG };
  }
}

/** Persiste a configuração no navegador. */
export function saveCupomConfig(config: CupomConfig): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CUPOM_CONFIG_STORAGE_KEY, JSON.stringify(config));
}
