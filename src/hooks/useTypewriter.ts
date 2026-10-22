import { useEffect, useState } from 'react';

/**
 * Digita e apaga frases em sequência (para o placeholder da caixa de mensagem).
 * Pausa enquanto `paused` for true; com prefers-reduced-motion mostra só a primeira frase.
 */
export function useTypewriter(phrases: string[], { paused = false, type = 45, erase = 22, hold = 1800, gap = 350 } = {}) {
  // começa com a primeira frase inteira (aparece já no primeiro render), depois apaga e segue
  const [text, setText] = useState(phrases[0] ?? '');
  useEffect(() => {
    if (!phrases.length) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setText(phrases[0]);
      return;
    }
    if (paused) return;
    let i = 0;
    let n = phrases[0].length;
    let deleting = true;
    let timer = 0;
    const tick = () => {
      const full = phrases[i];
      if (!deleting) {
        n++;
        setText(full.slice(0, n));
        if (n >= full.length) {
          deleting = true;
          timer = window.setTimeout(tick, hold);
          return;
        }
        timer = window.setTimeout(tick, type + Math.random() * 30);
      } else {
        n--;
        setText(full.slice(0, n));
        if (n <= 0) {
          deleting = false;
          i = (i + 1) % phrases.length;
          timer = window.setTimeout(tick, gap);
          return;
        }
        timer = window.setTimeout(tick, erase);
      }
    };
    timer = window.setTimeout(tick, hold);
    return () => clearTimeout(timer);
  }, [phrases, paused, type, erase, hold, gap]);
  return text;
}
