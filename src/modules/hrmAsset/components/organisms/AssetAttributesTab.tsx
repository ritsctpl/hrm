'use client';

import { Descriptions, Button, Empty } from 'antd';
import EditIcon from '@mui/icons-material/Edit';
import WarrantyReminderBanner from '../molecules/WarrantyReminderBanner';
import { formatDate, isWarrantyExpiringSoon } from '../../utils/assetHelpers';
import type { Asset, AssetCategory } from '../../types/domain.types';
import styles from '../../styles/AssetDetail.module.css';

interface AssetAttributesTabProps {
  asset: Asset;
  category?: AssetCategory;
  canEdit: boolean;
  onEditAttributes?: () => void;
}

export default function AssetAttributesTab({ asset, category, canEdit, onEditAttributes }: AssetAttributesTabProps) {
  if (!asset.attributes?.length) {
    return <Empty description="No attributes defined for this category" style={{ marginTop: 32 }} />;
  }

  return (
    <div className={styles.tabContent}>
      {asset.attributes
        .filter((a) => {
          const schema = category?.attributeSchema.find((s) => s.fieldName === a.attrName);
          const isDate = schema?.dataType === 'DATE';
          if (isDate && isWarrantyExpiringSoon(a.attrValue, 90)) return true;
          return false;
        })
        .map((a) => (
          <WarrantyReminderBanner key={a.attrName} expiryDate={a.attrValue} label={a.attrName} />
        ))}

      <Descriptions column={2} size="small" bordered>
        {asset.attributes.map((attr) => {
          const schema = category?.attributeSchema.find((s) => s.fieldName === attr.attrName);
          const displayValue = schema?.dataType === 'DATE' ? formatDate(attr.attrValue) : attr.attrValue;
          return (
            <Descriptions.Item key={attr.attrName} label={schema?.label ?? attr.attrName}>
              {displayValue || '—'}
            </Descriptions.Item>
          );
        })}
      </Descriptions>

      {canEdit && onEditAttributes && (
        <div style={{ marginTop: 12 }}>
          <Button icon={<EditIcon style={{ fontSize: 16 }} />} size="small" onClick={onEditAttributes}>
            Edit Attributes
          </Button>
        </div>
      )}
    </div>
  );
}
