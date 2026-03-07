import React, { useContext, useEffect, useState } from 'react';
import { Transfer, Spin, Alert } from 'antd';
import type { TransferProps } from 'antd';
import { UserContext } from '../hooks/userContext';
import { fetchUserGroup } from '@services/userService';
import { parseCookies } from 'nookies';
import { v4 as uuidv4 } from 'uuid'; // Import UUID library

interface RecordType {
  key: string;
  userGroup: string; // Updated property name
}

// Assuming UserGroup is the type for formData.userGroups
interface UserGroup {
  userGroup: string;
}

const UserGroup: React.FC = () => {
  const { formData, setFormData,callUser,isEditing,erpShift } = useContext(UserContext); // Ensure setFormData is provided in context
  const [availableData, setAvailableData] = useState<RecordType[]>([]);
  const [assignedData, setAssignedData] = useState<RecordType[]>([]);

  console.log(formData, 'formData');
  

  // Simulating fetching data from API
  const fetchData = async () => {
    try {
      const cookies = parseCookies();
     
      const site = cookies.site;
      let response = null;

      if (isEditing && !erpShift) {
        let payLoadUser = ""
          response = await fetchUserGroup(site, payLoadUser);
          console.log(response,"responsess");
      }
      else{
        response = await fetchUserGroup(site, formData.user);
        console.log(response,"response");
      }
      // const response = await fetchUserGroup(site, payLoadUser,isEditing,erpShift)
      console.log(response,"response");

      const availableUserGroupList = response.availableUserGroupList;
      console.log(availableUserGroupList);

      // Transform data into the format required by Transfer component
      const tempAvailableData = availableUserGroupList
        .filter(item => !formData.userGroups.some(group => group.userGroup === item.userGroup))
        .map((item: { userGroup: string }, index: number) => ({
          key: uuidv4(), // Use UUID instead of index for consistency
          userGroup: item.userGroup,
        }));

      // Initialize assignedData with formData.userGroups
      const tempAssignedData = (formData.userGroups as UserGroup[]).map((group: UserGroup) => ({
        key: uuidv4(),
        userGroup: group.userGroup,
      }));

      setAvailableData(tempAvailableData);
      setAssignedData(tempAssignedData);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [formData.user,callUser]); // Dependency on formData.user if needed

  // Update context data when assignedData changes
  useEffect(() => {
    // Convert assignedData back to the format of formData.userGroups
    const updatedUserGroups = assignedData.map(item => ({
      userGroup: item.userGroup,
    }));

    setFormData(prev => ({
      ...prev,
      userGroups: updatedUserGroups,
    }));
    console.log("called")
  }, [assignedData, setFormData]);

  const handleChange: TransferProps['onChange'] = (newTargetKeys, direction, moveKeys) => {
    if (direction === 'left') {
      // Items moved from right to left (assigned to available)
      const movedItems = assignedData.filter(item => moveKeys.includes(item.key));
      setAssignedData(current => current.filter(item => !moveKeys.includes(item.key)));
      setAvailableData(current => [...current, ...movedItems]);
    } else {
      // Items moved from left to right (available to assigned)
      const movedItems = availableData.filter(item => moveKeys.includes(item.key));
      setAvailableData(current => current.filter(item => !moveKeys.includes(item.key)));
      setAssignedData(current => [...current, ...movedItems]);
    }
  };

  const filterOption: TransferProps['filterOption'] = (inputValue, item) => {
    return item.userGroup.toLowerCase().includes(inputValue.toLowerCase()); // Adjusted to userGroup
  };

  const renderItem = (item: RecordType) => {
    return {
      label: <span className="custom-item">{item.userGroup}</span>, // Adjusted to userGroup
      value: item.key,
    };
  };



console.log(availableData,"availableData");

  return (
    <Transfer
      dataSource={availableData.concat(assignedData)} // Combined data source
      listStyle={{
        width: '50%',
        height: '50vh',
        margin: "20px"
      }}
      targetKeys={assignedData.map(item => item.key)}
      onChange={handleChange}
      render={renderItem}
      titles={['Available User Group', 'Assigned User Group']}
      showSearch
      filterOption={filterOption}
    />
  );
};

export default UserGroup;
