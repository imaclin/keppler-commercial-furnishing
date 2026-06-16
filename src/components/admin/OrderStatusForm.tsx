'use client';

import { useState } from 'react';
import { advanceOrderAction, setEstDeliveryAction } from '@/app/actions/orders';
import type { OrderStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in_production', label: 'In Production' },
  { value: 'shipping', label: 'Shipping' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

interface Props {
  orderId: string;
  currentStatus: OrderStatus;
  estDelivery?: string | null;
}

export function OrderStatusForm({ orderId, currentStatus, estDelivery }: Props) {
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [deliveryDate, setDeliveryDate] = useState(estDelivery ?? '');
  const [dateBusy, setDateBusy] = useState(false);
  const [dateSaved, setDateSaved] = useState(false);

  async function handleStatusSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setBusy(true);
    const result = await advanceOrderAction(orderId, status, note);
    setBusy(false);
    if ('error' in result) {
      setError(result.error);
    } else {
      setSaved(true);
      setNote('');
    }
  }

  async function handleDateSave(e: React.FormEvent) {
    e.preventDefault();
    setDateSaved(false);
    setDateBusy(true);
    await setEstDeliveryAction(orderId, deliveryDate);
    setDateBusy(false);
    setDateSaved(true);
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleStatusSave} className="space-y-4">
        <div className="text-[8px] uppercase tracking-[0.4em] text-[var(--stone)]">Update Status</div>
        <div className="grid grid-cols-2 gap-5">
          <div>
            <Label htmlFor="order-status" className="text-[10px] uppercase tracking-[0.1em] text-[var(--stone)]">Status</Label>
            <select
              id="order-status"
              value={status}
              onChange={(e) => { setStatus(e.target.value as OrderStatus); setSaved(false); }}
              disabled={busy}
              className="mt-1 block w-full border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm text-[var(--ink)] focus:border-[var(--walnut)] focus:outline-none"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="order-note" className="text-[10px] uppercase tracking-[0.1em] text-[var(--stone)]">Note (optional)</Label>
            <Input
              id="order-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={busy}
              placeholder="e.g. Shipment dispatched via FedEx"
              className="mt-1"
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && !error && <p className="text-sm text-[var(--walnut)]">Status updated.</p>}
        <Button type="submit" disabled={busy} className="bg-[var(--espresso)] text-[#fffdfa] hover:bg-[var(--walnut)]">
          {busy ? 'Saving...' : 'Save Status'}
        </Button>
      </form>

      <form onSubmit={handleDateSave} className="space-y-4">
        <div className="text-[8px] uppercase tracking-[0.4em] text-[var(--stone)]">Estimated Delivery</div>
        <div className="flex items-end gap-4">
          <div>
            <Label htmlFor="est-delivery" className="text-[10px] uppercase tracking-[0.1em] text-[var(--stone)]">Est. Delivery Date</Label>
            <Input
              id="est-delivery"
              type="date"
              value={deliveryDate}
              onChange={(e) => { setDeliveryDate(e.target.value); setDateSaved(false); }}
              disabled={dateBusy}
              className="mt-1"
            />
          </div>
          <Button type="submit" disabled={dateBusy} className="bg-[var(--espresso)] text-[#fffdfa] hover:bg-[var(--walnut)]">
            {dateBusy ? 'Saving...' : 'Set Date'}
          </Button>
        </div>
        {dateSaved && <p className="text-sm text-[var(--walnut)]">Delivery date updated.</p>}
      </form>
    </div>
  );
}
