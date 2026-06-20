'use client';

import { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { Users, Minus, Plus } from 'lucide-react';
import { useCurrency } from '@/lib/CurrencyContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
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
  roomName?: string;
  className?: string;
  compact?: boolean;
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
  roomName,
  className,
  compact = false,
}: ReserveWidgetProps) {
  const { formatPrice } = useCurrency();
  const [showCalendar, setShowCalendar] = useState(false);
  const [showGuests, setShowGuests] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const calendarMonths = compact || isMobile ? 1 : 2;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isDateUnavailable = (date: Date) => {
    if (date < today) return true;
    return unavailableDates.some(
      (d) =>
        d.getFullYear() === date.getFullYear() &&
        d.getMonth() === date.getMonth() &&
        d.getDate() === date.getDate()
    );
  };

  const formatDateLabel = (date: Date | undefined) =>
    date ? format(date, 'MMM d') : 'Add date';

  const hasDates = checkIn && checkOut;

  return (
    <Card className={cn(!compact && 'lg:sticky lg:top-24 shadow-card', compact && 'border-0 shadow-none', className)}>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-baseline gap-1 flex-wrap">
            {showFromPrefix && <span className="text-sm text-text-secondary">From</span>}
            <span className="text-2xl font-semibold text-text-primary">
              {formatPrice(pricePerNight, currency)}
            </span>
            <span className="text-sm text-text-secondary">night</span>
          </div>
          {roomName && (
            <p className="text-sm text-text-secondary mt-1 truncate">
              {roomName} · up to {maxGuests} guest{maxGuests !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Unified booking box */}
        <div className="border border-border rounded-xl overflow-hidden shadow-soft">
          <button
            type="button"
            onClick={() => {
              setShowCalendar((v) => !v);
              setShowGuests(false);
            }}
            className="w-full grid grid-cols-2 text-left hover:bg-surface-muted/60 transition-colors touch-target"
          >
            <div className="p-3 border-r border-border">
              <p className="text-[10px] font-bold uppercase tracking-wide text-text-primary">Check-in</p>
              <p className={cn('text-sm mt-0.5', checkIn ? 'text-text-primary font-medium' : 'text-text-secondary')}>
                {formatDateLabel(checkIn)}
              </p>
            </div>
            <div className="p-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-text-primary">Check-out</p>
              <p className={cn('text-sm mt-0.5', checkOut ? 'text-text-primary font-medium' : 'text-text-secondary')}>
                {formatDateLabel(checkOut)}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowGuests((v) => !v);
              setShowCalendar(false);
            }}
            className="w-full p-3 border-t border-border text-left hover:bg-surface-muted/60 transition-colors flex items-center justify-between touch-target"
          >
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-text-primary">Guests</p>
              <p className="text-sm text-text-primary font-medium mt-0.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-text-secondary" />
                {guests} guest{guests !== 1 ? 's' : ''}
              </p>
            </div>
            <span className="text-text-secondary text-lg leading-none">›</span>
          </button>
        </div>

        {showCalendar && (
          <div className="border border-border rounded-xl p-3 bg-surface">
            <p className="text-sm font-medium text-text-primary mb-3">Select your dates</p>
            <div className="[&_.rdp]:m-0 [&_.rdp-month]:m-0 [&_.rdp-table]:w-full [&_.rdp-day_selected]:!bg-brand [&_.rdp-day_selected]:!text-white [&_.rdp-day_range_start]:!bg-brand [&_.rdp-day_range_end]:!bg-brand [&_.rdp-day_range_middle]:!bg-brand/15 [&_.rdp-day]:rounded-lg">
              <DayPicker
                mode="range"
                selected={{ from: checkIn, to: checkOut }}
                onSelect={(range) => {
                  onCheckInChange(range?.from);
                  onCheckOutChange(range?.to);
                  if (range?.from && range?.to) setShowCalendar(false);
                }}
                disabled={isDateUnavailable}
                numberOfMonths={calendarMonths}
                className="rdp-amber"
              />
            </div>
            {(checkIn || checkOut) && (
              <button
                type="button"
                onClick={() => {
                  onCheckInChange(undefined);
                  onCheckOutChange(undefined);
                }}
                className="mt-3 text-sm font-medium text-text-secondary hover:text-text-primary underline"
              >
                Clear dates
              </button>
            )}
          </div>
        )}

        {showGuests && (
          <div className="border border-border rounded-xl p-4 bg-surface space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-text-primary">Guests</p>
                <p className="text-xs text-text-secondary">Maximum {maxGuests}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onGuestsChange(Math.max(1, guests - 1))}
                  className="touch-target w-10 h-10 sm:w-8 sm:h-8 rounded-full border border-border flex items-center justify-center disabled:opacity-40"
                  disabled={guests <= 1}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center text-sm font-medium">{guests}</span>
                <button
                  type="button"
                  onClick={() => onGuestsChange(Math.min(maxGuests, guests + 1))}
                  className="touch-target w-10 h-10 sm:w-8 sm:h-8 rounded-full border border-border flex items-center justify-center disabled:opacity-40"
                  disabled={guests >= maxGuests}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <Button variant="secondary" className="w-full" onClick={() => setShowGuests(false)}>
              Done
            </Button>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <Button className="w-full" size="lg" onClick={onReserve} disabled={loading}>
          {loading ? 'Reserving...' : hasDates ? 'Reserve' : 'Check availability'}
        </Button>

        {nights > 0 && (
          <div className="space-y-2 text-sm border-t border-border pt-4">
            <div className="flex justify-between text-text-secondary">
              <span className="underline decoration-dotted underline-offset-2">
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
              <span>Total before taxes</span>
              <span>{formatPrice(totalPrice, currency)}</span>
            </div>
          </div>
        )}

        <p className="text-xs text-center text-text-secondary">You won&apos;t be charged yet</p>
      </CardContent>
    </Card>
  );
}
