// CustomModal.tsx
import React from 'react';
import { Modal, Button } from 'antd';
import styled from 'styled-components';

const StyledModal = styled(Modal)`
  .ant-modal .ant-modal-body {
  overflow: 'auto';
  }
`;

interface DynamicModalProps {
  visible: boolean;
  onOk?: () => void;
  onCancel?: () => void;
  onReset?: () => void;
  resetButtonVisible?: boolean;
  title?: React.ReactNode;
  okButtonVisible?: boolean;
  cancelButtonVisible?: boolean;
  children?: React.ReactNode;
  width?: number | string;
  height?: number | string;
  max?: boolean;
}

const DynamicModal: React.FC<DynamicModalProps> = ({
  visible,
  onOk,
  onCancel,
  onReset,
  title,
  okButtonVisible = true,
  cancelButtonVisible = true,
  resetButtonVisible = true,
  children,
  width,
  height,
  max
}) => {
  const modalClass = max ? 'max-content-width' : '';

  return (
    <StyledModal
      open={visible}
      title={title}
      onOk={onOk}
      onCancel={onCancel}
      footer={[
        resetButtonVisible && <Button key="reset" onClick={onReset}>Reset</Button>,
        cancelButtonVisible && <Button key="cancel" onClick={onCancel}>Cancel</Button>
      ]}
      className={modalClass}
      width={width}
      height={height}
    >
      <div style={{ width: '100%', height: '400px',overflow:'auto' }}>
        {children}
      </div>
    </StyledModal>
  );
};

export default DynamicModal;