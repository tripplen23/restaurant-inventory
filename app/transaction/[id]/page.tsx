'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { Product } from '@/lib/types';
import { NumPad } from '@/components/NumPad';

export default function TransactionPage() {
  const t = useTranslations('TransactionPage');
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
        else setError(t('productNotFound'));
      });
  }, [productId, t]);

  const submit = async () => {
    if (!mode || !value) return;
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) {
      setError(t('invalidQty'));
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
        throw new Error(d.error || t('saveFailed'));
      }
      if (navigator.vibrate) navigator.vibrate(50);
      router.push('/');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('genericError'));
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
        {t('loading')}
      </div>
    );
  }

  // Step 1: choose mode
  if (!mode) {
    return (
      <div className="space-y-7">
        <header>
          <div className="eyebrow">{t('eyebrow')}</div>
          <h1 className="h-display mt-1">{product.name.split(' (')[0]}</h1>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="big-number" style={{ color: 'var(--ink-900)' }}>
              {product.current_stock.toFixed(2)}
            </span>
            <span className="eyebrow">{t('onHand', { unit: product.unit })}</span>
          </div>
        </header>

        <p style={{ fontSize: '1.1rem', color: 'var(--ink-700)' }}>
          {t('whatHappened')}
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
              {t('stockIn')}
            </span>
            <span className="eyebrow">{t('stockInDesc')}</span>
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
              {t('stockOut')}
            </span>
            <span className="eyebrow">{t('stockOutDesc')}</span>
          </button>
        </div>

        <button
          onClick={() => router.push('/')}
          className="btn-ghost w-full"
          style={{ fontSize: '1rem' }}
        >
          {t('cancel')}
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
              {product.name.split(' (')[0]} · {mode === 'in' ? t('stockIn') : t('stockOut')}
            </div>
            <h1 className="h-display mt-1">
              {mode === 'in' ? t('howMuchIn') : t('howMuchOut')}
            </h1>
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="eyebrow">{t('onHandLabel')}</span>
          <span className="num" style={{ color: 'var(--ink-900)', fontWeight: 600 }}>
            {product.current_stock.toFixed(2)}
          </span>
          <span className="eyebrow">{product.unit}</span>
        </div>
      </header>

      <div className="card">
        <NumPad value={value} onChange={setValue} onCommit={submit} />
        <p style={{ color: 'var(--ink-500)', fontSize: '0.85rem', marginTop: 12 }}>
          {t('decimalHelp')}
        </p>
      </div>

      {submitting && (
        <p className="text-center" style={{ color: 'var(--ink-500)' }}>{t('saving')}</p>
      )}

      <button
        onClick={() => {
          setMode(null);
          setValue('');
        }}
        className="btn-ghost w-full"
        style={{ fontSize: '1rem' }}
      >
        {t('changeAction')}
      </button>
    </div>
  );
}
