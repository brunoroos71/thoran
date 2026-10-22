import { useI18n } from '@/i18n';
import { cx } from '@/lib/format';

/** Aviso obrigatório ao fim de toda resposta. Usa o texto padrão se a API não mandar. */
export function Disclaimer({ text, className }: { text?: string | null; className?: string }) {
  const { t } = useI18n();
  // o agente abre o aviso com ⚠️; aqui o ícone já é o "!"
  const aviso = (text?.trim() || t.common.disclaimer).replace(/^⚠️?\s*/u, '');
  return (
    <p className={cx('flex gap-3 border-t border-linha pt-4 text-xs leading-relaxed text-meta', className)}>
      <span aria-hidden className="font-mono text-trovao">!</span>
      <span>{aviso}</span>
    </p>
  );
}
