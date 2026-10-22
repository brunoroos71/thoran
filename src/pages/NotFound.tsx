import { SiteLayout } from '@/components/layout/SiteLayout';
import { ButtonLink } from '@/components/ui/Button';
import { useTitle } from '@/hooks/useTitle';

export default function NotFound() {
  useTitle('404');
  return (
    <SiteLayout>
      <section className="wrap flex min-h-[80svh] flex-col justify-center gap-8 pt-24">
        <p className="label text-raio">404</p>
        <h1 className="text-mega font-medium">Sem precedente.</h1>
        <p className="text-xl text-nevoa">Essa página não existe, nem nos últimos 10 anos.</p>
        <div>
          <ButtonLink to="/" size="lg" arrow>
            Voltar para o início
          </ButtonLink>
        </div>
      </section>
    </SiteLayout>
  );
}
