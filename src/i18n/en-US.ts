import type { Dict } from './pt-BR';

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

// Tradução em andamento: chaves ausentes caem para pt-BR.
const enUS: DeepPartial<Dict> = {
  meta: { title: 'Thoran · See the lightning before the thunder' },
  common: {
    illustrative: 'Illustrative example, with fictitious data',
    disclaimer:
      'Thoran does not provide investment advice. Past results do not guarantee future results. Trading involves risk of loss.',
  },
  hero: { title1: 'See the lightning', title2: 'before the thunder.' },
};

export default enUS;
