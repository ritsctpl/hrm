'use client';

import React, { useState } from 'react';
import { Alert, Button, Input, Modal, Space, Typography } from 'antd';
import { EyeOutlined, LockOutlined } from '@ant-design/icons';
import { useSalaryReveal } from '@/hooks/useSalaryReveal';

/**
 * Reveal / lock salary figures.
 *
 * <p>Re-entering your own password, not a shared team code: a code known to five people cannot say
 * which of them looked, and costs the same keystrokes. The password goes straight to the server and is
 * never stored here.
 *
 * <p>This control does not unmask anything by itself. The figures arrive withheld from the server and
 * arrive real once a grant exists, so nothing on the screen can be talked into showing a salary.
 */
export default function SalaryRevealControl({ organizationId }: { organizationId?: string }) {
  const { status, secondsLeft, loading, error, reveal, lockNow } = useSalaryReveal(organizationId);
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');

  const minutes = Math.max(0, Math.ceil(secondsLeft / 60));

  const submit = async () => {
    const ok = await reveal(password);
    setPassword('');
    if (ok) setOpen(false);
  };

  if (status.active) {
    return (
      <Space size="small">
        <Alert
          type="info"
          showIcon
          style={{ padding: '2px 10px' }}
          message={
            <Typography.Text style={{ fontSize: 12 }}>
              Salaries visible for another {minutes} minute{minutes === 1 ? '' : 's'}
            </Typography.Text>
          }
        />
        <Button size="small" icon={<LockOutlined />} onClick={() => void lockNow()}>
          Lock now
        </Button>
      </Space>
    );
  }

  return (
    <>
      <Button size="small" icon={<EyeOutlined />} onClick={() => setOpen(true)}>
        Reveal salaries
      </Button>
      <Modal
        title="Confirm it is you"
        open={open}
        onCancel={() => { setOpen(false); setPassword(''); }}
        onOk={() => void submit()}
        okText="Reveal"
        confirmLoading={loading}
        destroyOnHidden
      >
        <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
          Salary figures stay hidden until you re-enter your password. Access is recorded.
        </Typography.Paragraph>
        <Input.Password
          autoFocus
          value={password}
          placeholder="Your password"
          onChange={(e) => setPassword(e.target.value)}
          onPressEnter={() => void submit()}
        />
        {error && <Alert style={{ marginTop: 12 }} type="error" showIcon message={error} />}
      </Modal>
    </>
  );
}
