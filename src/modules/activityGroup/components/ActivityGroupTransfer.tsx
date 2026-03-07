'use client';

import React, { useState, useEffect, useContext } from 'react';
import { Transfer } from 'antd';
import type { TransferProps } from 'antd/es/transfer';
import { parseCookies } from 'nookies';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from 'react-i18next';
import { ActivityGrpContext } from '../hooks/ActivityGrpUseContext';
import { retrieveAllAvailableActivityGroupNames, retrieveAvailableActivityGroupNames } from '@services/activityGroupService';

interface ResourceType {
  key: string;
  activityId: string;
}

interface ActivityGroupTransferProps {
  drag: boolean;
}

const ActivityGroupTransfer: React.FC<ActivityGroupTransferProps> = ({
  drag
}) => {
  const [mockData, setMockData] = useState<ResourceType[]>([]);
  const [targetKeys, setTargetKeys] = useState<string[]>([]);
  const { t } = useTranslation();
  const { formData, setFormData, setFormChange, activeTab, setActiveTab } = useContext<any>(ActivityGrpContext);

  useEffect(() => {
    const fetchResourceTypesData = async () => {
      const cookies = parseCookies();
      const site = cookies.site;

      try {
        let availableWithKeys: ResourceType[] = [];
        let assignedWithKeys: ResourceType[] = [];

        // Populate existing formData
        if (formData.activityGroupMemberList && formData.available) {
          assignedWithKeys = formData.activityGroupMemberList.map(item => ({
            key: item.activityId || uuidv4(),
            activityId: item.activityId
          }));

          availableWithKeys = formData.available.map(user => ({
            key: user.key || uuidv4(),
            activityId: user.activityId
          }));

          setMockData([...availableWithKeys, ...assignedWithKeys]);
          setTargetKeys(assignedWithKeys.map(item => item.key));
        } else {
          if (drag) {
            const response = await retrieveAvailableActivityGroupNames(site);
            const available = Array.isArray(response) ? response.map((item: any) => ({
              key: uuidv4(),
              activityId: item.activityId
            })) : [];

            setMockData(available);
            setTargetKeys([]);
          } else if (formData.activityGroupName && formData.createdDateTime) {
            const response = await retrieveAllAvailableActivityGroupNames(site, formData.activityGroupName);
            
            const available = Array.isArray(response) ? response.map((item: any) => ({
              key: uuidv4(),
              activityId: item.activityId
            })) : [];
            assignedWithKeys = formData.activityGroupMemberList?.map(user => ({
              ...user,
              key: user.key || uuidv4()
            })) || [];

            setMockData([...available, ...assignedWithKeys]);
            setTargetKeys(assignedWithKeys.map(item => item.key));
          } else {
            const response = await retrieveAvailableActivityGroupNames(site);
            const available = Array.isArray(response) ? response.map((item: any) => ({
              key: uuidv4(),
              activityId: item.activityId
            })) : [];

            setMockData(available);
            setTargetKeys([]);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchResourceTypesData();
  }, [drag, formData]);

  const handleChange: TransferProps['onChange'] = (newTargetKeys: any) => {
    setTargetKeys(newTargetKeys);

    const updatedAssignedResourceTypes = mockData.filter(item => newTargetKeys.includes(item.key));
    const updatedAvailableResourceTypes = mockData.filter(item => !newTargetKeys.includes(item.key));

    setFormData(prevData => ({
      ...prevData,
      activityGroupMemberList: updatedAssignedResourceTypes,
      available: updatedAvailableResourceTypes
    }));
    setFormChange(true)
  };

  const handleSearch: TransferProps['onSearch'] = (dir, value) => {
    console.log('Search:', dir, value);
  };

  const filterOption = (inputValue: string, option: ResourceType) =>
    option.activityId.toLowerCase().includes(inputValue.toLowerCase());

  const renderItem = (item: ResourceType) => item.activityId;

  return (
    <div style={{ padding: '20px' }}>
      <Transfer
        dataSource={mockData}
        showSearch
        filterOption={filterOption}
        targetKeys={targetKeys}
        onChange={handleChange}
        onSearch={handleSearch}
        render={renderItem}
        listStyle={{ width: '100%', height: 300 }}
        rowKey={(item) => item.key}
        titles={[t("availableActivities"), t("assignedActivities")]}
      />
    </div>
  );
};

export default ActivityGroupTransfer;
