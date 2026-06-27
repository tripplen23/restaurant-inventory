'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import type { Product } from '@/lib/types';
import { NumPad } from '@/components/NumPad';

export default function TransactionPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const productId = params.id;

  const [product, setProduct] = useState<Product | null>(null);
  const [mode, setMode] = useState<'in' | 'out' | null>(null);
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/products', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        const p = d.products.find((x: Product) => x.id === productId);
        if (p) setProduct(p);
        else setError('Product not found');
      });
  }, [productId]);

  const submit = async () => {
    if (!mode || !value) return;
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) {
      setError('Invalid quantity');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const r = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, type: mode, quantity: num }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || 'Save failed');
      }
      if (navigator.vibrate) navigator.vibrate(50);
      router.push('/');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className="card" style={{ borderColor: 'var(--urgent)', color: 'var(--urgent)' }}>
        {error}
      </div>
    );
  }
  if (!product) {
    return (
      <div className="text-center py-20" style={{ color: 'var(--ink-500)' }}>
        Loading…
      </div>
    );
  }

  // Step 1: choose mode
  if (!mode) {
    return (
      <div className="space-y-7">
        <header>
          <div className="eyebrow">Item</div>
          <h1 className="h-display mt-1">{product.name.split(' (')[0]}</h1>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="big-number" style={{ color: 'var(--ink-900)' }}>
              {product.current_stock.toFixed(2)}
            </span>
            <span className="eyebrow">{product.unit} on hand</span>
          </div>
        </header>

        <p style={{ fontSize: '1.1rem', color: 'var(--ink-700)' }}>
          What happened?
        </p>

        {/* Big action chooser — kanji is the signature callout */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setMode('in')}
            className="btn-touch"
            style={{
              background: 'var(--paper-50)',
              border: '2px solid var(--cinnabar)',
              color: 'var(--ink-900)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              padding: '2rem 1rem',
            }}
          >
            <span
              className="hanko hanko-lg"
              style={{ width: '4rem', height: '4rem', fontSize: '2rem' }}
              aria-hidden
            >
              +
            </span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 500, color: 'var(--cinnabar)' }}>
              Stock In
            </span>
            <span className="eyebrow">Received from supplier</span>
          </button>

          <button
            onClick={() => setMode('out')}
            className="btn-touch"
            style={{
              background: 'var(--paper-50)',
              border: '2px solid var(--ink-900)',
              color: 'var(--ink-900)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              padding: '2rem 1rem',
            }}
          >
            <span
              className="hanko hanko-ink hanko-lg"
              style={{ width: '4rem', height: '4rem', fontSize: '2rem' }}
              aria-hidden
            >
              −
            </span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 500 }}>
              Stock Out
            </span>
            <span className="eyebrow">Sent to the kitchen</span>
          </button>
        </div>

        <button
          onClick={() => router.push('/')}
          className="btn-ghost w-full"
          style={{ fontSize: '1rem' }}
        >
          ← Cancel
        </button>
      </div>
    );
  }

  // Step 2: enter quantity via numpad
  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-3">
          <span
            className={`hanko hanko-lg ${mode === 'in' ? '' : 'hanko-ink'} animate-stamp`}
            key={mode}
            aria-hidden
          >
            {mode === 'in' ? '+' : '−'}
          </span>
          <div>
            <div className="eyebrow">
              {product.name.split(' (')[0]} · {mode === 'in' ? 'Stock In' : 'Stock Out'}
            </div>
            <h1 className="h-display mt-1">
              {mode === 'in' ? 'How much came in?' : 'How much went out?'}
            </h1>
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="eyebrow">On hand</span>
          <span className="num" style={{ color: 'var(--ink-900)', fontWeight: 600 }}>
            {product.current_stock.toFixed(2)}
          </span>
          <span className="eyebrow">{product.unit}</span>
        </div>
      </header>

      <div className="card">
        <NumPad value={value} onChange={setValue} onCommit={submit} />
        <p style={{ color: 'var(--ink-500)', fontSize: '0.85rem', marginTop: 12 }}>
          Decimals supported: 0.25 (quarter box), 0.33 (third box).
        </p>
      </div>

      {submitting && (
        <p className="text-center" style={{ color: 'var(--ink-500)' }}>Saving…</p>
      )}

      <button
        onClick={() => {
          setMode(null);
          setValue('');
        }}
        className="btn-ghost w-full"
        style={{ fontSize: '1rem' }}
      >
        ← Change action
      </button>
    </div>
  );
}
