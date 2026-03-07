import React, { useContext, useEffect, useState } from 'react';
import { Table, Checkbox, message } from 'antd';
import type { TableColumnsType } from 'antd';
import { parseCookies } from 'nookies'; // For handling cookies
import { retrieveActivityGrp } from '@services/userGroupService';
import { UserGrpContext } from '../hooks/useContext/UserGroupUseContext';

interface Permission {
  activityId: string;
  enabled: boolean;
}

interface ActivityGroup {
  key: string;
  activityGroupName: string;
  activityGroupDescription: string;
  enabled: boolean;
  permissionForActivity: Permission[];
}

const ActivityGroupTab: React.FC = () => {
  const [data, setData] = useState<ActivityGroup[]>([]);
  const { selectedRowData, setSelectedRowData } = useContext<any>(UserGrpContext);

  useEffect(() => {
    const fetchData = async () => {
      if (selectedRowData?.permissionForActivityGroup?.length > 0) {
        const formattedData: ActivityGroup[] = selectedRowData.permissionForActivityGroup.map((group, index) => ({
          key: `${group.activityGroupName}_${index}`,
          activityGroupName: group.activityGroupName,
          activityGroupDescription: group.activityGroupDescription || '',
          enabled: group.enabled,
          permissionForActivity: group.permissionForActivity
        }));
        setData(formattedData);
      } else {
        try {
          const cookies = parseCookies();
          const site = cookies.site;
          const response = await retrieveActivityGrp(site);
          console.log(response, 'retrieveActivityGrp');

          const formattedApiData: ActivityGroup[] = response.map((group, index) => ({
            key: `${group.activityGroupName}_${index}`,
            activityGroupName: group.activityGroupName,
            activityGroupDescription: group.activityGroupDescription || '',
            enabled: false,
            permissionForActivity: group.activityIds.map(activity => ({
              activityId: activity.activityId,
              enabled: false
            }))
          }));

          setData(formattedApiData);

          setSelectedRowData(prevState => ({
            ...prevState,
            permissionForActivityGroup: formattedApiData.map(group => ({
              activityGroupName: group.activityGroupName,
              activityGroupDescription: group.activityGroupDescription,
              enabled: group.enabled,
              permissionForActivity: group.permissionForActivity
            }))
          }));

        } catch (error) {
          console.error('Failed to fetch activity group data:', error);
          message.error('Failed to load activity group data.');
        }
      }
    };

    fetchData();
  }, [selectedRowData]);

  const columns: TableColumnsType<ActivityGroup> = [
    {
      title: '',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 50,
      render: (_, record) => (
        <Checkbox
          checked={record.enabled}
          onChange={(e) => handleGroupEnabledChange(record.key, e.target.checked)}
        />
      ),
    },
    {
      title: 'Activity Group Name',
      dataIndex: 'activityGroupName',
      key: 'activityGroupName',
    },
    {
      title: 'Description',
      dataIndex: 'activityGroupDescription',
      key: 'activityGroupDescription',
    },
  ];

  const subColumns = (parentRecord: ActivityGroup): TableColumnsType<Permission> => [
    {
      title: '',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 50,
      render: (_, record: Permission) => (
        <Checkbox
          checked={record.enabled}
          onChange={(e) => handlePermissionEnabledChange(parentRecord.key, record.activityId, e.target.checked)}
        />
      ),
    },
    {
      title: 'Activity ID',
      dataIndex: 'activityId',
      key: 'activityId',
      render: (activityId: string) => activityId,
    },
  ];

  const handleGroupEnabledChange = (key: string, enabled: boolean) => {
    setData((prev) =>
      prev.map((group) => {
        if (group.key === key) {
          const updatedGroup = {
            ...group,
            enabled,
            permissionForActivity: group.permissionForActivity?.map((activity) => ({
              ...activity,
              enabled
            }))
          };

          setSelectedRowData(prevState => ({
            ...prevState,
            permissionForActivityGroup: prevState.permissionForActivityGroup.map(
              activityGroup => activityGroup.activityGroupName === group.activityGroupName
                ? {
                  activityGroupName: group.activityGroupName,
                  activityGroupDescription: group.activityGroupDescription,
                  enabled: enabled,
                  permissionForActivity: updatedGroup.permissionForActivity
                }
                : activityGroup
            )
          }));

          return updatedGroup;
        }
        return group;
      })
    );
  };

  const handlePermissionEnabledChange = (
    groupKey: string,
    activityId: string,
    enabled: boolean
  ) => {
    setData((prev) =>
      prev.map((group) => {
        if (group.key === groupKey) {
          const updatedPermissions = group.permissionForActivity.map((activity) =>
            activity.activityId === activityId
              ? { ...activity, enabled }
              : activity
          );

          const updatedGroup = {
            ...group,
            permissionForActivity: updatedPermissions,
            enabled: updatedPermissions.some((activity) => activity.enabled),
          };

          setSelectedRowData(prevState => ({
            ...prevState,
            permissionForActivityGroup: prevState.permissionForActivityGroup.map(
              activityGroup => activityGroup.activityGroupName === group.activityGroupName
                ? {
                  activityGroupName: updatedGroup.activityGroupName,
                  enabled: updatedGroup.enabled,
                  permissionForActivity: updatedGroup.permissionForActivity
                }
                : activityGroup
            )
          }));

          return updatedGroup;
        }
        return group;
      })
    );
  };

  console.log(selectedRowData, 'selectedRowData');

  return (
    <>
      <Table<ActivityGroup>
        columns={columns}
        dataSource={data}
        rowKey="key"
        expandable={{
          expandedRowRender: (record: ActivityGroup) => (
            <Table
              columns={subColumns(record)}
              dataSource={record.permissionForActivity}
              pagination={false}
              rowKey={(item) => `${record.key}_${item.activityId}`}
            />
          ),
        }}
        pagination={false}
        scroll={{ y: 'calc(100vh - 340px)' }}
      />
    </>
  );
};

export default ActivityGroupTab;
