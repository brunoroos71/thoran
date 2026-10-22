import { supabase } from '@/lib/supabase';
import { readLS, writeLS } from '@/lib/storage';

export type Rating = 'useful' | 'not_useful';

export async function sendFeedback(analysisId: string, rating: Rating, comment?: string) {
  if (supabase) {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      await supabase
        .from('feedback')
        .upsert({ analysis_id: analysisId, user_id: data.user.id, rating, comment: comment ?? null }, { onConflict: 'analysis_id,user_id' });
      return;
    }
  }
  const all = readLS<Record<string, { rating: Rating; comment?: string }>>('thoran.demo.feedback', {});
  all[analysisId] = { rating, comment };
  writeLS('thoran.demo.feedback', all);
}
