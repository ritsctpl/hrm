'use client';

import React, { useCallback } from 'react';
import { Tag, Switch, Typography, Button, Popconfirm, Tooltip } from 'antd';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import type { PayComponent } from '../../types/domain.types';
import { useHrmCompensationStore } from '../../stores/compensationStore';
import Can from '../../../hrmAccess/components/Can';
import styles from '../../styles/PayComponent.module.css';

interface PayComponentListRowProps {
  component: PayComponent;
  selected: boolean;
  onClick: () => void;
}

const PayComponentListRow: React.FC<PayComponentListRowProps> = ({
  component,
  selected,
  onClick,
}) => {
  const typeColor = component.componentType === 'EARNING' ? 'green' : 'red';

  const deletePayComponent = useHrmCompensationStore((s) => s.deletePayComponent);
  const hardDeletePayComponent = useHrmCompensationStore((s) => s.hardDeletePayComponent);

  // Deactivate via the Switch (there is no re-activate endpoint; deactivated
  // components drop out of the active list on refetch).
  const handleToggle = useCallback(
    async (checked: boolean) => {
      if (!checked) {
        await deletePayComponent(component.componentCode);
      }
    },
    [deletePayComponent, component.componentCode],
  );

  const handleHardDelete = useCallback(async () => {
    await hardDeletePayComponent(component.handle);
  }, [hardDeletePayComponent, component.handle]);

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div
      onClick={onClick}
      className={`${styles.componentRow} ${selected ? styles.componentRowSelected : ''}`}
    >
      <div className={styles.componentMain}>
        <div className={styles.componentCodeLine}>
          <Typography.Text strong style={{ fontSize: 13 }}>
            {component.componentCode}
          </Typography.Text>
          <Tag color={typeColor} style={{ fontSize: 10, lineHeight: '16px', margin: 0 }}>
            {component.componentType}
          </Tag>
        </div>
        <Typography.Text
          type="secondary"
          style={{ fontSize: 12, display: 'block' }}
          ellipsis
        >
          {component.componentName}
        </Typography.Text>
      </div>

      <Can I="edit">
        <div className={styles.componentActions} onClick={stop}>
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              className={styles.componentActionBtn}
              icon={<EditOutlinedIcon style={{ fontSize: 16 }} />}
              onClick={onClick}
            />
          </Tooltip>
          <Popconfirm
            title="Delete this component?"
            description="This permanently removes the component."
            okText="Delete"
            okType="danger"
            cancelText="Cancel"
            onConfirm={handleHardDelete}
          >
            <Tooltip title="Delete">
              <Button
                type="text"
                size="small"
                className={styles.componentDeleteBtn}
                icon={<DeleteOutlineIcon style={{ fontSize: 16 }} />}
              />
            </Tooltip>
          </Popconfirm>
        </div>
      </Can>

      <Can
        I="edit"
        fallback={
          <Switch checked={component.active === 1} size="small" disabled style={{ flexShrink: 0 }} />
        }
      >
        <Tooltip title={component.active === 1 ? 'Deactivate' : 'Inactive'}>
          <Switch
            checked={component.active === 1}
            size="small"
            onChange={handleToggle}
            onClick={(_checked, e) => e.stopPropagation()}
            style={{ flexShrink: 0 }}
          />
        </Tooltip>
      </Can>
    </div>
  );
};

export default PayComponentListRow;
