'use client';

import React, { useState, useCallback } from 'react';
import HrmEmployeeLanding from '@modules/hrmEmployee/HrmEmployeeLanding';
import HrmEmployeeScreen from '@modules/hrmEmployee/HrmEmployeeScreen';

const HrmEmployeePage: React.FC = () => {
  const [selectedHandle, setSelectedHandle] = useState<string | null>(null);

  const handleSelectEmployee = useCallback((handle: string) => {
    setSelectedHandle(handle);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedHandle(null);
  }, []);

  if (selectedHandle) {
    return <HrmEmployeeScreen handle={selectedHandle} onBack={handleBack} />;
  }

  return <HrmEmployeeLanding onSelectEmployee={handleSelectEmployee} />;
};

export default HrmEmployeePage;
