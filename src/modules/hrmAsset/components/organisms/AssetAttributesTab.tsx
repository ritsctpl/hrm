'use client';

import { useMemo, useState } from 'react';
import {
  Descriptions, Button, Empty, Form, Input, InputNumber, DatePicker, Switch, Space, message,
} from 'antd';
import EditIcon from '@mui/icons-material/Edit';
import dayjs from 'dayjs';
import { getOrganizationId } from '@/utils/cookieUtils';
import WarrantyReminderBanner from '../molecules/WarrantyReminderBanner';
import { HrmAssetService } from '../../services/hrmAssetService';
import { useHrmAssetStore } from '../../stores/hrmAssetStore';
import { useEmployeeIdentity } from '../../../hrmAccess/hooks/useEmployeeIdentity';
import { formatDate, isWarrantyExpiringSoon } from '../../utils/assetHelpers';
import type { Asset, AssetCategory, AttributeSchema } from '../../types/domain.types';
import Can from '../../../hrmAccess/components/Can';
import styles from '../../styles/AssetDetail.module.css';

interface AssetAttributesTabProps {
  asset: Asset;
  category?: AssetCategory;
  canEdit: boolean;
}

export default function AssetAttributesTab({ asset, category, canEdit }: AssetAttributesTabProps) {
  const { categories, updateAssetInList } = useHrmAssetStore();
  const identity = useEmployeeIdentity();
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Resolve the category (and therefore the attribute schema) from the store
  // when it isn't passed in — the detail screen renders this tab with just the
  // asset.
  const resolvedCategory = category ?? categories.find((c) => c.categoryCode === asset.categoryCode);

  // Fields to render come from the category's attributeSchema (the source of
  // truth for dataType + required). When no schema is configured, fall back to
  // whatever attributes the asset already carries (treated as free text).
  const fields: AttributeSchema[] = useMemo(() => {
    if (resolvedCategory?.attributeSchema?.length) return resolvedCategory.attributeSchema;
    return (asset.attributes ?? []).map((a) => ({
      fieldName: a.attrName,
      label: a.attrName,
      dataType: 'TEXT' as const,
      required: false,
    }));
  }, [resolvedCategory, asset.attributes]);

  const valueFor = (fieldName: string): string =>
    asset.attributes?.find((a) => a.attrName === fieldName)?.attrValue ?? '';

  const beginEdit = () => {
    // Seed the form from current values, typed per the schema.
    const initial: Record<string, unknown> = {};
    fields.forEach((f) => {
      const raw = valueFor(f.fieldName);
      if (f.dataType === 'DATE') initial[f.fieldName] = raw ? dayjs(raw) : undefined;
      else if (f.dataType === 'NUMBER') initial[f.fieldName] = raw === '' ? undefined : Number(raw);
      else if (f.dataType === 'BOOLEAN') initial[f.fieldName] = raw === 'true' || raw === '1';
      else initial[f.fieldName] = raw;
    });
    form.setFieldsValue(initial);
    setEditing(true);
  };

  const handleSave = async () => {
    if (!identity.isReady) {
      message.error('Your employee profile is still loading — please try again in a moment');
      return;
    }
    try {
      const values = await form.validateFields();
      // Serialise each typed value back to the string the backend stores.
      const attributes = fields.map((f) => {
        const v = values[f.fieldName];
        let attrValue = '';
        if (f.dataType === 'DATE') attrValue = v ? dayjs(v).format('YYYY-MM-DD') : '';
        else if (f.dataType === 'BOOLEAN') attrValue = v ? 'true' : 'false';
        else if (f.dataType === 'NUMBER') attrValue = v == null ? '' : String(v);
        else attrValue = v ?? '';
        return { attrName: f.fieldName, attrValue };
      });

      setSaving(true);
      await HrmAssetService.updateAsset({
        organizationId: getOrganizationId(),
        assetId: asset.assetId,
        attributes,
        modifiedBy: identity.employeeCode,
      });
      // Reflect the saved values locally (also reload from server for safety).
      updateAssetInList(asset.assetId, { attributes });
      try {
        const fresh = await HrmAssetService.getAsset(getOrganizationId(), asset.assetId);
        updateAssetInList(asset.assetId, fresh as Partial<Asset>);
      } catch {
        // local update already applied
      }
      message.success('Attributes updated');
      setEditing(false);
    } catch (err: unknown) {
      if ((err as { errorFields?: unknown })?.errorFields) return; // validation
      message.error('Failed to update attributes');
    } finally {
      setSaving(false);
    }
  };

  if (fields.length === 0) {
    return <Empty description="No attributes defined for this category" style={{ marginTop: 32 }} />;
  }

  // ── Edit mode ──────────────────────────────────────────────────────────
  if (editing) {
    return (
      <div className={styles.tabContent}>
        <Form form={form} layout="vertical" requiredMark>
          {fields.map((f) => {
            const rules = f.required ? [{ required: true, message: `${f.label} is required` }] : [];
            return (
              <Form.Item key={f.fieldName} label={f.label} name={f.fieldName} rules={rules}
                valuePropName={f.dataType === 'BOOLEAN' ? 'checked' : 'value'}>
                {f.dataType === 'NUMBER' ? (
                  <InputNumber style={{ width: '100%' }} placeholder={`Enter ${f.label}`} />
                ) : f.dataType === 'DATE' ? (
                  <DatePicker style={{ width: '100%' }} format="DD-MMM-YYYY" />
                ) : f.dataType === 'BOOLEAN' ? (
                  <Switch />
                ) : (
                  <Input placeholder={`Enter ${f.label}`} />
                )}
              </Form.Item>
            );
          })}
          <Space>
            <Button onClick={() => setEditing(false)}>Cancel</Button>
            <Button type="primary" loading={saving} onClick={handleSave}>Save</Button>
          </Space>
        </Form>
      </div>
    );
  }

  // ── Read-only view ─────────────────────────────────────────────────────
  return (
    <div className={styles.tabContent}>
      {fields
        .filter((f) => f.dataType === 'DATE' && isWarrantyExpiringSoon(valueFor(f.fieldName), 90))
        .map((f) => (
          <WarrantyReminderBanner key={f.fieldName} expiryDate={valueFor(f.fieldName)} label={f.label} />
        ))}

      <Descriptions column={2} size="small" bordered>
        {fields.map((f) => {
          const raw = valueFor(f.fieldName);
          const displayValue =
            f.dataType === 'DATE' ? (raw ? formatDate(raw) : '')
            : f.dataType === 'BOOLEAN' ? (raw === 'true' || raw === '1' ? 'Yes' : 'No')
            : raw;
          return (
            <Descriptions.Item key={f.fieldName} label={f.label}>
              {displayValue || '—'}
            </Descriptions.Item>
          );
        })}
      </Descriptions>

      {canEdit && (
        <div style={{ marginTop: 12 }}>
          <Can I="edit" object="asset_record">
            <Button icon={<EditIcon style={{ fontSize: 16 }} />} size="small" onClick={beginEdit}>
              Edit Attributes
            </Button>
          </Can>
        </div>
      )}
    </div>
  );
}
