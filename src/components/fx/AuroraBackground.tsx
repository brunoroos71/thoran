import { useEffect, useRef } from 'react';

/**
 * Fundo vivo e discreto (referência: deepseek.com), nas cores da marca:
 *  1. shader WebGL: luz azul fraca se movendo devagar no topo
 *  2. gráfico de velas (verde/vermelho) quase transparente deslizando na metade de baixo
 * Começa depois do carregamento (não atrasa o LCP), pausa com a aba oculta
 * e fica estático com prefers-reduced-motion.
 */

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;

const FRAG = `precision mediump float;
uniform vec2 r;uniform float t;uniform vec2 m;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
void main(){
 vec2 uv=gl_FragCoord.xy/r;
 vec2 p=vec2(uv.x*r.x/r.y,uv.y);
 float tt=t*.025;
 vec2 q=vec2(fbm(p*.8+vec2(tt,-tt*.6)),fbm(p*.8+vec2(-tt*.8,tt)+4.1));
 float f=fbm(p*.9+q*1.2+vec2(tt*.5,0.));
 // luz concentrada no topo, como um horizonte
 float top=smoothstep(.05,1.,uv.y)*smoothstep(1.7,.1,abs(uv.x-.5)*1.8+(1.-uv.y)*.5);
 vec3 base=vec3(.043,.051,.063);
 vec3 c1=vec3(.039,.431,.6);   // raio-claro
 vec3 c2=vec3(.49,.847,1.);    // raio
 vec3 col=base;
 col+=c1*.07*top;                                   // horizonte de luz
 col=mix(col,c1,smoothstep(.4,.9,f)*top*.32);
 col+=c2*pow(smoothstep(.6,1.,f),2.)*top*.08;
 // brilho leve onde está o cursor
 vec2 d=(uv-m)*vec2(r.x/r.y,1.);
 col+=c1*.04*exp(-dot(d,d)*9.);
 // dither contra faixas no degradê
 col+=(h(gl_FragCoord.xy+t)-.5)/255.;
 gl_FragColor=vec4(col,1.);
}`;

function startShader(cv: HTMLCanvasElement, mouse: { x: number; y: number }, animate: boolean, light: boolean) {
  const gl = cv.getContext('webgl', { antialias: false, premultipliedAlpha: false, powerPreference: 'low-power' });
  if (!gl) return () => {};
  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return () => {};
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uR = gl.getUniformLocation(prog, 'r');
  const uT = gl.getUniformLocation(prog, 't');
  const uM = gl.getUniformLocation(prog, 'm');

  // meia resolução: o degradê é suave, ninguém percebe, e a GPU agradece
  const SCALE = light ? 0.3 : 0.5;
  const minGap = light ? 1000 / 30 : 0; // celular: 30 quadros por segundo bastam
  let last = 0;
  const resize = () => {
    cv.width = Math.max(1, Math.round(cv.clientWidth * SCALE));
    cv.height = Math.max(1, Math.round(cv.clientHeight * SCALE));
    gl.viewport(0, 0, cv.width, cv.height);
  };
  resize();
  addEventListener('resize', resize);

  let raf = 0;
  const t0 = performance.now();
  const sm = { x: 0.5, y: 0.8 };
  const frame = (now = performance.now()) => {
    if (minGap && now - last < minGap) {
      raf = requestAnimationFrame(frame);
      return;
    }
    last = now;
    sm.x += (mouse.x - sm.x) * 0.04;
    sm.y += (mouse.y - sm.y) * 0.04;
    gl.uniform2f(uR, cv.width, cv.height);
    gl.uniform1f(uT, animate ? (performance.now() - t0) / 1000 : 12);
    gl.uniform2f(uM, sm.x, sm.y);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (animate && !document.hidden) raf = requestAnimationFrame(frame);
  };
  const onVis = () => !document.hidden && animate && (cancelAnimationFrame(raf), (raf = requestAnimationFrame(frame)));
  document.addEventListener('visibilitychange', onVis);
  frame();
  return () => {
    cancelAnimationFrame(raf);
    removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', onVis);
  };
}

/* Velas: um gráfico de candles quase transparente deslizando devagar para a esquerda. */
function startCandles(cv: HTMLCanvasElement, animate: boolean) {
  const ctx = cv.getContext('2d')!;
  const dpr = Math.min(2, devicePixelRatio || 1);
  let w = 0;
  let h = 0;
  const STEP = 16; // largura de cada vela + espaço
  const BODY = 8;
  type C = { o: number; c: number; hi: number; lo: number };
  let candles: C[] = [];
  let price = 0;
  let drift = 0;
  let k = 0;
  // passeio aleatório com tendência que muda devagar: parece um gráfico real
  const next = (): C => {
    k++;
    drift += (Math.random() - 0.5) * 0.08;
    drift = Math.max(-0.35, Math.min(0.35, drift)) * 0.98;
    const o = price;
    const c = o + drift + (Math.random() - 0.5) * 1.6 + Math.sin(k / 23) * 0.25;
    const hi = Math.max(o, c) + Math.random() * 0.9;
    const lo = Math.min(o, c) - Math.random() * 0.9;
    price = c;
    return { o, c, hi, lo };
  };
  const resize = () => {
    w = cv.clientWidth;
    h = cv.clientHeight;
    cv.width = w * dpr;
    cv.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const need = Math.ceil(w / STEP) + 4;
    while (candles.length < need) candles.push(next());
  };
  resize();
  addEventListener('resize', resize);

  let offset = 0;
  let raf = 0;
  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    // faixa vertical do gráfico: metade de baixo da tela, longe do texto
    const top = h * 0.52;
    const bottom = h * 0.92;
    const vis = candles.slice(0, Math.ceil(w / STEP) + 2);
    const max = Math.max(...vis.map((c) => c.hi));
    const min = Math.min(...vis.map((c) => c.lo));
    const y = (v: number) => bottom - ((v - min) / (max - min || 1)) * (bottom - top);
    for (let i = 0; i < vis.length; i++) {
      const c = vis[i];
      const x = i * STEP - offset + STEP / 2;
      // some nas bordas laterais
      const edge = Math.min(1, x / (w * 0.15), (w - x) / (w * 0.15));
      if (edge <= 0) continue;
      const up = c.c >= c.o;
      // cores reais de gráfico (alta verde #4ADE80, baixa vermelha #F7716E), bem apagadas
      const a = 0.09 * edge;
      const rgb = up ? '74,222,128' : '247,113,110';
      ctx.strokeStyle = `rgba(${rgb},${a})`;
      ctx.fillStyle = `rgba(${rgb},${a})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y(c.hi));
      ctx.lineTo(x, y(c.lo));
      ctx.stroke();
      const yt = y(Math.max(c.o, c.c));
      const bh = Math.max(1, Math.abs(y(c.o) - y(c.c)));
      // alta vazada, baixa cheia (a forma diz a direção, não a cor)
      if (up) ctx.strokeRect(x - BODY / 2, yt, BODY, bh);
      else ctx.fillRect(x - BODY / 2, yt, BODY, bh);
    }
  };
  const frame = () => {
    offset += 0.12;
    if (offset >= STEP) {
      offset -= STEP;
      candles.shift();
      candles.push(next());
    }
    draw();
    if (!document.hidden) raf = requestAnimationFrame(frame);
  };
  const onVis = () => animate && !document.hidden && (cancelAnimationFrame(raf), (raf = requestAnimationFrame(frame)));
  document.addEventListener('visibilitychange', onVis);
  if (animate) raf = requestAnimationFrame(frame);
  else draw();
  return () => {
    cancelAnimationFrame(raf);
    removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', onVis);
    candles = [];
  };
}

export function AuroraBackground() {
  const glRef = useRef<HTMLCanvasElement>(null);
  const flowRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const desktop = matchMedia('(pointer: fine) and (min-width: 768px)').matches;
    const mouse = { x: 0.5, y: 0.8, on: false };
    const move = (e: PointerEvent) => {
      mouse.x = e.clientX / innerWidth;
      mouse.y = 1 - e.clientY / innerHeight;
      mouse.on = true;
    };
    const leave = () => (mouse.on = false);
    addEventListener('pointermove', move, { passive: true });
    document.addEventListener('mouseleave', leave);

    let stops: (() => void)[] = [];
    // só depois que a página carregou e o usuário já está vendo o conteúdo
    const idle = (cb: () => void) => ('requestIdleCallback' in window ? (window as Window & { requestIdleCallback: (f: () => void, o?: object) => number }).requestIdleCallback(cb, { timeout: 2000 }) : setTimeout(cb, 300));
    let timer = 0;
    const boot = () => (timer = window.setTimeout(() => idle(start), desktop ? 400 : 2500));
    const start = () => {
      if (glRef.current) stops.push(startShader(glRef.current, mouse, !reduce, !desktop));
      // no celular as velas ficam paradas (economia de bateria)
      if (flowRef.current) stops.push(startCandles(flowRef.current, desktop && !reduce));
      glRef.current?.classList.add('opacity-100');
    };
    if (document.readyState === 'complete') boot();
    else addEventListener('load', boot, { once: true });
    return () => {
      clearTimeout(timer);
      removeEventListener('load', boot);
      stops.forEach((s) => s());
      stops = [];
      removeEventListener('pointermove', move);
      document.removeEventListener('mouseleave', leave);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-carbono">
      <canvas ref={glRef} className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-1000" />
      <canvas ref={flowRef} className="absolute inset-0 h-full w-full [mask-image:linear-gradient(180deg,transparent_45%,#000_70%,#000_85%,transparent)]" />
    </div>
  );
}
