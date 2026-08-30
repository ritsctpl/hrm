'use client';

import React, { useCallback } from 'react';
import { Button, Popconfirm, Tooltip } from 'antd';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
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
  const isEarning = component.componentType === 'EARNING';

  const deletePayComponent = useHrmCompensationStore((s) => s.deletePayComponent);
  const hardDeletePayComponent = useHrmCompensationStore((s) => s.hardDeletePayComponent);

  // Deactivate is irreversible (no re-activate endpoint; deactivated components drop out of the
  // active list on refetch) — so it sits behind a Popconfirm like Delete and the form's own
  // Deactivate, never a single mis-tappable toggle.
  const handleDeactivate = useCallback(
    async () => {
      await deletePayComponent(component.componentCode);
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
          <span className={styles.componentCode}>{component.componentCode}</span>
          <span
            className={`${styles.typeChip} ${isEarning ? styles.typeEarning : styles.typeDeduction}`}
          >
            {component.componentType}
          </span>
        </div>
        <span className={styles.componentName}>{component.componentName}</span>
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
            title="Deactivate this component?"
            description="It is removed from the active list; there is no undo."
            okText="Deactivate"
            cancelText="Cancel"
            onConfirm={handleDeactivate}
          >
            <Tooltip title="Deactivate">
              <Button
                type="text"
                size="small"
                className={styles.componentActionBtn}
                icon={<RemoveCircleOutlineIcon style={{ fontSize: 16 }} />}
              />
            </Tooltip>
          </Popconfirm>
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

      <span
        className={`${styles.stateChip} ${component.active === 1 ? styles.stateActive : styles.stateInactive}`}
      >
        {component.active === 1 ? 'Active' : 'Inactive'}
      </span>
    </div>
  );
};

export default PayComponentListRow;
