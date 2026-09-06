import { useMemo, useState, type CSSProperties, type FC } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  CircleGauge,
  Download,
  Gamepad2,
  Search,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { PurchaserGameBillDetail } from '../../../api/paasBilling';
import { Button } from '../../../components/ui/Button';
import './GameBillDetailsTable.css';

interface GameBillDetailsTableProps {
  rows: PurchaserGameBillDetail[];
  isLoading: boolean;
  hasError: boolean;
  granularity: GameBillDetailsGranularity;
  onGranularityChange: (granularity: GameBillDetailsGranularity) => void;
  onExport: () => void | Promise<void>;
  isExporting: boolean;
  exportDisabled: boolean;
  exportError: string | null;
}

export type GameBillDetailsGranularity = 'day' | 'month';

type SortKey =
  | 'game_name'
  | 'add_game_people'
  | 'game_people'
  | 'gold_cost_total'
  | 'coin_settlement'
  | 'accumulated_profit'
  | 'rtp'
  | 'data';

type SortDirection = 'ascending' | 'descending';

interface SortState {
  key: SortKey;
  direction: SortDirection;
}

interface TableRow {
  id: string;
  index: number;
  value: PurchaserGameBillDetail;
}

interface SelectionState {
  rowsSignature: string;
  ids: Set<string>;
}

const GAME_ICON_COLORS = ['#2f6fed', '#2eae9a', '#12b76a', '#f79009', '#e5484d', '#0ea5e9'];

const getGameIconColor = (name: string) => {
  const hash = Array.from(name).reduce((total, character) => total + character.codePointAt(0)!, 0);
  return GAME_ICON_COLORS[hash % GAME_ICON_COLORS.length];
};

const getNumericValue = (value: number | string) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

export const GameBillDetailsTable: FC<GameBillDetailsTableProps> = ({
  rows,
  isLoading,
  hasError,
  granularity,
  onGranularityChange,
  onExport,
  isExporting,
  exportDisabled,
  exportError,
}) => {
  const t = useTranslations('Dashboard');
  const locale = useLocale();
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState<SortState | null>(null);

  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
    [locale],
  );
  const collator = useMemo(
    () => new Intl.Collator(locale, { numeric: true, sensitivity: 'base' }),
    [locale],
  );
  const indexedRows = useMemo<TableRow[]>(
    () => rows.map((value, index) => ({
      id: `${value.game_name}\u0000${value.data}\u0000${index}`,
      index,
      value,
    })),
    [rows],
  );
  const currentRowIds = useMemo(() => new Set(indexedRows.map((row) => row.id)), [indexedRows]);
  const rowsSignature = useMemo(() => indexedRows.map((row) => row.id).join('\u0001'), [indexedRows]);
  const [selection, setSelection] = useState<SelectionState>(() => ({ rowsSignature, ids: new Set() }));
  const selectedIds = useMemo(
    () => selection.rowsSignature === rowsSignature
      ? new Set(Array.from(selection.ids).filter((id) => currentRowIds.has(id)))
      : new Set<string>(),
    [currentRowIds, rowsSignature, selection],
  );

  const visibleRows = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLocaleLowerCase(locale);
    const filteredRows = normalizedSearch
      ? indexedRows.filter(({ value }) => value.game_name.toLocaleLowerCase(locale).includes(normalizedSearch))
      : indexedRows;

    if (!sort) return filteredRows;

    return [...filteredRows].sort((left, right) => {
      const leftValue = left.value[sort.key];
      const rightValue = right.value[sort.key];
      const comparison = sort.key === 'game_name' || sort.key === 'data'
        ? collator.compare(String(leftValue), String(rightValue))
        : getNumericValue(leftValue) - getNumericValue(rightValue);
      const stableComparison = comparison || left.index - right.index;
      return sort.direction === 'ascending' ? stableComparison : -stableComparison;
    });
  }, [collator, indexedRows, locale, searchQuery, sort]);

  const columns: Array<{ key: SortKey; label: string; align?: 'right' }> = [
    { key: 'game_name', label: t('gameName') },
    { key: 'add_game_people', label: t('addedPlayers'), align: 'right' },
    { key: 'game_people', label: t('gamePlayers'), align: 'right' },
    { key: 'gold_cost_total', label: t('goldCost'), align: 'right' },
    { key: 'coin_settlement', label: t('coinSettlement'), align: 'right' },
    { key: 'accumulated_profit', label: t('accumulatedProfitColumn'), align: 'right' },
    { key: 'rtp', label: t('rtp'), align: 'right' },
    { key: 'data', label: t('date'), align: 'right' },
  ];

  const handleSort = (key: SortKey) => {
    setSort((previous) => (
      previous?.key === key
        ? { key, direction: previous.direction === 'ascending' ? 'descending' : 'ascending' }
        : { key, direction: 'ascending' }
    ));
  };

  const toggleRow = (id: string) => {
    setSelection(() => {
      const next = new Set(selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { rowsSignature, ids: next };
    });
  };

  const renderSortIcon = (key: SortKey) => {
    if (sort?.key !== key) return <ChevronsUpDown aria-hidden="true" />;
    return sort.direction === 'ascending'
      ? <ChevronUp aria-hidden="true" />
      : <ChevronDown aria-hidden="true" />;
  };

  const emptyMessage = hasError
    ? t('gameBillDetailsUnavailable')
    : searchQuery.trim()
      ? t('noMatchingGames')
      : t('noGameBillDetails');

  return (
    <section className="game-bill-details" aria-labelledby="game-bill-details-title">
      <header className="game-bill-details__toolbar">
        <div className="game-bill-details__title">
          <CircleGauge aria-hidden="true" />
          <h2 id="game-bill-details-title">{t('gameBillDetails')}</h2>
        </div>
        <div className="game-bill-details__controls">
          <div className="game-bill-details__granularity" role="group" aria-label={t('gameBillGranularity')}>
            <button
              type="button"
              className={granularity === 'day' ? 'is-active' : undefined}
              aria-pressed={granularity === 'day'}
              onClick={() => onGranularityChange('day')}
            >
              {t('queryByDay')}
            </button>
            <button
              type="button"
              className={granularity === 'month' ? 'is-active' : undefined}
              aria-pressed={granularity === 'month'}
              onClick={() => onGranularityChange('month')}
            >
              {t('queryByMonth')}
            </button>
          </div>
          <label className="game-bill-details__search">
            <Search aria-hidden="true" />
            <span className="sr-only">{t('gameBillSearchPlaceholder')}</span>
            <input
              type="search"
              value={searchQuery}
              placeholder={t('gameBillSearchPlaceholder')}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>
          <Button
            type="button"
            variant="secondary"
            size="medium"
            className="game-bill-details__export"
            disabled={exportDisabled}
            loading={isExporting}
            aria-busy={isExporting}
            aria-label={isExporting ? t('exportingGameBillDetails') : t('exportGameBillDetails')}
            onClick={() => void onExport()}
          >
            <Download aria-hidden="true" />
            <span>{t('exportGameBillDetails')}</span>
          </Button>
        </div>
      </header>
      {exportError && <p className="game-bill-details__export-error" role="alert">{exportError}</p>}

      <div className="game-bill-details__table-viewport">
        <table className="game-bill-details__table" aria-busy={isLoading}>
          <thead>
            <tr>
              <th className="game-bill-details__selection-heading" scope="col">#</th>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={sort?.key === column.key ? sort.direction : 'none'}
                  className={column.align === 'right' ? 'is-numeric' : undefined}
                >
                  <button
                    type="button"
                    aria-label={t('sortGameBillBy', { column: column.label })}
                    onClick={() => handleSort(column.key)}
                  >
                    <span>{column.label}</span>
                    {renderSortIcon(column.key)}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? Array.from({ length: 3 }, (_, index) => (
              <tr className="game-bill-details__skeleton-row" key={`skeleton-${index}`}>
                <td><span className="game-bill-details__skeleton-circle" /></td>
                <td><span className="game-bill-details__skeleton game-bill-details__skeleton--game" /></td>
                {Array.from({ length: 7 }, (__, cellIndex) => (
                  <td key={`skeleton-${index}-${cellIndex}`}><span className="game-bill-details__skeleton" /></td>
                ))}
              </tr>
            )) : visibleRows.length === 0 ? (
              <tr>
                <td className="game-bill-details__empty" colSpan={9} role="status">{emptyMessage}</td>
              </tr>
            ) : visibleRows.map(({ id, value }) => {
              const selected = selectedIds.has(id);
              const iconStyle = { '--game-icon-color': getGameIconColor(value.game_name) } as CSSProperties;

              return (
                <tr className={selected ? 'is-selected' : undefined} key={id}>
                  <td>
                    <input
                      className="game-bill-details__checkbox"
                      type="checkbox"
                      checked={selected}
                      aria-label={t('selectGameBillRow', { game: value.game_name })}
                      onChange={() => toggleRow(id)}
                    />
                  </td>
                  <td>
                    <span className="game-bill-details__game">
                      <span className="game-bill-details__game-icon" style={iconStyle}>
                        <Gamepad2 aria-hidden="true" />
                      </span>
                      <span title={value.game_name}>{value.game_name}</span>
                    </span>
                  </td>
                  <td className="is-numeric">{numberFormatter.format(value.add_game_people)}</td>
                  <td className="is-numeric">{numberFormatter.format(value.game_people)}</td>
                  <td className="is-numeric">{numberFormatter.format(value.gold_cost_total)}</td>
                  <td className="is-numeric">{numberFormatter.format(value.coin_settlement)}</td>
                  <td className={`is-numeric ${value.accumulated_profit < 0 ? 'is-negative' : ''}`}>
                    {numberFormatter.format(value.accumulated_profit)}
                  </td>
                  <td className="is-numeric">{getNumericValue(value.rtp).toLocaleString(locale, { maximumFractionDigits: 2 })}%</td>
                  <td className="is-numeric">{value.data}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};
