import { useEffect, useRef } from 'react';
import { BRAIN_BRIDGES, BRAIN_CENTER, BRAIN_HUBS } from './brainData';

interface Node {
  label: string;
  hub: boolean;
  group: string;
  r: number;
  // posição de repouso (normalizada 0..1) e atual (px)
  rx: number;
  ry: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
  links: number[];
}

// PRNG determinístico: o grafo tem sempre o mesmo desenho
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

function build() {
  const rnd = rng(42);
  const gauss = () => {
    const u = Math.max(1e-6, rnd());
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd());
  };
  const nodes: Node[] = [];
  const edges: [number, number][] = [];
  const add = (n: Omit<Node, 'x' | 'y' | 'vx' | 'vy' | 'phase' | 'links'>) => {
    nodes.push({ ...n, x: 0, y: 0, vx: 0, vy: 0, phase: rnd() * Math.PI * 2, links: [] });
    return nodes.length - 1;
  };
  const link = (a: number, b: number) => {
    edges.push([a, b]);
    nodes[a].links.push(b);
    nodes[b].links.push(a);
  };

  const center = add({ label: BRAIN_CENTER, hub: true, group: 'center', r: 7, rx: 0.5, ry: 0.5 });
  const hubIdx: Record<string, number> = {};
  const members: Record<string, number[]> = {};

  for (const h of BRAIN_HUBS) {
    const hi = add({ label: h.label, hub: true, group: h.id, r: 6 + Math.sqrt(h.nodes.length) * 0.9, rx: h.x, ry: h.y });
    hubIdx[h.id] = hi;
    members[h.id] = [];
    link(center, hi);
    for (const label of h.nodes) {
      const rx = Math.min(0.98, Math.max(0.02, h.x + gauss() * h.spread * 0.55));
      const ry = Math.min(0.96, Math.max(0.04, h.y + gauss() * h.spread * 0.9));
      const ni = add({ label, hub: false, group: h.id, r: 2 + rnd() * 2.2, rx, ry });
      members[h.id].push(ni);
      link(hi, ni);
    }
    // notas menores sem título (coletas, rascunhos, recortes) para a densidade do vault
    const named = members[h.id].length;
    for (let k = 0; k < Math.round(named * 1.6); k++) {
      const rx = Math.min(0.98, Math.max(0.02, h.x + gauss() * h.spread * 0.7));
      const ry = Math.min(0.96, Math.max(0.04, h.y + gauss() * h.spread * 1.1));
      const ni = add({ label: '', hub: false, group: h.id, r: 1 + rnd() * 1.3, rx, ry });
      link(members[h.id][Math.floor(rnd() * named)], ni);
      if (rnd() < 0.3) link(hi, ni);
    }
    // ligações dentro do grupo
    const m = members[h.id].slice(0, named);
    for (let k = 0; k < m.length * 0.6; k++) link(m[Math.floor(rnd() * m.length)], m[Math.floor(rnd() * m.length)]);
  }
  // pontes entre grupos (é aqui que nascem os "casos parecidos")
  for (const [a, b] of BRAIN_BRIDGES)
    for (let k = 0; k < 5; k++) link(members[a][Math.floor(rnd() * members[a].length)], members[b][Math.floor(rnd() * members[b].length)]);

  // relaxa sobreposições (poucas iterações, barato)
  for (let it = 0; it < 40; it++)
    for (let i = 0; i < nodes.length; i++)
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = b.rx - a.rx;
        const dy = (b.ry - a.ry) * 0.6;
        const d = Math.hypot(dx, dy) || 1e-4;
        const min = a.label && b.label ? 0.018 : 0.009;
        if (d < min) {
          const push = ((min - d) / d) * 0.5;
          if (!a.hub) (a.rx -= dx * push), (a.ry -= dy * push);
          if (!b.hub) (b.rx += dx * push), (b.ry += dy * push);
        }
      }
  return { nodes, edges };
}

/**
 * Grafo do "cérebro" em canvas. Os pontos fogem do cursor e voltam com mola;
 * passar sobre um ponto acende ele e as conexões; dá para arrastar.
 */
export function BrainGraph({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext('2d')!;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const { nodes, edges } = build();
    let w = 0, h = 0, raf = 0, visible = false, t = 0;
    const m = { x: -9999, y: -9999, inside: false };
    let hover = -1;
    let drag = -1;
    const font = '"Geist Sans", system-ui, sans-serif';

    const place = () => {
      for (const n of nodes) {
        n.x = n.rx * w;
        n.y = n.ry * h;
      }
    };
    const resize = () => {
      const dpr = Math.min(2, devicePixelRatio || 1);
      const first = w === 0;
      w = cv.clientWidth;
      h = cv.clientHeight;
      cv.width = w * dpr;
      cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (first) place();
      draw();
    };

    const step = () => {
      t += 0.016;
      const R = Math.min(110, w * 0.1);
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (i === drag) {
          n.x += (m.x - n.x) * 0.35;
          n.y += (m.y - n.y) * 0.35;
          n.vx = n.vy = 0;
          continue;
        }
        // mola de volta para o lugar + respiração leve
        const tx = n.rx * w + Math.sin(t * 0.8 + n.phase) * (n.hub ? 1.5 : 3);
        const ty = n.ry * h + Math.cos(t * 0.7 + n.phase) * (n.hub ? 1.5 : 3);
        n.vx += (tx - n.x) * 0.035;
        n.vy += (ty - n.y) * 0.035;
        // ponto em foco fica parado para dar tempo de ler
        if (i === hover) {
          n.vx *= 0.5;
          n.vy *= 0.5;
        } else if (m.inside) {
          // empurrão suave em anel: quem está bem embaixo do cursor não foge (dá para mirar),
          // só os pontos ao redor se afastam um pouco
          const dx = n.x - m.x;
          const dy = n.y - m.y;
          const d = Math.hypot(dx, dy);
          const INNER = 26;
          if (d > INNER && d < R) {
            const k = (d - INNER) / (R - INNER); // 0 na borda interna … 1 na externa
            const f = Math.sin(k * Math.PI) * (n.hub ? 0.35 : 0.8);
            n.vx += (dx / d) * f;
            n.vy += (dy / d) * f;
          }
        }
        // arraste puxa os vizinhos
        if (drag >= 0 && nodes[drag].links.includes(i)) {
          n.vx += (nodes[drag].x - n.x) * 0.004;
          n.vy += (nodes[drag].y - n.y) * 0.004;
        }
        n.vx *= 0.84;
        n.vy *= 0.84;
        n.x += n.vx;
        n.y += n.vy;
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const focus = drag >= 0 ? drag : hover;
      const lit = new Set<number>(focus >= 0 ? [focus, ...nodes[focus].links] : []);

      // conexões
      ctx.lineWidth = 0.6;
      ctx.strokeStyle = focus >= 0 ? 'rgba(46,55,64,.35)' : 'rgba(58,70,84,.55)';
      ctx.beginPath();
      for (const [a, b] of edges) {
        if (focus >= 0 && (a === focus || b === focus)) continue;
        ctx.moveTo(nodes[a].x, nodes[a].y);
        ctx.lineTo(nodes[b].x, nodes[b].y);
      }
      ctx.stroke();
      if (focus >= 0) {
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = 'rgba(125,216,255,.85)';
        ctx.beginPath();
        for (const j of nodes[focus].links) {
          ctx.moveTo(nodes[focus].x, nodes[focus].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
        }
        ctx.stroke();
      }

      // pontos
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const d = Math.hypot(n.x - m.x, n.y - m.y);
        const near = m.inside ? Math.max(0, 1 - d / 160) : 0;
        ctx.fillStyle = i === focus ? '#7DD8FF' : lit.has(i) ? '#EEF1F4' : focus >= 0 ? 'rgba(122,135,151,.45)' : `rgba(200,207,215,${0.55 + near * 0.45})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + (i === focus ? 2.5 : near * 1.2), 0, Math.PI * 2);
        ctx.fill();
      }

      // rótulos: grupos sempre; demais perto do cursor ou ligados ao foco
      ctx.textAlign = 'center';
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (!n.label) continue;
        const d = Math.hypot(n.x - m.x, n.y - m.y);
        const near = m.inside ? Math.max(0, 1 - d / 130) : 0;
        let a = n.hub ? (focus >= 0 && !lit.has(i) ? 0.35 : 0.9) : lit.has(i) ? 0.95 : near * 0.85;
        if (a < 0.04) continue;
        if (i === focus) a = 1;
        ctx.font = n.hub ? `500 12px ${font}` : `${i === focus ? 500 : 400} 10.5px ${font}`;
        if (i === focus) continue; // desenhado por último, por cima de tudo
        ctx.fillStyle = n.hub ? `rgba(238,241,244,${a})` : `rgba(200,207,215,${a})`;
        ctx.fillText(n.label, n.x, n.y - n.r - 6);
      }
      if (focus >= 0) {
        const n = nodes[focus];
        ctx.font = `500 13px ${font}`;
        const tw = ctx.measureText(n.label).width;
        const bx = Math.min(Math.max(n.x - tw / 2 - 10, 6), w - tw - 26);
        const by = n.y - n.r - 34;
        ctx.fillStyle = 'rgba(11,13,16,.92)';
        ctx.strokeStyle = 'rgba(125,216,255,.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(bx, by, tw + 20, 24, 12);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#EEF1F4';
        ctx.textAlign = 'left';
        ctx.fillText(n.label, bx + 10, by + 16.5);
        ctx.textAlign = 'center';
      }
    };

    const loop = () => {
      if (visible) {
        step();
        draw();
      }
      raf = requestAnimationFrame(loop);
    };

    const pick = () => {
      // histerese: mantém o ponto atual enquanto o cursor estiver perto dele
      if (hover >= 0 && Math.hypot(nodes[hover].x - m.x, nodes[hover].y - m.y) < nodes[hover].r + 24) return hover;
      let best = -1;
      let bd = 18;
      for (let i = 0; i < nodes.length; i++) {
        if (!nodes[i].label) continue;
        const d = Math.hypot(nodes[i].x - m.x, nodes[i].y - m.y) - nodes[i].r;
        if (d < bd) (bd = d), (best = i);
      }
      return best;
    };
    const pos = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      m.x = e.clientX - r.left;
      m.y = e.clientY - r.top;
      m.inside = m.x >= 0 && m.y >= 0 && m.x <= w && m.y <= h;
    };
    const move = (e: PointerEvent) => {
      pos(e);
      if (drag < 0) hover = m.inside ? pick() : -1;
      // o cursor próprio do site (CursorFX) mostra "arraste" sobre um ponto
      cv.dataset.cursor = hover >= 0 || drag >= 0 ? 'arraste' : '';
      if (!document.documentElement.classList.contains('has-cursor')) cv.style.cursor = drag >= 0 ? 'grabbing' : hover >= 0 ? 'grab' : '';
      if (reduce) draw();
    };
    const down = (e: PointerEvent) => {
      pos(e);
      const i = pick();
      if (i >= 0) {
        drag = i;
        cv.setPointerCapture(e.pointerId);
      }
    };
    const up = () => {
      drag = -1;
    };
    const leave = () => {
      m.inside = false;
      hover = -1;
      if (reduce) draw();
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(cv);
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(cv);
    addEventListener('pointermove', move, { passive: true });
    cv.addEventListener('pointerdown', down);
    addEventListener('pointerup', up);
    cv.addEventListener('pointerleave', leave);
    if (!reduce) raf = requestAnimationFrame(loop);
    return () => {
      ro.disconnect();
      io.disconnect();
      removeEventListener('pointermove', move);
      cv.removeEventListener('pointerdown', down);
      removeEventListener('pointerup', up);
      cv.removeEventListener('pointerleave', leave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className={className} />;
}

export const BRAIN_COUNTS = BRAIN_HUBS.map((h) => ({ label: h.label, n: h.nodes.length }));
