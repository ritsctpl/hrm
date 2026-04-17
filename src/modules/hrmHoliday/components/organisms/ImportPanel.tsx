'use client';

import { useState } from 'react';
import { Drawer, Button, Upload, Typography, Alert, Divider, Space, message } from 'antd';
import type { UploadFile } from 'antd';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
import ImportPreviewRow from '../molecules/ImportPreviewRow';
import { HrmHolidayService } from '../../services/hrmHolidayService';
import { useHrmHolidayStore } from '../../stores/hrmHolidayStore';
import type { ImportPanelProps } from '../../types/ui.types';
import type { HolidayImportRow } from '../../types/api.types';
import type { ImportError } from '../../types/domain.types';
import Can from '../../../hrmAccess/components/Can';
import styles from '../../styles/HolidayForm.module.css';

export default function ImportPanel({
  open,
  groupHandle,
  groupName,
  onClose,
  onImported,
}: ImportPanelProps) {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [parsedRows, setParsedRows] = useState<HolidayImportRow[]>([]);
  const [validating, setValidating] = useState(false);
  const [committing, setCommitting] = useState(false);
  const { importResult, setImportResult, setImportLoading } = useHrmHolidayStore();

  const cookies = parseCookies();
  const organizationId = getOrganizationId();
  const userId = cookies.userId ?? '';

  const parseFile = async (file: File): Promise<HolidayImportRow[]> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter((l) => l.trim());
        const [, ...dataLines] = lines;
        const rows: HolidayImportRow[] = dataLines.map((line) => {
          const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
          return {
            name: cols[0] ?? '',
            date: cols[1] ?? '',
            category: cols[2] ?? '',
            reason: cols[3],
            isCompensatory: cols[4],
            compWindowStart: cols[5],
            compWindowEnd: cols[6],
            locationScope: cols[7],
            isOptional: cols[8],
          };
        });
        resolve(rows);
      };
      reader.readAsText(file);
    });
  };

  const handleValidate = async () => {
    if (fileList.length === 0 || parsedRows.length === 0) {
      message.warning('Please upload a file first');
      return;
    }
    setValidating(true);
    setImportLoading(true);
    try {
      const res = await HrmHolidayService.importHolidays({ organizationId,
        groupHandle,
        dryRun: true,
        importedBy: userId,
        rows: parsedRows,
      });
      if (res.success) {
        setImportResult({
          ...res.data,
          preview: res.data.preview?.map((h) => ({
            ...h,
            compensatory: h.compensatory ?? false,
            optional: h.optional ?? false,
          })),
        });
      } else {
        message.error(res.message || 'Validation failed');
      }
    } catch {
      message.error('Validation failed');
    } finally {
      setValidating(false);
      setImportLoading(false);
    }
  };

  const handleCommit = async () => {
    setCommitting(true);
    try {
      const res = await HrmHolidayService.importHolidays({ organizationId,
        groupHandle,
        dryRun: false,
        importedBy: userId,
        rows: parsedRows,
      });
      if (res.success && res.data.committed) {
        message.success(`Imported ${res.data.successCount} holidays`);
        onImported();
      } else {
        message.error(res.message || 'Commit failed');
      }
    } catch {
      message.error('Commit failed');
    } finally {
      setCommitting(false);
    }
  };

  const handleFileChange = async (info: { fileList: UploadFile[] }) => {
    setFileList(info.fileList.slice(-1));
    if (info.fileList.length > 0 && info.fileList[0].originFileObj) {
      const rows = await parseFile(info.fileList[0].originFileObj as File);
      setParsedRows(rows);
      setImportResult(null);
    }
  };

  const errorMap = new Map<number, ImportError>();
  importResult?.errors.forEach((e) => errorMap.set(e.rowNumber, e));

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`Import Holidays — ${groupName}`}
      width={600}
      destroyOnHidden
      footer={
        <div className={styles.drawerFooter}>
          <Space>
            <Button onClick={onClose}>Cancel</Button>
            <Can I="add">
              <Button
                type="primary"
                onClick={handleCommit}
                loading={committing}
                disabled={
                  !importResult ||
                  importResult.failureCount > 0 ||
                  !importResult.successCount
                }
              >
                Commit Import
              </Button>
            </Can>
          </Space>
        </div>
      }
    >
      <Typography.Title level={5}>Step 1: Upload File</Typography.Title>
      <Upload.Dragger
        accept=".csv,.xlsx"
        fileList={fileList}
        beforeUpload={() => false}
        onChange={handleFileChange}
        maxCount={1}
      >
        <UploadFileIcon style={{ fontSize: 32, color: '#1890ff' }} />
        <p>Drag and drop CSV / XLSX here or click to browse</p>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Headers: name, date, category, reason, isCompensatory, compWindowStart, compWindowEnd, locationScope, isOptional
        </Typography.Text>
      </Upload.Dragger>

      <Divider />

      <Typography.Title level={5}>Step 2: Validate (Dry Run)</Typography.Title>
      <Button onClick={handleValidate} loading={validating} disabled={parsedRows.length === 0}>
        Run Validation
      </Button>

      {importResult && (
        <div style={{ marginTop: 16 }}>
          <Alert
            type={importResult.failureCount > 0 ? 'warning' : 'success'}
            message={`${importResult.successCount} valid rows · ${importResult.failureCount} errors`}
            showIcon
            style={{ marginBottom: 12 }}
          />
          {importResult.preview?.slice(0, 20).map((h, idx) => (
            <ImportPreviewRow
              key={h.handle ?? idx}
              rowNumber={idx + 1}
              name={h.name}
              date={h.date}
              error={errorMap.get(idx + 1)}
            />
          ))}
        </div>
      )}
    </Drawer>
  );
}
