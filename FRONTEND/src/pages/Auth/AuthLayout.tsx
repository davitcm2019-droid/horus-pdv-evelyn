/**
 * Arquivo: src/pages/Auth/AuthLayout.tsx
 * Objetivo: padroniza o layout minimalista das telas públicas de login, cadastro e recuperação de senha.
 * Entradas esperadas: recebe conteúdo filho e textos de apoio exibidos no card central.
 */
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

type AuthLayoutProps = {
  title: string;
  description: string;
  children: ReactNode;
  onBackToLogin?: () => void;
};

export default function AuthLayout({
  title,
  description,
  children,
  onBackToLogin,
}: AuthLayoutProps) {
  return (
    <main className="relative isolate min-h-screen overflow-hidden px-4 py-10 text-text-primary">
      {/* fundo minimalista: dois glows sutis da marca */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-12%] h-72 w-72 -translate-x-1/2 rounded-full bg-brand-pink/15 blur-[110px]" />
        <div className="absolute bottom-[-12%] right-[8%] h-72 w-72 rounded-full bg-brand-green/12 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center justify-center">
        <section className="card auth-login-card auth-login-reveal-1 w-full p-7 sm:p-9">
          {onBackToLogin ? (
            <button
              type="button"
              onClick={onBackToLogin}
              className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-text-secondary transition hover:text-secondary"
            >
              <ArrowLeft size={16} />
              Voltar ao login
            </button>
          ) : null}

          {/* wordmark em texto (sem imagem) */}
          <div className="text-center">
            <p className="text-3xl font-extrabold tracking-tight text-secondary">Evelyn</p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.38em] text-text-tertiary">
              Acessórios
            </p>
          </div>

          <div className="mt-8 text-center">
            <h2 className="auth-login-reveal-2 text-xl font-bold text-text-primary">{title}</h2>
            <p className="auth-login-reveal-3 mt-1 text-sm text-text-secondary">{description}</p>
          </div>

          <div className="auth-login-reveal-3 mt-7 space-y-4 text-left">{children}</div>
        </section>
      </div>
    </main>
  );
}
