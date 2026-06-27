'use client';

import { useState } from 'react';

type Props = {
  value: string;
  onChange: (v: string) => void;
  onCommit: () => void;
};

// Numpad lớn cho môi trường bếp: găng tay dày, đứng trước kho lạnh.
// Aesthetic: ink-black display, washi paper keys, cinnabar commit.
export function NumPad({ value, onChange, onCommit }: Props) {
  const [err, setErr] = useState<string | null>(null);

  const press = (k: string) => {
    setErr(null);
    if (k === 'back') {
      onChange(value.slice(0, -1));
      return;
    }
    if (k === '.') {
      if (value.includes('.')) return; // chỉ 1 dấu chấm
      if (value === '') onChange('0.');
      else onChange(value + '.');
      return;
    }
    onChange(value + k);
  };

  const commit = () => {
    if (!value) {
      setErr('Enter a number');
      return;
    }
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) {
      setErr('Must be greater than 0');
      return;
    }
    onCommit();
  };

  return (
    <div>
      {/* Display lớn — ink on washi, cinnabar current value */}
      <div
        style={{
          marginBottom: 16,
          padding: '1.25rem 1.5rem',
          background: 'var(--ink-900)',
          color: 'var(--paper-50)',
          borderRadius: 8,
          textAlign: 'right',
        }}
      >
        <div style={{ color: 'var(--ink-500)', fontSize: '0.75rem', marginBottom: 4 }}>
          Boxes
        </div>
        <div
          className="num"
          style={{
            fontSize: '3rem',
            fontWeight: 600,
            lineHeight: 1.05,
            color: 'var(--paper-50)',
            minHeight: '3.25rem',
            letterSpacing: '-0.02em',
          }}
        >
          {value || '0'}
          <span
            aria-hidden
            style={{
              display: 'inline-block',
              width: 3,
              height: '2.5rem',
              background: 'var(--cinnabar)',
              marginLeft: 6,
              verticalAlign: '-0.55rem',
              animation: 'blink 1.1s steps(1) infinite',
            }}
          />
        </div>
      </div>

      {/* Grid 3×4 */}
      <div className="grid grid-cols-3 gap-3">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button
            key={d}
            onClick={() => press(d)}
            className="btn-touch"
            type="button"
            style={{
              background: 'var(--paper-50)',
              color: 'var(--ink-900)',
              border: '1px solid var(--paper-200)',
              fontSize: '1.75rem',
              fontFamily: 'var(--font-mono)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {d}
          </button>
        ))}
        <button
          onClick={() => press('.')}
          className="btn-touch"
          type="button"
          aria-label="Decimal point"
          style={{
            background: 'var(--paper-50)',
            color: 'var(--ink-900)',
            border: '1px solid var(--paper-200)',
            fontSize: '1.75rem',
          }}
        >
          .
        </button>
        <button
          onClick={() => press('0')}
          className="btn-touch"
          type="button"
          style={{
            background: 'var(--paper-50)',
            color: 'var(--ink-900)',
            border: '1px solid var(--paper-200)',
            fontSize: '1.75rem',
            fontFamily: 'var(--font-mono)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          0
        </button>
        <button
          onClick={() => press('back')}
          className="btn-touch"
          type="button"
          aria-label="Backspace"
          style={{
            background: 'var(--paper-100)',
            color: 'var(--ink-700)',
            border: '1px solid var(--paper-200)',
            fontSize: '1.5rem',
          }}
        >
          ⌫
        </button>
      </div>

      {err && (
        <p
          style={{
            marginTop: 12,
            color: 'var(--urgent)',
            fontSize: '1rem',
            fontWeight: 600,
            textAlign: 'center',
          }}
        >
          {err}
        </p>
      )}

      <button
        onClick={commit}
        type="button"
        className="btn-primary w-full"
        style={{
          marginTop: 16,
          fontSize: '1.2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
        }}
      >
        <span className="hanko" style={{ width: '1.5rem', height: '1.5rem', fontSize: '0.9rem', background: 'var(--paper-50)', color: 'var(--cinnabar)' }} aria-hidden>
          ✓
        </span>
        Done
      </button>

      <style jsx>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          span[aria-hidden] { animation: none; }
        }
      `}</style>
    </div>
  );
}
