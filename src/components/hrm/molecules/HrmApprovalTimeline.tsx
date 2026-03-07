'use client';

import React, { useMemo } from 'react';
import { Steps } from 'antd';

interface ApprovalStep {
  title: string;
  actor?: string;
  timestamp?: string;
  status: 'completed' | 'current' | 'pending' | 'rejected';
  remarks?: string;
}

interface HrmApprovalTimelineProps {
  steps: ApprovalStep[];
  currentStep: number;
}

type StepStatus = 'finish' | 'process' | 'wait' | 'error';

/**
 * HrmApprovalTimeline
 *
 * Vertical timeline showing the progression of an approval workflow.
 * Each step displays title, actor, timestamp, and optional remarks.
 *
 * @param steps       - Ordered list of approval steps
 * @param currentStep - Zero-based index of the active step
 */
const HrmApprovalTimeline: React.FC<HrmApprovalTimelineProps> = ({
  steps,
  currentStep,
}) => {
  const mapStatus = (stepStatus: ApprovalStep['status']): StepStatus => {
    switch (stepStatus) {
      case 'completed':
        return 'finish';
      case 'current':
        return 'process';
      case 'rejected':
        return 'error';
      case 'pending':
      default:
        return 'wait';
    }
  };

  const items = useMemo(
    () =>
      steps.map((step) => ({
        title: step.title,
        status: mapStatus(step.status),
        description: (
          <div>
            {step.actor && (
              <div style={{ fontSize: 12, color: '#595959' }}>{step.actor}</div>
            )}
            {step.timestamp && (
              <div style={{ fontSize: 11, color: '#bfbfbf' }}>
                {step.timestamp}
              </div>
            )}
            {step.remarks && (
              <div
                style={{
                  fontSize: 12,
                  color: '#8c8c8c',
                  fontStyle: 'italic',
                  marginTop: 4,
                }}
              >
                {step.remarks}
              </div>
            )}
          </div>
        ),
      })),
    [steps],
  );

  return (
    <Steps
      direction="vertical"
      size="small"
      current={currentStep}
      items={items}
    />
  );
};

export default HrmApprovalTimeline;
