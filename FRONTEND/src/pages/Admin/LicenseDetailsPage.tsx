/**
 * Arquivo: src/pages/Admin/LicenseDetailsPage.tsx
 * Objetivo: documenta a licença de uso exclusiva do sistema sob encomenda e seus responsáveis.
 * Entradas esperadas: não recebe props; renderiza conteúdo estático sobre termos de uso do sistema.
 */

import { BadgeCheck, Copyright, ScrollText, Scale } from "lucide-react";
import PageHeader from "@/components/Admin/PageHeader";
import PageLayout from "@/layout/PageLayout";

export default function LicenseDetailsPage() {
  return (
    <PageLayout className="space-y-4 py-4 md:space-y-6 md:py-6 lg:py-8">
      <PageHeader
        title="Detalhes da Licença"
        description="Termos de uso do sistema desenvolvido sob encomenda para a Evelyn Acessórios."
      />

      <section className="card overflow-hidden">
        <div className="border-b border-border-primary bg-gradient-to-r from-secondary/8 via-bg-light to-accent/8 px-4 py-4 md:px-5">
          <h2 className="text-lg font-semibold text-text-primary">Licença de uso exclusiva</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Software proprietário, licenciado para uso exclusivo da Evelyn Acessórios.
          </p>
        </div>

        <div className="space-y-3 p-4 md:p-5">
          <article className="rounded-xl border border-border-primary bg-bg-primary p-4">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-text-primary">
              <Scale size={16} className="text-accent" />
              Modelo
            </p>
            <p className="mt-2 text-sm text-text-secondary">
              Sistema desenvolvido sob encomenda e de uso privado. A licença cobre a operação
              da loja titular, não sendo destinado à revenda, redistribuição ou uso por terceiros.
            </p>
          </article>

          <article className="rounded-xl border border-border-primary bg-bg-primary p-4">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-text-primary">
              <ScrollText size={16} className="text-accent" />
              Titular da licença
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
              <Copyright size={16} className="text-accent" />
              Desenvolvimento e autoria
            </p>
            <p className="mt-2 text-sm text-text-secondary">
              Concepção e desenvolvimento por Davi Alves (DaviStudio). Para suporte, ajustes ou
              novas funcionalidades, fale pelo canal abaixo.
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

          <article className="rounded-xl border border-success/30 bg-success/10 p-4">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-success">
              <BadgeCheck size={16} />
              Status da licença
            </p>
            <p className="mt-2 text-sm text-success">
              Licença ativa — instalação exclusiva da Evelyn Acessórios (2026).
            </p>
          </article>
        </div>
      </section>
    </PageLayout>
  );
}
