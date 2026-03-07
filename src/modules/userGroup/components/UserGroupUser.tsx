import React, { useState, useEffect, useContext } from 'react';
import { Transfer } from 'antd';
import type { TransferProps } from 'antd/es/transfer';
import { retrieveAvailableUserGroups, RetriveUGUpdateList } from '@services/userGroupService';
import { parseCookies } from 'nookies';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from 'react-i18next';
import { UserGrpContext } from '../hooks/useContext/UserGroupUseContext';

interface ResourceType {
  key: string;
  user: string;
}

interface DragDropTableProps {
  drag: boolean;
}

const DragDropTable: React.FC<DragDropTableProps> = ({
  drag,
}) => {
  const { selectedRowData, setSelectedRowData } = useContext<any>(UserGrpContext);
  const [mockData, setMockData] = useState<ResourceType[]>([]);
  const [targetKeys, setTargetKeys] = useState<string[]>([]);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchResourceTypesData = async () => {
      const cookies = parseCookies();
      const site = cookies.site;

      try {
        let availableWithKeys: ResourceType[] = [];
        let assignedWithKeys: ResourceType[] = [];

        if (selectedRowData.users && selectedRowData.availableusers) {
          // Prioritize values from selectedRowData
          assignedWithKeys = selectedRowData.users.map(user => ({
            key: user.key || uuidv4(),
            user: user.user
          }));
          availableWithKeys = selectedRowData.availableusers.map(user => ({
            key: user.key || uuidv4(),
            user: user.user
          }));

          setMockData([...availableWithKeys, ...assignedWithKeys]);
          setTargetKeys(assignedWithKeys.map(item => item.key));
        } else {
          // Fetch data from API if selectedRowData does not have prioritized values
          if (drag) {
            const response = await retrieveAvailableUserGroups(site);
            console.log("responseCreate", response);
            
            const available = Array.isArray(response) ? response.map((user: any) => ({
              key: uuidv4(),
              user: user.user
            })) : [];

            setMockData(available);
            setTargetKeys([]);
          } else if (selectedRowData.userGroup && selectedRowData?.createdDateTime) {
            const response = await RetriveUGUpdateList(site, selectedRowData.userGroup);
            console.log("responseUpdate", response);
            const available = Array.isArray(response) ? response.map((user: any) => ({
              key: uuidv4(),
              user: user.user
            })) : [];
            assignedWithKeys = selectedRowData.users?.map(user => ({
              ...user,
              key: user.key || uuidv4()
            })) || [];

            setMockData([...available, ...assignedWithKeys]);
            setTargetKeys(assignedWithKeys.map(item => item.key));
          } else {
            const response = await retrieveAvailableUserGroups(site);
            const available = Array.isArray(response) ? response.map((user: any) => ({
              key: uuidv4(),
              user: user.user
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
  }, [drag, selectedRowData]);

  const handleChange: TransferProps['onChange'] = (newTargetKeys: any) => {
    setTargetKeys(newTargetKeys);

    const updatedAssignedResourceTypes = mockData.filter(item => newTargetKeys.includes(item.key));
    const updatedAvailableResourceTypes = mockData.filter(item => !newTargetKeys.includes(item.key));

    setSelectedRowData(prevData => ({
      ...prevData,
      users: updatedAssignedResourceTypes,
      availableusers: updatedAvailableResourceTypes
    }));
  };

  const handleSearch: TransferProps['onSearch'] = (dir, value) => {
    console.log('Search:', dir, value);
  };

  const filterOption = (inputValue: string, option: ResourceType) =>
    option.user.toLowerCase().includes(inputValue.toLowerCase());

  const renderItem = (item: ResourceType) => item.user;

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
          <span key="available" style={{ fontSize: '16px' }}>{t("availableUsers")}</span>,
          <span key="assigned" style={{ fontSize: '16px' }}>{t("assignedUsers")}</span>
        ]}/>
    </div>
  );
};

export default DragDropTable;
