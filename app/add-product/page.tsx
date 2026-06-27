'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function AddProductPage() {
  const t = useTranslations('Add');
  const tError = useTranslations('Stock');
  const router = useRouter();
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('box');
  const [threshold, setThreshold] = useState('1');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!name.trim()) {
      setError(t('errorName'));
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          unit: unit.trim() || 'box',
          threshold: Number(threshold) || 0,
        }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || t('errorSave'));
      }
      if (navigator.vibrate) navigator.vibrate(50);
      router.push('/');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : tError('errorPrefix'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-7">
      <header>
        <div className="eyebrow">{t('eyebrow')}</div>
        <h1 className="h-display mt-1">{t('title')}</h1>
        <p style={{ color: 'var(--ink-500)', marginTop: 6, fontSize: '1rem' }}>
          {t('subtitle')}
        </p>
      </header>

      <div className="space-y-5">
        <div>
          <label
            htmlFor="name"
            className="eyebrow"
            style={{ display: 'block', marginBottom: 8 }}
          >
            {t('nameLabel')}
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('namePlaceholder')}
            className="input-field"
            style={{ fontSize: '1.5rem' }}
          />
        </div>

        <div>
          <label
            htmlFor="unit"
            className="eyebrow"
            style={{ display: 'block', marginBottom: 8 }}
          >
            {t('unitLabel')}
          </label>
          <input
            id="unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="input-field"
            style={{ fontSize: '1.5rem' }}
          />
        </div>

        <div>
          <label
            htmlFor="threshold"
            className="eyebrow"
            style={{ display: 'block', marginBottom: 8 }}
          >
            {t('thresholdLabel')}
          </label>
          <input
            id="threshold"
            type="number"
            inputMode="decimal"
            step="0.1"
            min="0"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            className="input-field num"
            style={{ fontSize: '1.5rem' }}
          />
          <p style={{ color: 'var(--ink-500)', fontSize: '0.85rem', marginTop: 6 }}>
            {t('thresholdHelp')}
          </p>
        </div>

        {error && (
          <div
            className="card"
            style={{ borderColor: 'var(--urgent)', color: 'var(--urgent)' }}
          >
            {error}
          </div>
        )}

        <button
          onClick={submit}
          disabled={submitting}
          className="btn-primary w-full"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            opacity: submitting ? 0.5 : 1,
          }}
        >
          <span
            className="hanko"
            style={{
              width: '1.5rem',
              height: '1.5rem',
              fontSize: '0.9rem',
              background: 'var(--paper-50)',
              color: 'var(--cinnabar)',
            }}
            aria-hidden
          >
            ✓
          </span>
          {submitting ? t('saving') : t('save')}
        </button>

        <button
          onClick={() => router.push('/')}
          className="btn-ghost w-full"
          style={{ fontSize: '1rem' }}
        >
          {t('cancel')}
        </button>
      </div>
    </div>
  );
}
