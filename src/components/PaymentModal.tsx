import { useState } from 'react';
import type { ServiceOrder } from '../store';

type PaymentMethod = 'efectivo' | 'tarjeta' | 'mixto';

interface PaymentModalProps {
  os: string;
  total: number;
  onConfirm: (payment: ServiceOrder['payment']) => void;
  onCancel: () => void;
}

export default function PaymentModal({ os, total, onConfirm, onCancel }: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>('efectivo');
  const [cashAmount, setCashAmount] = useState('');
  const [cardAmount, setCardAmount] = useState('');
  const [cardLast4, setCardLast4] = useState('');

  const cashNum = parseFloat(cashAmount) || 0;
  const cardNum = parseFloat(cardAmount) || 0;
  const change =
    method === 'efectivo' ? cashNum - total :
    method === 'mixto' ? cashNum - (total - cardNum) : 0;

  const canConfirm = () => {
    if (method === 'efectivo') return cashNum >= total;
    if (method === 'tarjeta') return true;
    if (method === 'mixto') return cashNum + cardNum >= total;
    return false;
  };

  const handleConfirm = () => {
    const now = new Date().toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' });
    const last4 = cardLast4.replace(/\D/g, '').slice(-4);

    if (method === 'efectivo') {
      onConfirm({ method: 'efectivo', cash: cashNum, paidAt: now });
      return;
    }

    onConfirm({
      method,
      cash: method === 'mixto' ? cashNum : undefined,
      card: method === 'mixto' ? cardNum : total,
      cardLast4: last4 || undefined,
      cardBrand: last4 ? 'Tarjeta' : undefined,
      paidAt: now,
    });
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
          <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            El cobro se registra en la orden. No se procesa un cargo bancario real.
          </p>

          <div>
            <label className="form-label mb-2">Método de pago</label>
            <div className="flex gap-2">
              {methodBtn('efectivo', '💵', 'Efectivo')}
              {methodBtn('tarjeta', '💳', 'Tarjeta')}
              {methodBtn('mixto', '🔀', 'Mixto')}
            </div>
          </div>

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

          {(method === 'tarjeta' || method === 'mixto') && (
            <div>
              <label className="form-label">Últimos 4 dígitos (opcional)</label>
              <input
                className="form-input"
                maxLength={4}
                placeholder="4242"
                value={cardLast4}
                onChange={e => setCardLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
              />
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button className="btn-secondary flex-1 justify-center" onClick={onCancel}>Cancelar</button>
            <button
              className="btn-primary flex-1 justify-center"
              disabled={!canConfirm()}
              style={{ opacity: canConfirm() ? 1 : 0.5 }}
              onClick={handleConfirm}
            >
              Confirmar cobro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
