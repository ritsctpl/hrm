'use client';

import { useMemo, useState } from 'react';
import { Button, Checkbox, Input, Modal, Select, Space, Tag, Tooltip, Typography, message } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { HrmHolidayService } from '../../services/hrmHolidayService';
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
  canEdit,
  createdBy,
  createdByRole,
  onChanged,
}: Props) {
  const editable = canEdit && groupStatus !== 'LOCKED';
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

  const dayHolidays = dayDate ? byDate.get(dayDate) ?? [] : [];

  function openDay(date: string, hasHolidays: boolean) {
    if (!editable && !hasHolidays) return; // nothing to show or do
    setDayDate(date);
    setName('');
    setCategory('NATIONAL');
    setOptional(false);
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
      if (res && (res as { success?: boolean }).success === false) {
        message.error((res as { message?: string }).message || 'Failed to add holiday');
        return;
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
      await HrmHolidayService.deleteHoliday({
        organizationId,
        handle: h.handle,
        deletedBy: createdBy,
        deletedByRole: createdByRole,
      });
      message.success('Holiday removed');
      onChanged();
    } catch {
      message.error('Failed to remove holiday');
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
                {editable && (
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
              Add holiday
            </Text>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="Holiday name"
                value={name}
                maxLength={120}
                onChange={(e) => setName(e.target.value)}
                onPressEnter={handleAdd}
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
