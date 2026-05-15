'use client';
import { useEffect, useState } from 'react';
import { Button, Select, Space, Spin, Tooltip, message } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getOrganizationId } from '@/utils/cookieUtils';
import { useHrmProjectStore } from '../../stores/hrmProjectStore';
import { useProjectData } from '../../hooks/useProjectData';
import { HrmOrganizationService } from '@/modules/hrmOrganization/services/hrmOrganizationService';
import type { BusinessUnit, Department } from '@/modules/hrmOrganization/types/domain.types';
import CapacityColorDot from '../atoms/CapacityColorDot';
import type { CapacityStatus } from '../../types/domain.types';
import styles from '../../styles/ResourceCalendar.module.css';

export default function ResourceCalendarView() {
  const { calendarWeekStart, setCalendarWeekStart, calendarBU, setCalendarBU, calendarDept, setCalendarDept, calendarData, loadingCalendar } = useHrmProjectStore();
  const { loadCalendar } = useProjectData();

  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [loadingBUs, setLoadingBUs] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(false);

  useEffect(() => {
    const organizationId = getOrganizationId();
    if (!organizationId) return;
    setLoadingBUs(true);
    HrmOrganizationService.fetchBusinessUnitsBySite(organizationId)
      .then((data) => setBusinessUnits(data ?? []))
      .catch(() => message.error('Failed to load business units'))
      .finally(() => setLoadingBUs(false));
  }, []);

  useEffect(() => {
    const organizationId = getOrganizationId();
    if (!organizationId || !calendarBU) {
      setDepartments([]);
      return;
    }
    const bu = businessUnits.find((b) => b.buCode === calendarBU);
    if (!bu?.handle) {
      setDepartments([]);
      return;
    }
    setLoadingDepts(true);
    HrmOrganizationService.fetchDepartments(organizationId, bu.handle)
      .then((data) => setDepartments(data ?? []))
      .catch(() => message.error('Failed to load departments'))
      .finally(() => setLoadingDepts(false));
  }, [calendarBU, businessUnits]);

  useEffect(() => {
    loadCalendar();
  }, [calendarWeekStart, calendarBU, calendarDept]);

  const weekDates = Array.from({ length: 7 }, (_, i) =>
    dayjs(calendarWeekStart).add(i, 'day').format('YYYY-MM-DD')
  );

  const prevWeek = () => setCalendarWeekStart(dayjs(calendarWeekStart).subtract(7, 'day').format('YYYY-MM-DD'));
  const nextWeek = () => setCalendarWeekStart(dayjs(calendarWeekStart).add(7, 'day').format('YYYY-MM-DD'));

  return (
    <div className={styles.calendarContainer}>
      <Space className={styles.calendarControls} wrap>
        <Button icon={<LeftOutlined />} onClick={prevWeek} />
        <span className={styles.weekLabel}>
          {dayjs(calendarWeekStart).format('DD MMM')} — {dayjs(calendarWeekStart).add(6, 'day').format('DD MMM YYYY')}
        </span>
        <Button icon={<RightOutlined />} onClick={nextWeek} />
        <Select
          placeholder="BU"
          value={calendarBU || undefined}
          onChange={(v) => {
            setCalendarBU(v ?? '');
            setCalendarDept('');
          }}
          allowClear
          showSearch
          loading={loadingBUs}
          style={{ width: 160 }}
          filterOption={(input, option) =>
            String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          options={businessUnits.map((bu) => ({
            value: bu.buCode,
            label: `${bu.buCode} - ${bu.buName}`,
          }))}
        />
        <Select
          placeholder={calendarBU ? 'Department' : 'Select BU first'}
          value={calendarDept || undefined}
          onChange={(v) => setCalendarDept(v ?? '')}
          allowClear
          showSearch
          disabled={!calendarBU}
          loading={loadingDepts}
          style={{ width: 180 }}
          filterOption={(input, option) =>
            String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          options={departments.map((d) => ({
            value: d.deptCode,
            label: `${d.deptCode} - ${d.deptName}`,
          }))}
        />
      </Space>

      {loadingCalendar ? (
        <Spin />
      ) : (
        <div className={styles.grid}>
          <div className={`${styles.gridRow} ${styles.gridHeader}`}>
            <div className={styles.employeeCell}>Employee</div>
            {weekDates.map((d) => (
              <div key={d} className={styles.dayHeaderCell}>
                <div>{dayjs(d).format('ddd')}</div>
                <div>{dayjs(d).format('D')}</div>
              </div>
            ))}
          </div>
          {calendarData.map((emp) => (
            <div key={emp.employeeId} className={styles.gridRow}>
              <div className={styles.employeeCell}>
                <div className={styles.empName}>{emp.employeeName}</div>
                <div className={styles.empDept}>{emp.department}</div>
              </div>
              {weekDates.map((d) => {
                const day = emp.days.find((x) => x.date === d);
                if (!day) return <div key={d} className={styles.dayCellEmpty} />;
                const status: CapacityStatus = day.holiday || day.leave ? 'GREY' : day.capacityStatus;
                const label = day.holiday ? 'HOL' : day.leave ? 'LVE' : `${day.allocatedHours.toFixed(1)}h`;
                return (
                  <Tooltip key={d} title={`${d}: ${label}`}>
                    <div className={styles.dayCell}>
                      <CapacityColorDot status={status} size={8} />
                      <span className={styles.dayCellHours}>{label}</span>
                    </div>
                  </Tooltip>
                );
              })}
            </div>
          ))}
          {calendarData.length === 0 && (
            <div className={styles.emptyCalendar}>No data available</div>
          )}
        </div>
      )}

      <div className={styles.legend}>
        <CapacityColorDot status="GREEN" /> <span>Available</span>
        <CapacityColorDot status="YELLOW" /> <span>90–100%</span>
        <CapacityColorDot status="RED" /> <span>Exceeds</span>
        <CapacityColorDot status="GREY" /> <span>Holiday / Leave</span>
      </div>
    </div>
  );
}
