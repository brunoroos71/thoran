import { useState } from 'react';
import { useI18n } from '@/i18n';
import { cx } from '@/lib/format';
import { sendFeedback, type Rating } from '@/services/feedbackService';

export function Feedback({ analysisId }: { analysisId: string }) {
  const { t } = useI18n();
  const [rating, setRating] = useState<Rating | null>(null);
  const [comment, setComment] = useState('');
  const [sent, setSent] = useState(false);

  const rate = (r: Rating) => {
    setRating(r);
    sendFeedback(analysisId, r);
  };

  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label="Feedback" className="flex items-center gap-2">
        {(['useful', 'not_useful'] as const).map((r) => (
          <button
            key={r}
            type="button"
            aria-pressed={rating === r}
            onClick={() => rate(r)}
            className={cx(
              'inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 text-sm transition-colors',
              rating === r ? 'border-raio bg-raio text-carbono' : 'border-linha text-nevoa hover:border-aco hover:text-texto',
            )}
          >
            <span aria-hidden className="font-mono">{r === 'useful' ? '+' : '−'}</span>
            {r === 'useful' ? t.app.useful : t.app.notUseful}
          </button>
        ))}
        {rating && <span className="text-xs text-meta" role="status">{t.app.feedbackThanks}</span>}
      </div>
      {rating === 'not_useful' && !sent && (
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            sendFeedback(analysisId, 'not_useful', comment.trim());
            setSent(true);
          }}
        >
          <label className="sr-only" htmlFor={`fb-${analysisId}`}>
            {t.app.feedbackComment}
          </label>
          <input
            id={`fb-${analysisId}`}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t.app.feedbackComment}
            className="h-11 flex-1 rounded-full border border-linha bg-carbono px-4 text-sm placeholder:text-meta focus:border-raio focus:outline-none"
          />
          <button type="submit" className="min-h-[44px] rounded-full border border-linha px-4 text-sm hover:border-texto">
            {t.app.feedbackSend}
          </button>
        </form>
      )}
    </div>
  );
}
