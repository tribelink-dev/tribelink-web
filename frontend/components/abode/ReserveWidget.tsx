'use client';

import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { Users, Minus, Plus } from 'lucide-react';
import { useCurrency } from '@/lib/CurrencyContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import 'react-day-picker/dist/style.css';

interface ReserveWidgetProps {
  pricePerNight: number;
  currency: string;
  nights: number;
  totalPrice: number;
  guests: number;
  maxGuests: number;
  checkIn: Date | undefined;
  checkOut: Date | undefined;
  unavailableDates?: Date[];
  onCheckInChange: (date: Date | undefined) => void;
  onCheckOutChange: (date: Date | undefined) => void;
  onGuestsChange: (guests: number) => void;
  onReserve: () => void;
  loading?: boolean;
  error?: string;
  showFromPrefix?: boolean;
  experienceTotal?: number;
}

export default function ReserveWidget({
  pricePerNight,
  currency,
  nights,
  totalPrice,
  guests,
  maxGuests,
  checkIn,
  checkOut,
  unavailableDates = [],
  onCheckInChange,
  onCheckOutChange,
  onGuestsChange,
  onReserve,
  loading,
  error,
  showFromPrefix,
  experienceTotal = 0,
}: ReserveWidgetProps) {
  const { formatPrice } = useCurrency();
  const [showCalendar, setShowCalendar] = useState<'checkin' | 'checkout' | null>(null);

  const disabledDays = unavailableDates;

  return (
    <Card className="sticky top-24 shadow-card">
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-1">
          {showFromPrefix && <span className="text-sm text-text-secondary">from</span>}
          <span className="text-2xl font-semibold text-text-primary">
            {formatPrice(pricePerNight, currency)}
          </span>
          <span className="text-sm text-text-secondary">night</span>
        </div>

        <div className="border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-2 border-b border-border">
            <button
              type="button"
              onClick={() => setShowCalendar(showCalendar === 'checkin' ? null : 'checkin')}
              className="p-3 text-left border-r border-border hover:bg-surface-muted"
            >
              <p className="text-[10px] font-semibold uppercase text-text-primary">Check-in</p>
              <p className="text-sm text-text-secondary">
                {checkIn ? checkIn.toLocaleDateString() : 'Add date'}
              </p>
            </button>
            <button
              type="button"
              onClick={() => setShowCalendar(showCalendar === 'checkout' ? null : 'checkout')}
              className="p-3 text-left hover:bg-surface-muted"
            >
              <p className="text-[10px] font-semibold uppercase text-text-primary">Check-out</p>
              <p className="text-sm text-text-secondary">
                {checkOut ? checkOut.toLocaleDateString() : 'Add date'}
              </p>
            </button>
          </div>
          <div className="p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase text-text-primary">Guests</p>
              <p className="text-sm text-text-secondary flex items-center gap-1">
                <Users className="w-3 h-3" />
                {guests} guest{guests !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onGuestsChange(Math.max(1, guests - 1))}
                className="w-8 h-8 rounded-full border border-border flex items-center justify-center"
                disabled={guests <= 1}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-6 text-center text-sm">{guests}</span>
              <button
                type="button"
                onClick={() => onGuestsChange(Math.min(maxGuests, guests + 1))}
                className="w-8 h-8 rounded-full border border-border flex items-center justify-center"
                disabled={guests >= maxGuests}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {showCalendar && (
          <div className="border border-border rounded-xl p-3">
            <DayPicker
              mode="single"
              selected={showCalendar === 'checkin' ? checkIn : checkOut}
              onSelect={(date) => {
                if (showCalendar === 'checkin') onCheckInChange(date);
                else onCheckOutChange(date);
                setShowCalendar(null);
              }}
              disabled={disabledDays}
              className="rdp-amber"
            />
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <Button className="w-full" onClick={onReserve} disabled={loading}>
          {loading ? 'Reserving...' : 'Reserve'}
        </Button>

        {nights > 0 && (
          <div className="space-y-2 text-sm border-t border-border pt-4">
            <div className="flex justify-between text-text-secondary">
              <span>
                {formatPrice(pricePerNight, currency)} × {nights} night{nights !== 1 ? 's' : ''}
              </span>
              <span>{formatPrice(pricePerNight * nights, currency)}</span>
            </div>
            {experienceTotal > 0 && (
              <div className="flex justify-between text-text-secondary">
                <span>Experiences</span>
                <span>{formatPrice(experienceTotal, currency)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-text-primary pt-2 border-t border-border">
              <span>Total</span>
              <span>{formatPrice(totalPrice, currency)}</span>
            </div>
          </div>
        )}

        <p className="text-xs text-center text-text-secondary">You won&apos;t be charged yet</p>
      </CardContent>
    </Card>
  );
}
