import type { Dict } from './pt-BR';

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

// Tradução em andamento: chaves ausentes caem para pt-BR.
const enUS: DeepPartial<Dict> = {
  meta: { title: 'Thoran · See the lightning before the thunder' },
  common: {
    illustrative: 'Illustrative example, with fictitious data',
    disclaimer:
      'I am an AI and I can be wrong. This is not investment advice: the company is not a CVM-accredited analyst or authorized adviser. Past returns do not indicate future returns. I do not say whether you should buy, when to enter or how much to put in.',
  },
  hero: { title1: 'See the lightning', title2: 'before the thunder.' },
};

export default enUS;
