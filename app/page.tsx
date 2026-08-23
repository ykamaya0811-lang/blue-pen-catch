'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Pen = { id: number; x: number; y: number; color: 'blue' | 'red'; speed: number };

export default function Home() {
  const fieldRef = useRef<HTMLDivElement>(null);
  const basketXRef = useRef(50);
  const pensRef = useRef<Pen[]>([]);
  const runningRef = useRef(false);
  const lastSpawnRef = useRef(0);
  const lastTimeRef = useRef(0);
  const idRef = useRef(0);
  const [basketX, setBasketX] = useState(50);
  const [pens, setPens] = useState<Pen[]>([]);
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState<'ready' | 'playing' | 'over'>('ready');

  const start = useCallback(() => {
    pensRef.current = [];
    setPens([]);
    setScore(0);
    lastSpawnRef.current = 0;
    lastTimeRef.current = performance.now();
    runningRef.current = true;
    setStatus('playing');
  }, []);

  const moveBasket = useCallback((clientX: number) => {
    const rect = fieldRef.current?.getBoundingClientRect();
    if (!rect) return;
    const next = Math.max(12, Math.min(88, ((clientX - rect.left) / rect.width) * 100));
    basketXRef.current = next;
    setBasketX(next);
  }, []);

  useEffect(() => {
    let frame = 0;
    const loop = (now: number) => {
      const dt = Math.min(32, now - lastTimeRef.current);
      lastTimeRef.current = now;
      if (runningRef.current) {
        if (now - lastSpawnRef.current > 820) {
          pensRef.current.push({ id: idRef.current++, x: 9 + Math.random() * 82, y: -15, color: Math.random() < 0.68 ? 'blue' : 'red', speed: 0.032 + Math.random() * 0.009 });
          lastSpawnRef.current = now;
        }
        const next: Pen[] = [];
        for (const pen of pensRef.current) {
          const moved = { ...pen, y: pen.y + pen.speed * dt };
          const caught = moved.y >= 73 && moved.y <= 88 && Math.abs(moved.x - basketXRef.current) < 12;
          if (caught) {
            if (moved.color === 'blue') setScore((value) => value + 1);
            else { runningRef.current = false; setStatus('over'); }
          } else if (moved.y < 108) next.push(moved);
        }
        pensRef.current = next;
        setPens([...next]);
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <main className="page-shell">
      <section ref={fieldRef} className="game-field" aria-label="青いペンをペン立てでキャッチするゲーム"
        onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); moveBasket(event.clientX); }}
        onPointerMove={(event) => { if (event.buttons || event.pointerType === 'touch') moveBasket(event.clientX); }}>
        <div className="topbar">
          <div className="score-card" aria-label={`スコア ${score}`}><span className="mini-pen blue" /><strong>{score}</strong></div>
          <div className="legend" aria-hidden="true"><span><i className="mini-pen blue" /> とる</span><span><i className="mini-pen red" /> よける</span></div>
        </div>
        {pens.map((pen) => <div key={pen.id} className={`falling-pen ${pen.color}`} style={{ left: `${pen.x}%`, top: `${pen.y}%` }}><span className="pen-cap" /><span className="pen-body" /><span className="pen-tip" /></div>)}
        <div className="basket-wrap" style={{ left: `${basketX}%` }}><div className="basket-rim" /><div className="basket"><span /><span /><span /></div></div>
        {status !== 'playing' && <div className="overlay"><div className="panel"><div className="hero-pens" aria-hidden="true"><span className="big-pen blue" /><span className="big-pen red" /></div><h1>{status === 'over' ? '赤いペンに当たった！' : 'BLUE PEN CATCH'}</h1><p>{status === 'over' ? `スコア ${score}` : '青だけとって、赤はよけよう'}</p><button type="button" onClick={start}>{status === 'over' ? 'もう一度' : 'スタート'}</button></div></div>}
        {status === 'playing' && <p className="move-hint">左右にドラッグ</p>}
      </section>
    </main>
  );
}
