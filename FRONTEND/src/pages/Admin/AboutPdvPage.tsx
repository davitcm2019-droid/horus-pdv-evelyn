/**
 * Arquivo: src/pages/Admin/AboutPdvPage.tsx
 * Objetivo: apresenta informações do sistema sob encomenda (titular, autoria e propósito).
 * Entradas esperadas: não recebe props; exibe conteúdo estático/documental do Evelyn Acessórios.
 */

import { BookOpenText, Code2, Rocket, Store } from "lucide-react";
import PageHeader from "@/components/Admin/PageHeader";
import PageLayout from "@/layout/PageLayout";

export default function AboutPdvPage() {
  return (
    <PageLayout className="space-y-4 py-4 md:space-y-6 md:py-6 lg:py-8">
      <PageHeader
        title="Sobre o Sistema"
        description="Sistema de gestão desenvolvido sob encomenda para a Evelyn Acessórios."
      />

      <section className="card overflow-hidden">
        <div className="border-b border-border-primary bg-gradient-to-r from-secondary/8 via-bg-light to-accent/8 px-4 py-4 md:px-5">
          <h2 className="text-lg font-semibold text-text-primary">Sistema exclusivo sob encomenda</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Solução de PDV e gestão criada exclusivamente para a operação da Evelyn Acessórios,
            não comercializada de forma aberta.
          </p>
        </div>

        <div className="space-y-4 p-4 md:p-5">
          <article className="rounded-xl border border-border-primary bg-bg-primary p-4">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-text-primary">
              <Store size={16} className="text-accent" />
              Titular
            </p>
            <div className="mt-2 space-y-1 text-sm text-text-secondary">
              <p>
                Loja: <strong className="text-text-primary">Evelyn Acessórios</strong>
              </p>
              <p>
                Responsável: <strong className="text-text-primary">Evelyn Zavitoski</strong>
              </p>
            </div>
          </article>

          <article className="rounded-xl border border-border-primary bg-bg-primary p-4">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-text-primary">
              <Code2 size={16} className="text-accent" />
              Desenvolvimento
            </p>
            <p className="mt-2 text-sm text-text-secondary">
              Projeto, desenvolvimento e implantação sob medida, com foco no fluxo real da loja.
            </p>
            <div className="mt-3 space-y-1 text-sm text-text-secondary">
              <p>
                Autor: <strong className="text-text-primary">Davi Alves</strong> — DaviStudio
              </p>
              <p>
                Instagram:{" "}
                <a
                  href="https://www.instagram.com/davistudio.br/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent hover:underline"
                >
                  @davistudio.br
                </a>
              </p>
            </div>
          </article>

          <article className="rounded-xl border border-border-primary bg-bg-primary p-4">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-text-primary">
              <BookOpenText size={16} className="text-accent" />
              O que o sistema faz
            </p>
            <p className="mt-2 text-sm text-text-secondary">
              Centraliza vendas, frente de caixa, cupom não fiscal, produtos, estoque, clientes,
              fornecedores e relatórios da loja em um único painel.
            </p>
          </article>

          <article className="rounded-xl border border-border-primary bg-bg-primary p-4">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-text-primary">
              <Rocket size={16} className="text-accent" />
              Entrega e evolução
            </p>
            <p className="mt-2 text-sm text-text-secondary">
              Desenvolvido e entregue em <strong>2026</strong>, com manutenção e novas
              funcionalidades conforme a necessidade da operação.
            </p>
          </article>
        </div>
      </section>
    </PageLayout>
  );
}
