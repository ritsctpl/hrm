/**
 * HRM Employee App Route
 * /rits/hrm_employee_app
 *
 * Manages navigation between Landing (directory) and Screen (profile) views.
 */

'use client';

import React, { useState, useCallback } from 'react';
import CommonAppBar from '@components/CommonAppBar';
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

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <CommonAppBar
        allActivities={[]}
        username={null}
        site={null}
        appTitle="Employee Master"
        onSiteChange={null}
        onSearchChange={() => {}}
      />

      {selectedHandle ? (
        <HrmEmployeeScreen handle={selectedHandle} onBack={handleBack} />
      ) : (
        <HrmEmployeeLanding onSelectEmployee={handleSelectEmployee} />
      )}
    </div>
  );
};

export default HrmEmployeePage;
