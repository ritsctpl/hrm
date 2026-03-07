import React, { useState, useEffect, useContext } from 'react';
import { Transfer } from 'antd';
import type { TransferProps } from 'antd/es/transfer';
import { retrieveAvailableActivityGroups, RetriveActivityGroupUpdateList } from '@services/userGroupService';
import { parseCookies } from 'nookies';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from 'react-i18next';
import { UserGrpContext } from '../hooks/useContext/UserGroupUseContext';

interface ResourceType {
  key: string;
  activityGroupName: string;
}

interface ActivityGroupProps {
  drag: boolean;
}

const ActivityGroup: React.FC<ActivityGroupProps> = ({
  drag,
}) => {
  const { selectedRowData, setSelectedRowData } = useContext<any>(UserGrpContext);
  const [mockData, setMockData] = useState<ResourceType[]>([]);
  const [targetKeys, setTargetKeys] = useState<string[]>([]);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchData = async () => {
      const cookies = parseCookies();
      const site = cookies?.site;

      try {
        let available: ResourceType[] = [];
        let assigned: ResourceType[] = [];

        if (selectedRowData.permissionForActivityGroup && selectedRowData.availableActivityGroups) {
          assigned = selectedRowData.permissionForActivityGroup.map(user => ({
            key: user.key || uuidv4(),
            activityGroupName: user.activityGroupName
          }));
          available = selectedRowData.availableActivityGroups.map(user => ({
            key: user.key || uuidv4(),
            activityGroupName: user.activityGroupName
          }));

          setMockData([...available, ...assigned]);
          setTargetKeys(assigned.map(item => item.key));
        } else {
          if (drag) {
            const response = await retrieveAvailableActivityGroups(site);
            available = Array.isArray(response) ? response.map((activity: any) => ({
              key: uuidv4(),
              activityGroupName: activity.activityGroupName
            })) : [];

            setMockData(available);
            setTargetKeys([]);
          } else if (selectedRowData.userGroup && selectedRowData?.createdDateTime) {
            const response = await RetriveActivityGroupUpdateList(site, selectedRowData.userGroup);
            available = Array.isArray(response) ? response.map((activity: any) => ({
              key: uuidv4(),
              activityGroupName: activity.activityGroupName
            })) : [];
            assigned = selectedRowData.permissionForActivityGroup?.map(user => ({
              ...user,
              key: user.key || uuidv4()
            })) || [];

            setMockData([...available, ...assigned]);
            setTargetKeys(assigned.map(item => item.key));
          } else {
            const response = await retrieveAvailableActivityGroups(site);
            available = Array.isArray(response) ? response.map((activity: any) => ({
              key: uuidv4(),
              activityGroupName: activity.activityGroupName
            })) : [];

            setMockData(available);
            setTargetKeys([]);
          }
        }

      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [drag, selectedRowData]);

  const handleChange: TransferProps['onChange'] = (newTargetKeys: any) => {
    setTargetKeys(newTargetKeys);

    const updatedAssignedActivityGroups = mockData.filter(item => newTargetKeys.includes(item.key));
    const updatedAvailableActivityGroups = mockData.filter(item => !newTargetKeys.includes(item.key));

    setSelectedRowData(prevData => ({
      ...prevData,
      permissionForActivityGroup: updatedAssignedActivityGroups,
      availableActivityGroups: updatedAvailableActivityGroups
    }));
  };

  const handleSearch: TransferProps['onSearch'] = (dir, value) => {
    console.log('Search:', dir, value);
  };

  const filterOption = (inputValue: string, option: ResourceType) =>
    option.activityGroupName.toLowerCase().includes(inputValue.toLowerCase());

  const renderItem = (item: ResourceType) => item.activityGroupName;
 
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
        listStyle={{ width: '100%', height: 400 }}
        rowKey={(item) => item.key}
        titles={[
          <span key="available" style={{ fontSize: '16px' }}>{t("availableActivityGroups")}</span>,
          <span key="assigned" style={{ fontSize: '16px' }}>{t("assignedActivityGroups")}</span>
          ]}/>
    </div>
  );
};

export default ActivityGroup;

