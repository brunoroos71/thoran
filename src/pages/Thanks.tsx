import { SiteLayout } from '@/components/layout/SiteLayout';
import { ButtonLink } from '@/components/ui/Button';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Symbol } from '@/components/ui/Logo';
import { useI18n } from '@/i18n';
import { useTitle } from '@/hooks/useTitle';

export default function Thanks() {
  const { t } = useI18n();
  useTitle(t.thanks.title);
  return (
    <SiteLayout>
      <section className="relative isolate flex min-h-[100svh] items-center overflow-hidden pt-24">
        <div aria-hidden className="stripes animate-stripes absolute inset-x-0 bottom-0 -z-10 h-16 opacity-60 md:h-1/4" />
        <div className="wrap flex flex-col gap-8">
          <Symbol size={72} className="animate-rise" />
          <Eyebrow className="animate-rise [animation-delay:.05s]">{t.thanks.eyebrow}</Eyebrow>
          <h1 className="animate-rise text-mega font-medium [animation-delay:.1s]">{t.thanks.title}</h1>
          <p className="max-w-xl animate-rise text-xl leading-relaxed text-nevoa [animation-delay:.2s]">{t.thanks.body}</p>
          <p className="animate-rise text-nevoa [animation-delay:.25s]">{t.thanks.next}</p>
          <div className="animate-rise [animation-delay:.3s]">
            <ButtonLink to="/" variant="secondary" size="lg">
              {t.thanks.home}
            </ButtonLink>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
