'use client';

// UF-12 — the capture widget. Design 07 §7.
//
// Lives in the HOST app shell, not in ticket_app: the whole point is to be there
// at the moment something breaks, on whatever screen the user was actually using.
//
// Three states, and only three:
//   idle   → a small "Report a problem" affordance
//   armed  → a pulsing red chip with live counts, a Stop button, 10-min auto-stop
//   review → summary modal: what was captured, what that means for privacy, the
//            raw bundle if they want to read it, then Create ticket
//
// INERT BY DEFAULT. Without NEXT_PUBLIC_TICKET_WIDGET=true it renders null and
// patches nothing, so merging this cannot affect any host app until the flag is
// deliberately turned on.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Collapse, Input, Modal, Radio, Space, Tag, Tooltip, Typography, message } from 'antd';
import { BugOutlined } from '@ant-design/icons';
import { parseCookies } from 'nookies';
import CaptureRecorder from './recorder';
import { useDraggableAnchor } from './useDraggableAnchor';
import type { RecorderState } from './recorder';
import { submitCapture } from './bundle';
import {
  CAPTURE_AUTO_STOP_MS, isCaptureBundleEmpty, isFailedNetworkEntry,
} from './captureTypes';
import type { CaptureBundle } from './captureTypes';
import styles from './captureWidget.module.css';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

const flagEnabled = (): boolean =>
  String(process.env.NEXT_PUBLIC_TICKET_WIDGET || '').toLowerCase() === 'true';

const minutes = (ms: number) => Math.round(ms / 60000);

export const CaptureWidget: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<RecorderState | null>(null);
  const [bundle, setBundle] = useState<CaptureBundle | null>(null);
  const [description, setDescription] = useState('');
  // Design 10: request-type choice lives HERE, in the review modal — never at
  // the capture moment. A change request without "what should change" is
  // unanalyzable, so that type makes the description mandatory.
  const [ticketType, setTicketType] = useState<'PROBLEM' | 'CHANGE_REQUEST'>('PROBLEM');
  const [submitting, setSubmitting] = useState(false);

  const recorderRef = useRef<CaptureRecorder | null>(null);
  if (!recorderRef.current) {
    recorderRef.current = new CaptureRecorder({
      onChange: setState,
      onAutoStop: () => {
        message.info(`Recording stopped automatically after ${minutes(CAPTURE_AUTO_STOP_MS)} minutes.`);
      },
    });
  }
  const recorder = recorderRef.current;

  // Render only on the client, and only for a signed-in session — an anonymous
  // visitor on the login screen has nothing to report and no ticket to own.
  useEffect(() => { setMounted(true); }, []);
  const signedIn = useMemo(() => {
    if (!mounted) return false;
    try { return !!parseCookies().token; } catch { return false; }
  }, [mounted]);

  // Never leave a page patched behind us.
  useEffect(() => () => { recorderRef.current?.stop(); }, []);

  // MUST be above the early return below: a hook called conditionally changes hook order
  // between renders, which React rejects with a client-side exception (done wrongly once,
  // 2026-08-08 — it took the whole app down until it was moved here).
  // One anchor for both the idle launcher and the recording chip: if you move one clear of a
  // form's Save button, the other must not reappear on top of it.
  const anchor = useDraggableAnchor('ct-capture-anchor');

  if (!flagEnabled() || !mounted || !signedIn) return null;

  const armed = !!state?.armed;
  const counts = state?.counts;

  const start = () => {
    setBundle(null);
    setDescription('');
    setTicketType('PROBLEM');
    recorder.reset();
    recorder.arm();
    message.info('Recording. Now reproduce the problem, then press Stop.');
  };

  const stop = () => {
    const captured = recorder.stop();
    setBundle(captured);
  };

  const isChange = ticketType === 'CHANGE_REQUEST';
  const changeNeedsDescription = isChange && !description.trim();

  const create = async () => {
    if (!bundle || changeNeedsDescription) return;
    setSubmitting(true);
    try {
      const id = await submitCapture({
        bundle, type: ticketType, description: description.trim() || undefined,
      });
      // HRM has no ticket viewer, so there is nowhere to hand the user off to —
      // just confirm the ticket was raised and close the modal.
      message.success(id ? `Ticket ${id} raised` : 'Ticket raised');
      setBundle(null);
    } catch (e: any) {
      message.error(e?.message || 'Could not raise the ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* ── idle ── */}
      {!armed && !bundle && (
        <div className={styles.captureLauncher} data-testid="ct-capture-launcher"
             ref={anchor.ref} style={anchor.style} {...anchor.handlers}>
          <Tooltip title="Record what happens, then raise a ticket with the evidence attached. Drag to move it out of the way; double-click to put it back." placement="left">
            <Button type="primary" shape="round" icon={<BugOutlined />} onClick={start}>
              Report a problem
            </Button>
          </Tooltip>
        </div>
      )}

      {/* ── armed ── */}
      {armed && (
        <div className={styles.captureChip} data-testid="ct-capture-chip" role="status"
             ref={anchor.ref} style={anchor.style} {...anchor.handlers}>
          <span className={styles.recDot} aria-hidden="true" />
          <span>
            <Text strong style={{ fontSize: 12 }}>Recording</Text>
            <span className={styles.captureCounts} style={{ marginLeft: 8 }}>
              {counts?.consoleErrors ?? 0} errors · {counts?.network ?? 0} requests
              {' ('}{counts?.failedCalls ?? 0} failed){' · '}{counts?.breadcrumbs ?? 0} steps
            </span>
          </span>
          <Button size="small" danger onClick={stop} data-testid="ct-capture-stop">
            Stop
          </Button>
        </div>
      )}

      {/* ── review ── */}
      <Modal
        open={!!bundle}
        title="Here is what we captured"
        width={720}
        onCancel={() => setBundle(null)}
        okText={isChange ? 'Request the change' : 'Create ticket'}
        onOk={create}
        confirmLoading={submitting}
        okButtonProps={{
          'data-testid': 'ct-capture-create',
          disabled: changeNeedsDescription,
        } as any}
        data-testid="ct-capture-summary"
      >
        {bundle && (() => {
          const net = bundle.network || [];
          const networkCount = net.length;
          const failedCount = net.filter(isFailedNetworkEntry).length;
          const okCount = networkCount - failedCount;
          const routeCount = (bundle.routeChanges || []).length + (bundle.route ? 1 : 0);
          return (
            <>
            <Space size={8} wrap style={{ marginBottom: 10 }}>
              <Tag color={bundle.consoleErrors.length ? 'red' : 'default'}>
                {bundle.consoleErrors.length} console errors
              </Tag>
              <Tag color={failedCount ? 'orange' : 'default'}>
                {networkCount} requests ({okCount} ok / {failedCount} failed)
              </Tag>
              <Tag>{routeCount} screens</Tag>
              <Tag>{bundle.breadcrumbs.length} steps</Tag>
            </Space>

            {isCaptureBundleEmpty(bundle) && (
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 10 }}
                message="Nothing was captured"
                description="No errors or failed requests happened while recording. You can still raise the ticket — just describe what went wrong below."
              />
            )}

            <Paragraph type="secondary" style={{ fontSize: 12 }}>
              Includes the screens you visited and the system requests made while
              recording (no passwords or login tokens). We also captured error
              messages and which controls you clicked. We did <b>not</b> record any
              request headers. Read the exact contents below before you send it.
            </Paragraph>

            <div style={{ marginBottom: 8 }}>
              <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                What kind of ticket is this?
              </Text>
              <Radio.Group
                value={ticketType}
                onChange={(e) => setTicketType(e.target.value)}
                data-testid="ct-capture-type"
              >
                <Radio value="PROBLEM" data-testid="ct-capture-type-problem">
                  Something is broken
                </Radio>
                <Radio value="CHANGE_REQUEST" data-testid="ct-capture-type-change">
                  It works, but I want it changed
                </Radio>
              </Radio.Group>
            </div>

            <TextArea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isChange
                ? 'What should work differently? Describe the change you want. (required)'
                : 'What were you trying to do? (optional, but it helps a lot)'}
              status={changeNeedsDescription ? 'warning' : undefined}
              data-testid="ct-capture-description"
            />

            <Collapse
              ghost
              style={{ marginTop: 8 }}
              items={[{
                key: 'raw',
                label: <Text type="secondary">Inspect exactly what will be sent</Text>,
                children: (
                  <div className={styles.monoBlock} data-testid="ct-capture-raw">
                    {JSON.stringify(bundle, null, 2)}
                  </div>
                ),
              }]}
            />
          </>
          );
        })()}
      </Modal>
    </>
  );
};

export default CaptureWidget;
