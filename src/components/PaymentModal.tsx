import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import type { ServiceOrder } from '../store';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '');

type PaymentMethod = 'efectivo' | 'tarjeta' | 'mixto';

interface PaymentModalProps {
  os: string;
  total: number;
  onConfirm: (payment: ServiceOrder['payment']) => void;
  onCancel: () => void;
}

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '14px',
      color: '#1e293b',
      fontFamily: 'Inter, sans-serif',
      '::placeholder': { color: '#94a3b8' },
    },
    invalid: { color: '#ef4444' },
  },
};

function PaymentForm({ os, total, onConfirm, onCancel }: PaymentModalProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [method, setMethod] = useState<PaymentMethod>('efectivo');
  const [cashAmount, setCashAmount] = useState('');
  const [cardAmount, setCardAmount] = useState('');
  const [cardError, setCardError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [stripeReady, setStripeReady] = useState(false);

  const cashNum = parseFloat(cashAmount) || 0;
  const cardNum = parseFloat(cardAmount) || 0;
  const change =
    method === 'efectivo' ? cashNum - total :
    method === 'mixto' ? cashNum - (total - cardNum) : 0;

  const cashOk = method === 'efectivo' ? cashNum >= total : method === 'mixto' ? cashNum + cardNum >= total : true;

  const canConfirm = () => {
    if (processing) return false;
    if (method === 'efectivo') return cashNum >= total;
    if (method === 'tarjeta') return stripeReady && !cardError;
    if (method === 'mixto') return cashNum + cardNum >= total && stripeReady && !cardError;
    return false;
  };

  const handleConfirm = async () => {
    const now = new Date().toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' });

    if (method === 'efectivo') {
      onConfirm({ method: 'efectivo', cash: cashNum, paidAt: now });
      return;
    }

    if (!stripe || !elements) return;
    setProcessing(true);
    setCardError('');

    const cardEl = elements.getElement(CardElement);
    if (!cardEl) { setProcessing(false); return; }

    const { paymentMethod, error } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardEl,
    });

    if (error) {
      setCardError(error.message ?? 'Error al procesar la tarjeta');
      setProcessing(false);
      return;
    }

    const last4 = paymentMethod?.card?.last4 ?? '????';
    const brand = paymentMethod?.card?.brand ?? 'card';

    onConfirm({
      method,
      cash: method === 'mixto' ? cashNum : undefined,
      card: method === 'mixto' ? cardNum : total,
      cardLast4: last4,
      cardBrand: brand,
      paymentMethodId: paymentMethod?.id,
      paidAt: now,
    });
    setProcessing(false);
  };

  const methodBtn = (m: PaymentMethod, icon: string, label: string) => (
    <button
      onClick={() => setMethod(m)}
      className={`flex-1 flex flex-col items-center gap-1.5 py-3.5 rounded-xl border-2 transition-all ${
        method === m ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300 bg-white'
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span className={`text-[11px] font-semibold ${method === m ? 'text-blue-700' : 'text-slate-500'}`}>{label}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-blue-900 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-base" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              Cobrar Orden
            </h2>
            <p className="text-blue-200 text-xs">{os}</p>
          </div>
          <div className="text-right">
            <div className="text-blue-200 text-[11px]">Total</div>
            <div className="text-white font-bold text-2xl">${total.toFixed(2)}</div>
          </div>
        </div>

        <div className="p-6 space-y-5">

          {/* Method selector */}
          <div>
            <label className="form-label mb-2">Método de pago</label>
            <div className="flex gap-2">
              {methodBtn('efectivo', '💵', 'Efectivo')}
              {methodBtn('tarjeta', '💳', 'Tarjeta')}
              {methodBtn('mixto', '🔀', 'Mixto')}
            </div>
          </div>

          {/* Cash */}
          {(method === 'efectivo' || method === 'mixto') && (
            <div>
              <label className="form-label">
                {method === 'mixto' ? 'Monto en efectivo ($)' : 'Monto recibido ($)'}
              </label>
              <input
                className="form-input text-base font-semibold"
                type="number" step="0.01" min="0" placeholder="0.00"
                value={cashAmount}
                onChange={e => setCashAmount(e.target.value)}
                autoFocus={method === 'efectivo'}
              />
              {method === 'efectivo' && cashNum >= total && cashNum > 0 && (
                <div className="mt-2 flex justify-between items-center bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs">
                  <span className="text-green-700 font-medium">Cambio / Vuelto</span>
                  <span className="text-green-700 font-bold text-sm">${change.toFixed(2)}</span>
                </div>
              )}
              {method === 'efectivo' && cashNum > 0 && cashNum < total && (
                <div className="mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600">
                  Faltan <strong>${(total - cashNum).toFixed(2)}</strong> para completar el pago
                </div>
              )}
            </div>
          )}

          {/* Card amount (mixto only) */}
          {method === 'mixto' && (
            <div>
              <label className="form-label">Monto con tarjeta ($)</label>
              <input
                className="form-input text-base font-semibold"
                type="number" step="0.01" min="0" placeholder="0.00"
                value={cardAmount}
                onChange={e => setCardAmount(e.target.value)}
              />
            </div>
          )}

          {/* Stripe CardElement */}
          {(method === 'tarjeta' || method === 'mixto') && (
            <div>
              <label className="form-label">Datos de la tarjeta</label>
              <div className="border border-slate-200 rounded-lg px-3 py-3 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                <CardElement
                  options={CARD_ELEMENT_OPTIONS}
                  onChange={e => {
                    setCardError(e.error?.message ?? '');
                    setStripeReady(e.complete);
                  }}
                />
              </div>
              {cardError && (
                <p className="mt-1.5 text-xs text-red-500">{cardError}</p>
              )}
              <p className="mt-1.5 text-[10px] text-slate-400">
                🔒 Cifrado SSL · Procesado por Stripe · Tus datos no se almacenan
              </p>
              {/* Test hint */}
              {import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_test') && (
                <p className="mt-1 text-[10px] text-amber-600 bg-amber-50 rounded px-2 py-1">
                  Modo test: usa tarjeta <strong>4242 4242 4242 4242</strong> · cualquier fecha/CVC
                </p>
              )}
            </div>
          )}

          {/* Mixto summary */}
          {method === 'mixto' && (cashNum > 0 || cardNum > 0) && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5 text-xs">
              {cashNum > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Efectivo</span>
                  <span className="font-semibold">${cashNum.toFixed(2)}</span>
                </div>
              )}
              {cardNum > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Tarjeta</span>
                  <span className="font-semibold">${cardNum.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-1.5">
                <span className="font-bold text-slate-700">Cobrado</span>
                <span className={`font-bold ${cashNum + cardNum >= total ? 'text-green-600' : 'text-red-500'}`}>
                  ${(cashNum + cardNum).toFixed(2)}
                </span>
              </div>
              {cashNum + cardNum > total && (
                <div className="flex justify-between text-green-600">
                  <span>Cambio</span>
                  <span className="font-semibold">${(cashNum + cardNum - total).toFixed(2)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button className="btn-secondary flex-1 justify-center" onClick={onCancel} disabled={processing}>
            Cancelar
          </button>
          <button
            className="btn-primary flex-1 justify-center"
            disabled={!canConfirm()}
            onClick={handleConfirm}
          >
            {processing ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Procesando…
              </span>
            ) : '✅ Confirmar Pago'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentModal(props: PaymentModalProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  );
}
