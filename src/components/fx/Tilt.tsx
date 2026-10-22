import { useRef, type ReactNode } from 'react';
import { useFinePointer } from '@/hooks/useFinePointer';
import { cx } from '@/lib/format';

/** Inclinação 3D seguindo o cursor (mockup do produto). */
export function Tilt({ children, max = 6, className }: { children: ReactNode; max?: number; className?: string }) {
  const on = useFinePointer();
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div className={cx('[perspective:1600px]', className)}>
      <div
        ref={ref}
        className="h-full w-full transition-transform duration-700 ease-[cubic-bezier(.2,.7,.1,1)] [transform-style:preserve-3d]"
        onPointerMove={(e) => {
          if (!on || !ref.current) return;
          const r = ref.current.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          ref.current.style.transform = `rotateY(${px * max}deg) rotateX(${-py * max}deg)`;
        }}
        onPointerLeave={() => ref.current && (ref.current.style.transform = '')}
      >
        {children}
      </div>
    </div>
  );
}
