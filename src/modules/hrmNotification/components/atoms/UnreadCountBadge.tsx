'use client';

import { Badge } from 'antd';

interface UnreadCountBadgeProps {
  count: number;
  children: React.ReactNode;
}

export default function UnreadCountBadge({ count, children }: UnreadCountBadgeProps) {
  return (
    <Badge count={count} overflowCount={99} size="small">
      {children}
    </Badge>
  );
}
