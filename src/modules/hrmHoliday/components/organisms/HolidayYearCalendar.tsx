'use client';

import { useMemo, useState } from 'react';
import { AutoComplete, Button, Checkbox, Modal, Select, Space, Tag, Tooltip, Typography, message } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import Holidays from 'date-holidays';
import { HrmHolidayService } from '../../services/hrmHolidayService';
import { getCustomHolidays, addCustomHoliday } from '../../utils/customHolidayStore';
import { useCan } from '../../../hrmAccess/hooks/useCan';
import type { Holiday, HolidayCategoryConfig } from '../../types/domain.types';
import styles from '../../styles/HolidayYearCalendar.module.css';

const { Text } = Typography;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const CAT_COLOR: Record<string, string> = {
  NATIONAL: '#2f54eb',
  FESTIVAL: '#fa8c16',
  LOCAL: '#13c2c2',
  COMPENSATORY: '#722ed1',
};
const CATEGORY_OPTIONS = [
  { value: 'NATIONAL', label: 'National' },
  { value: 'FESTIVAL', label: 'Festival' },
  { value: 'LOCAL', label: 'Local' },
  { value: 'COMPENSATORY', label: 'Compensatory' },
];

const TYPE_TO_CATEGORY: Record<string, string> = {
  public: 'NATIONAL',
  bank: 'NATIONAL',
  optional: 'FESTIVAL',
  observance: 'LOCAL',
  school: 'LOCAL',
};

/** Holidays that fall on a specific date = library defaults + saved customs. */
function computeDateSuggestions(
  date: string,
  country: string,
  state: string | undefined,
  year: number
): { name: string; category: string; optional: boolean }[] {
  if (!date || !country) return [];
  const md = date.slice(5); // MM-DD
  const out: { name: string; category: string; optional: boolean }[] = [];
  try {
    const hd = new Holidays(country, state || undefined);
    ((hd.getHolidays(year) ?? []) as Array<{ date: string; name: string; type: string }>)
      .filter((h) => String(h.date).slice(0, 10) === date)
      .forEach((h) =>
        out.push({ name: h.name, category: TYPE_TO_CATEGORY[h.type] ?? 'NATIONAL', optional: h.type === 'optional' })
      );
  } catch {
    /* ignore */
  }
  getCustomHolidays(country)
    .filter((e) => e.md === md)
    .forEach((e) => {
      if (!out.some((o) => o.name.toLowerCase() === e.name.toLowerCase())) {
        out.push({ name: e.name, category: e.category, optional: e.optional });
      }
    });
  return out;
}

/**
 * The full year's holidays for a country (library + saved customs), each with
 * its date. Moving festivals (Diwali, Eid, Easter…) are computed per year by
 * date-holidays, so the user can pick the festival by name and get the correct
 * date for that year.
 */
function computeYearSuggestions(
  country: string,
  state: string | undefined,
  year: number
): { name: string; date: string; category: string; optional: boolean }[] {
  if (!country) return [];
  const out: { name: string; date: string; category: string; optional: boolean }[] = [];
  try {
    const hd = new Holidays(country, state || undefined);
    ((hd.getHolidays(year) ?? []) as Array<{ date: string; name: string; type: string }>).forEach((h) =>
      out.push({
        name: h.name,
        date: String(h.date).slice(0, 10),
        category: TYPE_TO_CATEGORY[h.type] ?? 'NATIONAL',
        optional: h.type === 'optional',
      })
    );
  } catch {
    /* ignore */
  }
  getCustomHolidays(country).forEach((e) => {
    const date = `${year}-${e.md}`;
    if (!out.some((o) => o.name.toLowerCase() === e.name.toLowerCase() && o.date === date)) {
      out.push({ name: e.name, date, category: e.category, optional: e.optional });
    }
  });
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

function pad(n: number) {
  return `${n}`.padStart(2, '0');
}
function ymd(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}
/** Cells for a month grid (Sun-first); null = leading blank. */
function monthCells(year: number, month: number): (number | null)[] {
  const startDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array.from({ length: startDay }, () => null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

interface Props {
  year: number;
  holidays: Holiday[];
  categories: HolidayCategoryConfig[];
  organizationId: string;
  groupHandle: string;
  groupStatus: 'DRAFT' | 'PUBLISHED' | 'LOCKED';
  /** Region of the group — drives holiday suggestions (date-holidays). */
  groupCountry?: string;
  groupState?: string;
  canEdit: boolean;
  createdBy: string;
  createdByRole?: string;
  onChanged: () => void;
}

export default function HolidayYearCalendar({
  year,
  holidays,
  categories,
  organizationId,
  groupHandle,
  groupStatus,
  groupCountry,
  groupState,
  canEdit,
  createdBy,
  createdByRole,
  onChanged,
}: Props) {
  // Gate on the real RBAC permissions (same source as the toolbar's <Can>),
  // not just the role-string `canEdit` prop — that prop resolves to false for
  // roles outside the hardcoded manager list, silently disabling the calendar.
  const rbac = useCan();
  const editable = (canEdit || rbac.canAdd) && groupStatus !== 'LOCKED';
  const canDeleteH = (canEdit || rbac.canDelete) && groupStatus !== 'LOCKED';
  const todayStr = dayjs().format('YYYY-MM-DD');

  const byDate = useMemo(() => {
    const m = new Map<string, Holiday[]>();
    holidays.forEach((h) => {
      const d = String(h.date).slice(0, 10);
      const arr = m.get(d) ?? [];
      arr.push(h);
      m.set(d, arr);
    });
    return m;
  }, [holidays]);

  const monthCounts = useMemo(() => {
    const counts = Array(12).fill(0);
    holidays.forEach((h) => {
      const mo = dayjs(String(h.date).slice(0, 10)).month();
      if (mo >= 0 && mo < 12) counts[mo] += 1;
    });
    return counts;
  }, [holidays]);

  const colorFor = (h: Holiday) => h.categoryColorHex || CAT_COLOR[h.category] || '#5b8def';

  const legend = useMemo(() => {
    if (categories?.length) {
      return categories.map((c) => ({ label: c.displayName, color: c.colorHex }));
    }
    return Object.entries(CAT_COLOR).map(([k, color]) => ({ label: k, color }));
  }, [categories]);

  // ── Day editor modal ──────────────────────────────────────────────
  const [dayDate, setDayDate] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('NATIONAL');
  const [optional, setOptional] = useState(false);
  const [saving, setSaving] = useState(false);
  // Suggestions follow the group's region (date-holidays); default to IN.
  const country = groupCountry || 'IN';
  const state = groupState || undefined;
  // Bumped after saving a custom holiday so suggestions re-read the catalog.
  const [customVersion, setCustomVersion] = useState(0);

  // Library default holiday names that fall on the clicked date (for the country).
  const libNamesForDate = useMemo(() => {
    if (!dayDate || !country) return new Set<string>();
    try {
      const hd = new Holidays(country, state || undefined);
      return new Set(
        ((hd.getHolidays(year) ?? []) as Array<{ date: string; name: string }>)
          .filter((h) => String(h.date).slice(0, 10) === dayDate)
          .map((h) => h.name.toLowerCase())
      );
    } catch {
      return new Set<string>();
    }
  }, [dayDate, country, state, year]);

  // Suggestions for the clicked date = library defaults + saved custom entries.
  // customVersion forces a re-read after a save.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // Full-year list so moving festivals (Diwali, Eid…) can be picked by name —
  // selecting one sets the correct date for the year.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const yearSuggestions = useMemo(
    () => computeYearSuggestions(country, state, year),
    [country, year, customVersion]
  );

  const dayHolidays = dayDate ? byDate.get(dayDate) ?? [] : [];

  function openDay(date: string, hasHolidays: boolean) {
    if (!editable && !hasHolidays) return; // nothing to show or do
    setDayDate(date);
    // Pre-fill the form from the date's holiday (library default or saved custom),
    // so the suggestion is driven by the clicked date. Empty when the date has none.
    const sugg = computeDateSuggestions(date, country, state, year);
    if (sugg.length > 0) {
      setName(sugg[0].name);
      setCategory(sugg[0].category);
      setOptional(sugg[0].optional);
    } else {
      setName('');
      setCategory('NATIONAL');
      setOptional(false);
    }
  }

  async function handleAdd() {
    if (!dayDate || !name.trim()) {
      message.warning('Enter a holiday name');
      return;
    }
    setSaving(true);
    try {
      const res = await HrmHolidayService.createHoliday({
        organizationId,
        groupHandle,
        name: name.trim(),
        date: dayDate,
        category,
        optional,
        createdBy,
        createdByRole,
      });
      // HL-BE-4: editing a PUBLISHED group stages the change for approval.
      if (res && (res as { messageCode?: string }).messageCode === 'EDIT_PENDING') {
        message.info((res as { message?: string }).message || 'Change submitted for approval');
        onChanged();
        return;
      }
      if (res && (res as { success?: boolean }).success === false) {
        message.error((res as { message?: string }).message || 'Failed to add holiday');
        return;
      }
      // Not a built-in default for this date → remember it as a custom
      // suggestion for this country so it appears next time.
      if (!libNamesForDate.has(name.trim().toLowerCase())) {
        addCustomHoliday(country, { md: dayDate.slice(5), name: name.trim(), category, optional });
        setCustomVersion((v) => v + 1);
      }
      message.success('Holiday added');
      setName('');
      onChanged();
    } catch {
      message.error('Failed to add holiday');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(h: Holiday) {
    setSaving(true);
    try {
      const res = await HrmHolidayService.deleteHoliday({
        organizationId,
        handle: h.handle,
        deletedBy: createdBy,
        deletedByRole: createdByRole,
      });
      if (res && (res as { messageCode?: string }).messageCode === 'EDIT_PENDING') {
        message.info((res as { message?: string }).message || 'Removal submitted for approval');
        onChanged();
        return;
      }
      if (res && (res as { success?: boolean }).success === false) {
        message.error((res as { message?: string }).message || 'Failed to remove holiday');
        return;
      }
      // Show API response message for success case
      const successMessage = (res as { message?: string })?.message || 'Holiday removed';
      message.success(successMessage);
      onChanged();
    } catch (error: unknown) {
      // Handle 400 bad request errors and show the API response message
      const errorMessage = (error as { message?: string })?.message || 'Failed to remove holiday';
      message.error(errorMessage);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.yearRoot}>
      <div className={styles.legend}>
        {legend.map((l) => (
          <span key={l.label} className={styles.legendItem}>
            <span className={styles.legendSwatch} style={{ background: l.color }} />
            {l.label}
          </span>
        ))}
        {editable && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            · Click any date to add a holiday
          </Text>
        )}
      </div>

      <div className={styles.yearGrid}>
        {MONTHS.map((mName, m) => (
          <div key={mName} className={styles.monthCard}>
            <div className={styles.monthTitle}>
              <span>{mName}</span>
              {monthCounts[m] > 0 && <span className={styles.monthCount}>{monthCounts[m]}</span>}
            </div>
            <div className={styles.dowRow}>
              {DOW.map((d, i) => (
                <div key={i} className={styles.dow}>
                  {d}
                </div>
              ))}
            </div>
            <div className={styles.dayRow}>
              {monthCells(year, m).map((d, i) => {
                if (d === null) return <div key={`b${i}`} className={styles.dayBlank} />;
                const date = ymd(year, m, d);
                const list = byDate.get(date);
                const has = !!list?.length;
                const isToday = date === todayStr;
                const cls = [
                  styles.dayCell,
                  has ? styles.dayHoliday : '',
                  (editable || has) ? styles.dayClickable : '',
                  isToday ? styles.dayToday : '',
                ]
                  .filter(Boolean)
                  .join(' ');
                const cell = (
                  <div
                    key={date}
                    className={cls}
                    style={has ? { background: colorFor(list![0]) } : undefined}
                    onClick={() => openDay(date, has)}
                  >
                    {d}
                    {has && list!.some((h) => h.optional) && <span className={styles.dayOptionalDot} />}
                  </div>
                );
                return has ? (
                  <Tooltip
                    key={date}
                    title={list!.map((h) => `${h.name}${h.optional ? ' (optional)' : ''}`).join(', ')}
                  >
                    {cell}
                  </Tooltip>
                ) : (
                  cell
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={!!dayDate}
        title={dayDate ? dayjs(dayDate).format('dddd, DD MMM YYYY') : ''}
        onCancel={() => setDayDate(null)}
        footer={null}
        destroyOnHidden
        width={460}
      >
        {dayHolidays.length > 0 ? (
          <div style={{ marginBottom: editable ? 16 : 0 }}>
            {dayHolidays.map((h) => (
              <div key={h.handle} className={styles.dayHolidayRow}>
                <Space size={6}>
                  <span className={styles.legendSwatch} style={{ background: colorFor(h) }} />
                  <span className={styles.dayHolidayName}>{h.name}</span>
                  <Tag>{h.categoryDisplayName || h.category}</Tag>
                  {h.optional && <Tag color="gold">optional</Tag>}
                </Space>
                {canDeleteH && (
                  <Button
                    size="small"
                    danger
                    type="text"
                    icon={<DeleteOutlined />}
                    loading={saving}
                    onClick={() => handleDelete(h)}
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          !editable && <Text type="secondary">No holiday on this day.</Text>
        )}

        {editable && (
          <Space.Compact style={{ width: '100%' }} direction="vertical">
            <Text type="secondary" style={{ fontSize: 12, marginBottom: 4 }}>
              Pick a holiday from the list (its date is set automatically — handles moving festivals
              like Diwali), or type a custom name for {dayjs(dayDate ?? undefined).format('DD MMM')}.
            </Text>
            <Space.Compact style={{ width: '100%' }}>
              <AutoComplete
                style={{ flex: 1 }}
                value={name}
                options={yearSuggestions.map((s) => ({
                  value: s.name,
                  label: `${s.name} — ${dayjs(s.date).format('DD MMM')}`,
                  date: s.date,
                  category: s.category,
                  optional: s.optional,
                }))}
                onChange={(v) => setName(v)}
                onSelect={(v: string, opt: { date?: string; category?: string; optional?: boolean }) => {
                  setName(v);
                  if (opt?.category) setCategory(opt.category);
                  setOptional(!!opt?.optional);
                  // Jump the entry to the festival's actual date for this year.
                  if (opt?.date) setDayDate(opt.date);
                }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                filterOption={(input, option: any) =>
                  String(option?.value ?? '').toLowerCase().includes(input.toLowerCase())
                }
                placeholder="Search a holiday (e.g. Diwali) or type a custom name"
              />
              <Select
                style={{ width: 150 }}
                value={category}
                options={CATEGORY_OPTIONS}
                onChange={setCategory}
              />
            </Space.Compact>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
              <Checkbox checked={optional} onChange={(e) => setOptional(e.target.checked)}>
                Optional
              </Checkbox>
              <Button type="primary" icon={<PlusOutlined />} loading={saving} onClick={handleAdd}>
                Add
              </Button>
            </div>
          </Space.Compact>
        )}
      </Modal>
    </div>
  );
}
