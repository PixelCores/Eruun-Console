import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from '@floating-ui/react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useId, useMemo, useState, type FC, type KeyboardEvent } from 'react';

interface CompactDatePickerProps {
  label: string;
  value: string;
  min?: string;
  max?: string;
  locale: string;
  todayLabel: string;
  previousMonthLabel: string;
  nextMonthLabel: string;
  onChange: (value: string) => void;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

const parseIsoDate = (value: string) => {
  const match = ISO_DATE.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.getFullYear() === Number(match[1])
    && date.getMonth() === Number(match[2]) - 1
    && date.getDate() === Number(match[3])
    ? date
    : null;
};

const toIsoDate = (date: Date) => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, '0'),
  String(date.getDate()).padStart(2, '0'),
].join('-');

const addDays = (date: Date, amount: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

const addMonths = (date: Date, amount: number) => {
  const next = new Date(date.getFullYear(), date.getMonth() + amount, 1);
  return next;
};

const formatInputDate = (value: string, locale: string) => {
  const date = parseIsoDate(value);
  if (!date) return value;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return locale.startsWith('zh') ? `${year}/${month}/${day}` : `${month}/${day}/${year}`;
};

const parseInputDate = (value: string, locale: string) => {
  const parts = value.trim().split(/[/-]/);
  if (parts.length !== 3 || parts.some((part) => !/^\d+$/.test(part))) return null;
  const [year, month, day] = locale.startsWith('zh')
    ? parts.map(Number)
    : [Number(parts[2]), Number(parts[0]), Number(parts[1])];
  return parseIsoDate(`${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
};

export const CompactDatePicker: FC<CompactDatePickerProps> = ({
  label,
  value,
  min,
  max,
  locale,
  todayLabel,
  previousMonthLabel,
  nextMonthLabel,
  onChange,
}) => {
  const selectedDate = parseIsoDate(value) ?? new Date();
  const calendarId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [inputDraft, setInputDraft] = useState<string | null>(null);
  const inputValue = inputDraft ?? formatInputDate(value, locale);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  const { refs: { setReference, setFloating }, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'bottom-start',
    whileElementsMounted: autoUpdate,
    middleware: [offset(6), flip({ padding: 8 }), shift({ padding: 8 })],
  });
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'dialog' });
  const { getFloatingProps } = useInteractions([dismiss, role]);

  const weekdays = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    const sunday = new Date(2024, 0, 7);
    return Array.from({ length: 7 }, (_, index) => formatter.format(addDays(sunday, index)));
  }, [locale]);
  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' }).format(visibleMonth),
    [locale, visibleMonth],
  );
  const calendarDays = useMemo(() => {
    const gridStart = addDays(visibleMonth, -visibleMonth.getDay());
    return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
  }, [visibleMonth]);
  const today = toIsoDate(new Date());

  const isDisabled = (date: string) => Boolean((min && date < min) || (max && date > max));
  const selectDate = (date: Date) => {
    const nextValue = toIsoDate(date);
    if (isDisabled(nextValue)) return;
    onChange(nextValue);
    setIsOpen(false);
  };
  const focusDate = (date: Date) => {
    setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    requestAnimationFrame(() => {
      document.getElementById(calendarId)?.querySelector<HTMLButtonElement>(`[data-date="${toIsoDate(date)}"]`)?.focus();
    });
  };
  const handleDayKeyDown = (event: KeyboardEvent<HTMLButtonElement>, date: Date) => {
    let next: Date | null = null;
    if (event.key === 'ArrowLeft') next = addDays(date, -1);
    if (event.key === 'ArrowRight') next = addDays(date, 1);
    if (event.key === 'ArrowUp') next = addDays(date, -7);
    if (event.key === 'ArrowDown') next = addDays(date, 7);
    if (event.key === 'PageUp') next = addMonths(date, -1);
    if (event.key === 'PageDown') next = addMonths(date, 1);
    if (!next) return;
    event.preventDefault();
    focusDate(next);
  };

  return (
    <label className="compact-dashboard-date-filter" ref={setReference}>
      <span>{label}</span>
      <input
        type="text"
        inputMode="numeric"
        aria-label={label}
        value={inputValue}
        onFocus={() => {
          setIsOpen(true);
          setVisibleMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
        }}
        onChange={(event) => {
          const text = event.target.value;
          setInputDraft(text);
          const parsed = parseInputDate(text, locale);
          if (parsed && !isDisabled(toIsoDate(parsed))) onChange(toIsoDate(parsed));
        }}
        onBlur={() => setInputDraft(null)}
      />
      <button
        type="button"
        className="compact-date-picker__trigger"
        aria-label={label}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <CalendarDays aria-hidden="true" />
      </button>
      {isOpen && (
        <FloatingPortal>
          <div
            id={calendarId}
            ref={setFloating}
            style={floatingStyles}
            className="compact-date-picker"
            aria-label={label}
            {...getFloatingProps()}
          >
            <input
              className="compact-date-picker__input"
              value={inputValue}
              inputMode="numeric"
              aria-label={label}
              onChange={(event) => {
                const text = event.target.value;
                setInputDraft(text);
                const parsed = parseInputDate(text, locale);
                if (parsed && !isDisabled(toIsoDate(parsed))) {
                  onChange(toIsoDate(parsed));
                  setVisibleMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
                }
              }}
              onBlur={() => setInputDraft(null)}
            />
            <div className="compact-date-picker__nav">
              <strong>{monthLabel}</strong>
              <button type="button" className="compact-date-picker__today" onClick={() => selectDate(new Date())} disabled={isDisabled(today)}>
                {todayLabel}
              </button>
              <button type="button" aria-label={previousMonthLabel} onClick={() => setVisibleMonth((month) => addMonths(month, -1))}>
                <ChevronLeft aria-hidden="true" />
              </button>
              <button type="button" aria-label={nextMonthLabel} onClick={() => setVisibleMonth((month) => addMonths(month, 1))}>
                <ChevronRight aria-hidden="true" />
              </button>
            </div>
            <div className="compact-date-picker__weekdays" aria-hidden="true">
              {weekdays.map((weekday, index) => <span key={`${weekday}-${index}`}>{weekday}</span>)}
            </div>
            <div className="compact-date-picker__grid">
              {calendarDays.map((date) => {
                const dateValue = toIsoDate(date);
                const outside = date.getMonth() !== visibleMonth.getMonth();
                return (
                  <button
                    key={dateValue}
                    type="button"
                    data-date={dateValue}
                    disabled={isDisabled(dateValue)}
                    className={[
                      outside ? 'is-outside' : '',
                      dateValue === today ? 'is-today' : '',
                      dateValue === value ? 'is-selected' : '',
                    ].filter(Boolean).join(' ')}
                    aria-label={new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(date)}
                    aria-current={dateValue === today ? 'date' : undefined}
                    aria-pressed={dateValue === value}
                    onClick={() => selectDate(date)}
                    onKeyDown={(event) => handleDayKeyDown(event, date)}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        </FloatingPortal>
      )}
    </label>
  );
};
