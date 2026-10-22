import { useI18n } from '@/i18n';
import { useTitle } from '@/hooks/useTitle';
import { SiteLayout } from '@/components/layout/SiteLayout';
import { Pricing } from '@/components/landing/Pricing';
import { Faq } from '@/components/landing/Faq';

export default function PlansPublic() {
  const { t } = useI18n();
  useTitle(t.home.plans);
  return (
    <SiteLayout>
      <Pricing />
      <Faq />
    </SiteLayout>
  );
}
