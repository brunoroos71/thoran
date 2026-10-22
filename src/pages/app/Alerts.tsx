import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { useTitle } from '@/hooks/useTitle';
import { addAlert, listAlerts, removeAlert, type Alert } from '@/services/alertsService';
import { PageHead } from '@/components/app/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function Alerts() {
  const { t } = useI18n();
  const c = t.app;
  useTitle(c.alertsTitle);
  const [items, setItems] = useState<Alert[]>([]);
  const [term, setTerm] = useState('');
  useEffect(() => {
    listAlerts().then(setItems);
  }, []);
  return (
    <>
      <PageHead title={c.alertsTitle} lead={c.alertsLead}>
        <Badge tone="trovao">{c.alertsSoon}</Badge>
      </PageHead>
      <div className="max-w-2xl px-4 py-8 sm:px-8">
        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!term.trim()) return;
            const a = await addAlert(term.trim());
            setItems((x) => [a, ...x]);
            setTerm('');
          }}
        >
          <div className="flex flex-1 flex-col gap-2">
            <label htmlFor="alert-term" className="label text-nevoa">
              {c.alertsLabel}
            </label>
            <input
              id="alert-term"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder={c.alertsPlaceholder}
              className="h-14 rounded-full border border-linha bg-grafite px-6 placeholder:text-meta focus:border-raio focus:outline-none"
            />
          </div>
          <Button type="submit" size="lg">
            {c.alertsAdd}
          </Button>
        </form>
        <ul className="mt-8 flex flex-col">
          {items.length === 0 && <li className="text-meta">{c.alertsEmpty}</li>}
          {items.map((a) => (
            <li key={a.id} className="flex items-center justify-between border-b border-linha py-4">
              <span className="text-lg">{a.term}</span>
              <button
                onClick={() => removeAlert(a.id).then(() => setItems((x) => x.filter((i) => i.id !== a.id)))}
                className="label min-h-[44px] px-3 text-meta hover:text-baixa"
                aria-label={`${c.alertsRemove} ${a.term}`}
              >
                {c.alertsRemove}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
