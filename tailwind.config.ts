import type { Config } from 'tailwindcss';

// Tokens extraídos do Brand design Thoran v1.0 (seção A). Não criar cores fora daqui.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    screens: { sm: '480px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1600px' },
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      carbono: '#0B0D10', // fundo padrão
      grafite: '#14171C', // superfícies, cards
      linha: '#2E3740', // bordas, listras
      aco: '#3A4654',
      meta: '#7A8797', // texto secundário (5.3:1 sobre carbono)
      nevoa: '#C8CFD7', // texto de apoio
      texto: '#EEF1F4', // texto principal
      claro: '#F4F5F7', // fundo claro
      branco: '#FFFFFF',
      raio: '#7DD8FF', // símbolo / acento
      'raio-claro': '#0A6E99', // acento sobre fundo claro
      trovao: '#FFC24A', // atenção
      alta: '#4ADE80',
      baixa: '#F7716E',
    },
    fontFamily: {
      sans: ['"Geist Sans"', 'system-ui', 'sans-serif'],
      mono: ['"Geist Mono"', 'ui-monospace', 'monospace'],
      brand: ['"Space Grotesk"', 'system-ui', 'sans-serif'], // só o wordmark
    },
    extend: {
      letterSpacing: { brand: '0.08em', label: '0.14em' },
      borderRadius: { card: '6px' },
      fontSize: {
        mega: ['clamp(2.75rem, 7.4vw, 10rem)', { lineHeight: '0.9', letterSpacing: '-0.035em' }],
        display: ['clamp(2.5rem, 6.5vw, 6rem)', { lineHeight: '0.95', letterSpacing: '-0.03em' }],
        h2: ['clamp(2rem, 4.5vw, 4rem)', { lineHeight: '1', letterSpacing: '-0.025em' }],
      },
      keyframes: {
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        stripes: { from: { backgroundPosition: '0 0' }, to: { backgroundPosition: '64px 0' } },
        rise: { from: { opacity: '0', transform: 'translateY(40px)' }, to: { opacity: '1', transform: 'none' } },
        blink: { '50%': { opacity: '0' } },
        scan: { from: { left: '-10%' }, to: { left: '105%' } },
      },
      animation: {
        marquee: 'marquee 40s linear infinite',
        stripes: 'stripes 3s linear infinite',
        rise: 'rise .9s cubic-bezier(.2,.7,.1,1) both',
        blink: 'blink 1s step-end infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
