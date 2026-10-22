import { Link } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { useTitle } from '@/hooks/useTitle';
import { SiteLayout } from '@/components/layout/SiteLayout';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { PrecedentShowcase } from '@/components/landing/PrecedentShowcase';
import { Brain } from '@/components/landing/Brain';
import { Compare } from '@/components/landing/Compare';
import { Markets } from '@/components/landing/Markets';

/** Para quem quer entender antes de usar. A home continua sendo o chat. */
export default function About() {
  const { t } = useI18n();
  useTitle(t.home.about);
  return (
    <SiteLayout>
      <HowItWorks />
      <PrecedentShowcase />
      <Brain />
      <Compare />
      <Markets />
      <div className="flex justify-center pb-24">
        <Link to="/" className="inline-flex min-h-[52px] items-center gap-2 rounded-full bg-raio px-7 font-semibold text-carbono hover:bg-texto">
          {t.home.placeholder} <span aria-hidden>→</span>
        </Link>
      </div>
    </SiteLayout>
  );
}
