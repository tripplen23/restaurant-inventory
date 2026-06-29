'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { useTranslations } from 'next-intl';
import { classifyStock } from '@/lib/client-helpers';
import { StockBadge } from '@/components/StockBadge';

type ToastState = {
  id: number;
  kind: 'in' | 'out' | 'edit' | 'delete';
  text: string;
  tone: 'ink' | 'cinnabar' | 'jade';
};

type PendingTx = {
  type: 'in' | 'out';
  qty: number;
  product: Product;
  rowSetter: (v: string) => void;
};

export default function HomePage() {
  const t = useTranslations('Stock');
  const tEdit = useTranslations('Edit');
  const tDelete = useTranslations('Delete');
  const tTx = useTranslations('Transaction');
  const tConfirm = useTranslations('Confirm');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stampKey, setStampKey] = useState(0);
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const toastIdRef = useRef(0);

  // Edit state
  const [editing, setEditing] = useState<Product | null>(null);

  // Delete state
  const [deleting, setDeleting] = useState<Product | null>(null);

  // Confirm-transaction state (shown when user types qty + Enter/blur)
  const [pendingTx, setPendingTx] = useState<PendingTx | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/products', { cache: 'no-store' });
      const data = await r.json();
      setProducts(data.products);
      setError(null);
      setStampKey((k) => k + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load stock');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 10_000);
    return () => clearInterval(t);
  }, [load]);

  const showToast = useCallback((t: Omit<ToastState, 'id'>) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 2400);
  }, []);

  if (loading) {
    return (
      <div className="text-center py-20" style={{ color: 'var(--ink-500)' }}>
        {t('loading')}
      </div>
    );
  }
  if (error) {
    return (
      <div className="card" style={{ borderColor: 'var(--urgent)', color: 'var(--urgent)' }}>
        {t('errorPrefix')}: {error}
      </div>
    );
  }

  const low = products.filter((p) => p.current_stock < p.threshold);
  const totalUnits = products.reduce((s, p) => s + p.current_stock, 0);

  return (
    <div className="space-y-6">
      {/* Header — slim, no instruction subtext */}
      <header className="flex items-end justify-between gap-4">
        <div>
          <div className="eyebrow">{t('eyebrow')}</div>
          <h1 className="h-display mt-1">{t('title')}</h1>
        </div>
        <div className="text-right">
          <div className="eyebrow">{t('totalUnits')}</div>
          <div
            key={stampKey}
            className="big-number animate-count"
            style={{ color: 'var(--ink-900)' }}
          >
            {totalUnits.toFixed(2)}
          </div>
        </div>
      </header>

      {/* Reorder alert */}
      {low.length > 0 && (
        <Link href="/reorder" className="block no-underline" style={{ color: 'inherit' }}>
          <div
            className="pt-4 flex items-center gap-4"
            style={{ borderTop: '2px solid var(--cinnabar)' }}
          >
            <span
              className="hanko hanko-lg animate-stamp"
              key={`alert-${stampKey}`}
            >
              !
            </span>
            <div className="flex-1 min-w-0">
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.2rem',
                  fontWeight: 500,
                  color: 'var(--cinnabar)',
                }}
              >
                {t('reorder', { count: low.length })}
              </div>
              <div style={{ color: 'var(--ink-700)', marginTop: 2, fontSize: '0.95rem' }}>
                {low.map((p) => p.name.split(' (')[0]).join(' · ')}
              </div>
            </div>
            <div style={{ color: 'var(--cinnabar)', fontWeight: 600 }}>{t('reorderView')} →</div>
          </div>
        </Link>
      )}

      {/* Stock list — inline Out/In inputs + Edit/Delete */}
      <section>
        <div className="stock-list-header">
          <div>{t('colProduct')}</div>
          <div className="text-center" style={{ color: 'var(--jade)' }}>{t('colIn')}</div>
          <div className="text-center" style={{ color: 'var(--cinnabar)' }}>{t('colOut')}</div>
          <div className="text-right">{t('colOnHand')}</div>
          <div></div>
        </div>

        <ul style={{ borderTop: '1px solid var(--paper-200)' }}>
          {products.map((p) => (
            <ProductRow
              key={p.id}
              product={p}
              t={t}
              tTx={tTx}
              tEdit={tEdit}
              tDelete={tDelete}
              onRequest={(type, qty, rowSetter) => {
                // Open confirm modal; row.clearInput() is called only after confirm or cancel
                setPendingTx({ type, qty, product: p, rowSetter });
              }}
              onEdit={(p) => setEditing(p)}
              onDelete={(p) => setDeleting(p)}
            />
          ))}
        </ul>
      </section>

      {/* Edit modal — inline on stock page */}
      {editing && (
        <EditModal
          product={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            if (navigator.vibrate) navigator.vibrate(50);
            showToast({ kind: 'edit', tone: 'jade', text: tEdit('updatedToast', { name: editing.name.split(' (')[0] }) });
            await load();
          }}
        />
      )}

      {/* Delete confirm — inline */}
      {deleting && (
        <DeleteModal
          product={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={async () => {
            const name = deleting.name.split(' (')[0];
            setDeleting(null);
            if (navigator.vibrate) navigator.vibrate([20, 30, 60]);
            showToast({ kind: 'delete', tone: 'ink', text: tDelete('deletedToast', { name }) });
            await load();
          }}
        />
      )}

      {/* Confirm transaction modal — shown after user types qty + Enter/blur */}
      {pendingTx && (
        <ConfirmTxModal
          pending={pendingTx}
          onClose={() => {
            pendingTx.rowSetter('');
            setPendingTx(null);
          }}
          onConfirm={async () => {
            const tx = pendingTx;
            setPendingTx(null);
            tx.rowSetter(''); // clear input immediately on confirm
            try {
              const r = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  product_id: tx.product.id,
                  type: tx.type,
                  quantity: tx.qty,
                }),
              });
              if (!r.ok) {
                const d = await r.json().catch(() => ({}));
                throw new Error(d.error || 'Save failed');
              }
              if (navigator.vibrate) navigator.vibrate(40);
              showToast({
                kind: tx.type,
                tone: tx.type === 'out' ? 'cinnabar' : 'jade',
                text:
                  tx.type === 'out'
                    ? tTx('toastOut', {
                        qty: tx.qty.toFixed(2),
                        unit: tx.product.unit,
                        name: tx.product.name.split(' (')[0],
                      })
                    : tTx('toastIn', {
                        qty: tx.qty.toFixed(2),
                        unit: tx.product.unit,
                        name: tx.product.name.split(' (')[0],
                      }),
              });
              await load();
            } catch (e) {
              // Restore input on error so user can retry
              tx.rowSetter(String(tx.qty));
              showToast({
                kind: tx.type,
                tone: 'ink',
                text: e instanceof Error ? e.message : 'Save failed',
              });
            }
          }}
        />
      )}

      {/* Toasts */}
      <div
        className="fixed left-0 right-0 z-40 flex flex-col items-center gap-2 pointer-events-none"
        style={{ bottom: 24 }}
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center gap-3 px-4 py-3 shadow-lg"
            style={{
              background:
                t.tone === 'cinnabar' ? 'var(--cinnabar)' :
                t.tone === 'jade' ? 'var(--jade)' :
                'var(--ink-900)',
              color: 'var(--paper-50)',
              borderRadius: 999,
              fontSize: '0.95rem',
              fontWeight: 500,
              animation: 'toast-in 220ms cubic-bezier(0.16, 1, 0.3, 1) both',
            }}
          >
            <span
              className="hanko"
              aria-hidden
              style={{
                background: 'var(--paper-50)',
                color:
                  t.tone === 'cinnabar' ? 'var(--cinnabar)' :
                  t.tone === 'jade' ? 'var(--jade)' :
                  'var(--ink-900)',
                width: '1.5rem',
                height: '1.5rem',
                fontSize: '0.85rem',
                transform: 'none',
                boxShadow: 'none',
              }}
            >
              {t.kind === 'in' ? '+' : t.kind === 'out' ? '−' : t.kind === 'edit' ? '✓' : '×'}
            </span>
            <span>{t.text}</span>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes toast-in {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes modal-in {
          from { transform: translateY(12px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes scrim-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          div[aria-live] > div { animation: none; }
        }
      `}</style>
    </div>
  );
}

function ProductRow({
  product,
  onRequest,
  onEdit,
  onDelete,
  t,
  tTx,
  tEdit,
  tDelete,
}: {
  product: Product;
  onRequest: (type: 'in' | 'out', qty: number, rowSetter: (v: string) => void) => void;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
  t: ReturnType<typeof useTranslations<'Stock'>>;
  tTx: ReturnType<typeof useTranslations<'Transaction'>>;
  tEdit: ReturnType<typeof useTranslations<'Edit'>>;
  tDelete: ReturnType<typeof useTranslations<'Delete'>>;
}) {
  const [outVal, setOutVal] = useState('');
  const [inVal, setInVal] = useState('');
  const [err, setErr] = useState<string | null>(null);
  // Overflow menu (mobile): ⋯ button reveals Edit/Delete popover
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  // refs to detect double-fire between Enter and blur on the same input
  const lastOutSubmit = useRef<number>(0);
  const lastInSubmit = useRef<number>(0);

  // Close overflow menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, [menuOpen]);

  const request = (type: 'in' | 'out', raw: string) => {
    const v = raw.trim();
    if (!v) return;
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) {
      setErr(tTx('mustBePositive'));
      return;
    }
    setErr(null);
    if (type === 'in') lastInSubmit.current = Date.now();
    else lastOutSubmit.current = Date.now();
    onRequest(type, n, type === 'in' ? setInVal : setOutVal);
  };

  const handleKey = (
    e: React.KeyboardEvent<HTMLInputElement>,
    type: 'in' | 'out',
    val: string,
    setter: (v: string) => void
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      request(type, val);
    } else if (e.key === 'Escape') {
      setter('');
      setErr(null);
      e.currentTarget.blur();
    }
  };

  const handleBlur = (type: 'in' | 'out', val: string) => {
    // Skip if this blur is the immediate aftermath of an Enter submit
    // (Enter does not blur, but a click on another element shortly after
    // would trigger blur and double-fire). 250ms is enough to debounce.
    const last = type === 'in' ? lastInSubmit.current : lastOutSubmit.current;
    if (Date.now() - last < 250) return;
    if (val.trim()) request(type, val);
  };

  const level = classifyStock(product.current_stock, product.threshold, null);

  return (
    <li
      className="product-card"
      style={{
        borderBottom: '1px solid var(--paper-200)',
        padding: '12px 0',
      }}
    >
      {/* Column 1: product name + status badge (left) + overflow menu button (mobile) */}
      <div className="card-name">
        <div className="min-w-0 flex-1">
          <div className="product-name">
            {product.name.split(' (')[0]}
          </div>
          <div className="mt-1.5">
            <StockBadge
              level={level}
              stock={product.current_stock}
              threshold={product.threshold}
            />
          </div>
        </div>

        {/* Mobile overflow menu — ⋯ button + popover with Edit/Delete */}
        <div className="card-overflow" ref={menuRef}>
          <button
            type="button"
            className="overflow-trigger"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={`Actions for ${product.name}`}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            title="More"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <circle cx="5" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
            </svg>
          </button>
          {menuOpen && (
            <div className="overflow-popover" role="menu">
              <button
                type="button"
                className="overflow-item"
                role="menuitem"
                onClick={() => { setMenuOpen(false); onEdit(product); }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                </svg>
                <span>{tEdit('title')}</span>
              </button>
              <button
                type="button"
                className="overflow-item overflow-item-danger"
                role="menuitem"
                onClick={() => { setMenuOpen(false); onDelete(product); }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
                <span>{tDelete('title')}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Column 2: In input (jade) — desktop: inline input */}
      <div className="card-col-in">
        <QtyInput
          value={inVal}
          onChange={setInVal}
          onKeyDown={(e) => handleKey(e, 'in', inVal, setInVal)}
          onBlur={() => handleBlur('in', inVal)}
          tone="jade"
          placeholder="0"
          column="in"
        />
      </div>

      {/* Column 3: Out input (cinnabar) — desktop: inline input */}
      <div className="card-col-out">
        <QtyInput
          value={outVal}
          onChange={setOutVal}
          onKeyDown={(e) => handleKey(e, 'out', outVal, setOutVal)}
          onBlur={() => handleBlur('out', outVal)}
          tone="cinnabar"
          placeholder="0"
          column="out"
        />
      </div>

      {/* Column 4: On-hand quantity (static number) */}
      <div className="card-col-onhand">
        <div
          className="on-hand-num"
          style={{
            color: level === 'ok' ? 'var(--ink-900)' : 'var(--cinnabar)',
          }}
        >
          {product.current_stock.toFixed(2)}
        </div>
        <div className="eyebrow">{product.unit}</div>
      </div>

      {/* Column 5: Edit + Delete actions (desktop only) */}
      <div className="card-actions-desktop">
        <IconButton
          onClick={() => onEdit(product)}
          aria-label={`Edit ${product.name}`}
          title={tEdit('title')}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
          </svg>
        </IconButton>
        <IconButton
          onClick={() => onDelete(product)}
          aria-label={`Delete ${product.name}`}
          title={tDelete('title')}
          tone="danger"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </IconButton>
      </div>

      {/* Error message — full width on mobile, hidden on desktop unless needed */}
      {err && (
        <div
          className="card-error"
          style={{
            color: 'var(--urgent)',
            fontSize: '0.8rem',
            fontWeight: 600,
            marginTop: 4,
          }}
        >
          {err}
        </div>
      )}
    </li>
  );
}

function QtyInput({
  value,
  onChange,
  onKeyDown,
  onBlur,
  tone,
  placeholder,
  column,
}: {
  value: string;
  onChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  tone: 'jade' | 'cinnabar';
  placeholder: string;
  column?: 'in' | 'out';
}) {
  const accent = tone === 'jade' ? 'var(--jade)' : 'var(--cinnabar)';
  const isIn = column === 'in';
  const isOut = column === 'out';

  return (
    <div className="qty-wrapper" data-column={column}>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        placeholder={placeholder}
        className="qty-input num w-full text-center outline-none"
        style={{
          height: 56,
          padding: '0 8px',
          fontSize: '1.3rem',
          fontWeight: 600,
          background: 'var(--paper-50)',
          border: `1.5px solid ${value ? accent : 'var(--paper-200)'}`,
          borderRadius: 6,
          color: accent,
          transition: 'border-color 150ms ease',
          caretColor: accent,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = accent;
          e.currentTarget.select();
        }}
        aria-label={isIn ? 'Stock in quantity' : isOut ? 'Stock out quantity' : 'Quantity'}
      />
      {/* Mobile-only inline action button — opens the confirm modal directly */}
      <ActionButton
        tone={tone}
        type={isIn ? 'in' : isOut ? 'out' : null}
        hasValue={value.trim().length > 0}
        onConfirm={() => onKeyDown({ key: 'Enter', preventDefault: () => {} } as React.KeyboardEvent<HTMLInputElement>)}
      />
    </div>
  );
}

/** Mobile-only shortcut button. Renders a large + or − beside the input so
 *  the cook can tap once to confirm, instead of hunt for the on-screen keyboard. */
function ActionButton({
  tone,
  type,
  hasValue,
  onConfirm,
}: {
  tone: 'jade' | 'cinnabar';
  type: 'in' | 'out' | null;
  hasValue: boolean;
  onConfirm: () => void;
}) {
  if (!type) return null;
  const accent = tone === 'jade' ? 'var(--jade)' : 'var(--cinnabar)';
  const char = type === 'in' ? '+' : '−';
  const aria = type === 'in' ? 'Confirm stock in' : 'Confirm stock out';
  return (
    <button
      type="button"
      className="qty-action"
      onClick={onConfirm}
      disabled={!hasValue}
      aria-label={aria}
      style={{
        background: hasValue ? accent : 'var(--paper-100)',
        color: hasValue ? 'var(--paper-50)' : 'var(--ink-500)',
        boxShadow: hasValue
          ? (type === 'in' ? '0 2px 0 #3a533a' : '0 2px 0 var(--cinnabar-deep)')
          : 'none',
      }}
    >
      <span aria-hidden>{char}</span>
      <span className="qty-action-label">{type === 'in' ? 'In' : 'Out'}</span>
    </button>
  );
}

function IconButton({
  onClick,
  children,
  tone = 'default',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'default' | 'danger' }) {
  return (
    <button
      onClick={onClick}
      {...rest}
      style={{
        width: 44,
        height: 44,
        minWidth: 44,
        minHeight: 44,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        color: tone === 'danger' ? 'var(--ink-500)' : 'var(--ink-700)',
        border: '1.5px solid var(--paper-200)',
        borderRadius: 8,
        cursor: 'pointer',
        transition: 'background-color 150ms ease, color 150ms ease, border-color 150ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = tone === 'danger' ? 'var(--cinnabar)' : 'var(--paper-100)';
        e.currentTarget.style.color = tone === 'danger' ? 'var(--paper-50)' : 'var(--ink-900)';
        e.currentTarget.style.borderColor = tone === 'danger' ? 'var(--cinnabar)' : 'var(--ink-500)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = tone === 'danger' ? 'var(--ink-500)' : 'var(--ink-700)';
        e.currentTarget.style.borderColor = 'var(--paper-200)';
      }}
    >
      {children}
    </button>
  );
}

function EditModal({
  product,
  onClose,
  onSaved,
}: {
  product: Product;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations('Edit');
  const [name, setName] = useState(product.name);
  const [unit, setUnit] = useState(product.unit);
  const [threshold, setThreshold] = useState(String(product.threshold));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim()) {
      setErr(t('nameRequired'));
      return;
    }
    const thr = Number(threshold);
    if (!Number.isFinite(thr) || thr < 0) {
      setErr(t('thresholdInvalid'));
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          unit: unit.trim() || 'box',
          threshold: thr,
        }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || t('saveFailed'));
      }
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : t('saveFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell onClose={onClose} title={t('title')} icon="edit">
      <div className="space-y-4">
        <Field label={t('name')}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
            style={{ fontSize: '1.4rem', fontWeight: 500 }}
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('unit')}>
            <input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="input-field num"
              style={{ fontSize: '1.2rem' }}
            />
          </Field>
          <Field label={t('threshold')}>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="input-field num"
              style={{ fontSize: '1.2rem' }}
            />
          </Field>
        </div>

        {err && (
          <div
            className="card"
            style={{ borderColor: 'var(--urgent)', color: 'var(--urgent)', fontSize: '0.9rem' }}
          >
            {err}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={busy}
            className="btn-secondary flex-1"
          >
            {t('cancel')}
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="btn-primary flex-1"
            style={{ opacity: busy ? 0.5 : 1 }}
          >
            {busy ? t('saving') : t('save')}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function DeleteModal({
  product,
  onClose,
  onDeleted,
}: {
  product: Product;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const t = useTranslations('Delete');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const confirm = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch(`/api/products/${product.id}`, { method: 'DELETE' });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || t('deleteFailed'));
      }
      onDeleted();
    } catch (e) {
      setErr(e instanceof Error ? e.message : t('deleteFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell onClose={onClose} title={t('title')} icon="danger">
      <div className="space-y-5">
        <p style={{ fontSize: '1.1rem', color: 'var(--ink-700)', lineHeight: 1.5 }}>
          {t('body', { name: product.name.split(' (')[0] })}
        </p>

        {err && (
          <div
            className="card"
            style={{ borderColor: 'var(--urgent)', color: 'var(--urgent)', fontSize: '0.9rem' }}
          >
            {err}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={busy}
            className="btn-secondary flex-1"
          >
            {t('cancel')}
          </button>
          <button
            onClick={confirm}
            disabled={busy}
            className="flex-1"
            style={{
              minHeight: 80,
              minWidth: 80,
              background: 'var(--cinnabar)',
              color: 'var(--paper-50)',
              border: 'none',
              borderRadius: 14,
              fontSize: '1.25rem',
              fontWeight: 600,
              cursor: busy ? 'wait' : 'pointer',
              opacity: busy ? 0.5 : 1,
              boxShadow: '0 2px 0 var(--cinnabar-deep)',
              transition: 'transform 120ms ease, background-color 200ms ease',
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = 'translateY(1px) scale(0.99)'; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'none'; }}
          >
            {busy ? t('deleting') : t('confirm')}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="eyebrow" style={{ display: 'block', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function ModalShell({
  onClose,
  title,
  icon,
  children,
}: {
  onClose: () => void;
  title: string;
  icon: 'edit' | 'danger' | 'in' | 'out';
  children: React.ReactNode;
}) {
  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const hankoChar =
    icon === 'danger' ? '×' :
    icon === 'in' ? '+' :
    icon === 'out' ? '−' :
    '✎';
  const hankoBg =
    icon === 'danger' ? 'var(--cinnabar)' :
    icon === 'in' ? 'var(--jade)' :
    icon === 'out' ? 'var(--cinnabar)' :
    'var(--ink-900)';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{
        background: 'rgba(26, 24, 20, 0.45)',
        animation: 'scrim-in 180ms ease both',
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--paper-50)',
          borderRadius: 18,
          padding: '1.5rem',
          boxShadow: '0 20px 60px rgba(26, 24, 20, 0.3)',
          animation: 'modal-in 220ms cubic-bezier(0.16, 1, 0.3, 1) both',
        }}
      >
        <div className="flex items-center gap-3 mb-5">
          <span
            className="hanko"
            aria-hidden
            style={{
              background: hankoBg,
              width: '2rem',
              height: '2rem',
              fontSize: '1rem',
            }}
          >
            {hankoChar}
          </span>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.5rem',
              fontWeight: 500,
              color: 'var(--ink-900)',
            }}
          >
            {title}
          </h2>
        </div>
        {children}
      </div>
    </div>
  );
}

function ConfirmTxModal({
  pending,
  onClose,
  onConfirm,
}: {
  pending: PendingTx;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const t = useTranslations('Confirm');
  const isIn = pending.type === 'in';
  const qtyStr = pending.qty.toFixed(2);
  const name = pending.product.name.split(' (')[0];

  return (
    <ModalShell onClose={onClose} title={t(isIn ? 'titleIn' : 'titleOut')} icon={pending.type}>
      <div className="space-y-5">
        <p
          style={{
            fontSize: '1.1rem',
            color: 'var(--ink-700)',
            lineHeight: 1.5,
            fontFamily: 'var(--font-body)',
          }}
        >
          {t(isIn ? 'bodyIn' : 'bodyOut', {
            qty: qtyStr,
            unit: pending.product.unit,
            name,
          })}
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="btn-secondary flex-1"
            style={{ minHeight: 80, fontSize: '1.25rem' }}
          >
            {t('cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1"
            style={{
              minHeight: 80,
              minWidth: 80,
              background: isIn ? 'var(--jade)' : 'var(--cinnabar)',
              color: 'var(--paper-50)',
              border: 'none',
              borderRadius: 14,
              fontSize: '1.25rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: isIn
                ? '0 2px 0 #3a533a'
                : '0 2px 0 var(--cinnabar-deep)',
              transition: 'transform 120ms ease',
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = 'translateY(1px) scale(0.99)'; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'none'; }}
            autoFocus
          >
            {t('confirm')}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
