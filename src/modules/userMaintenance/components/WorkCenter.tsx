import React, { useContext, useEffect, useState } from 'react';
import { Transfer, Spin, Alert } from 'antd';
import type { TransferProps } from 'antd';
import { UserContext } from '../hooks/userContext';
import { fetchUserWorkCenter } from '@services/userService';
import { parseCookies } from 'nookies';
import { v4 as uuidv4 } from 'uuid'; // Import UUID library

interface RecordType {
  key: string;
  workCenter: string; // Updated property name
}

// Assuming UserGroup is the type for formData.workCenters
interface WorkCenter {
  workCenter: string;
}

const UserGroup: React.FC = () => {
  const { formData, setFormData, callUser, isEditing, erpShift, setIsAletered } = useContext(UserContext); // Ensure setFormData is provided in context
  const [availableData, setAvailableData] = useState<RecordType[]>([]);
  const [assignedData, setAssignedData] = useState<RecordType[]>([]);

  // Simulating fetching data from API
  const fetchData = async () => {
    try {
      const cookies = parseCookies();
      const site = cookies.site;
      let response = null;
      // debugger
      // if (isEditing && !erpShift) {
      if (formData.user == "") {
        let payLoadUser = ""
        response = await fetchUserWorkCenter(site, payLoadUser);
      }
      else {
        response = await fetchUserWorkCenter(site, formData.user);
      }


      const availableWorkCenterList = response.availableWorkCenterList;
      console.log(availableWorkCenterList);

      // Transform data into the format required by Transfer component
      const tempAvailableData = availableWorkCenterList.map((item: { workCenter: string }, index: number) => ({
        key: index.toString(), // Use index or any unique identifier
        workCenter: item.workCenter, // Use workCenter instead of title
      }));

      // Initialize assignedData with formData.workCenters
      const tempAssignedData = (formData.workCenters as WorkCenter[]).map((group: WorkCenter) => ({
        key: uuidv4(), // Generate a unique key
        workCenter: group.workCenter, // Use workCenter instead of title
      }));

      setAvailableData(tempAvailableData);
      setAssignedData(tempAssignedData);
    } catch (error) {
      console.log(error);

    }
  };

  useEffect(() => {
    fetchData();
  }, [formData.user, callUser]); // Dependency on formData.user if needed

  // Update context data when assignedData changes
  useEffect(() => {
    // Convert assignedData back to the format of formData.workCenters
    const updatedUserGroups = assignedData.map(item => ({
      workCenter: item.workCenter,
    }));

    setFormData(prev => ({
      ...prev,
      workCenters: updatedUserGroups,
    }));
  }, [assignedData, setFormData]);

  const handleChange: TransferProps['onChange'] = (newTargetKeys, direction, moveKeys) => {
    console.log('handleChange called', { newTargetKeys, direction, moveKeys });

    if (direction === 'left') {
      // Items moved from right to left
      const movedItems = assignedData.filter(item => moveKeys.includes(item.key));
      setAssignedData(prev => prev.filter(item => !moveKeys.includes(item.key)));
      setAvailableData(prev => [...prev, ...movedItems]);
    } else {
      // Items moved from left to right
      const movedItems = availableData.filter(item => moveKeys.includes(item.key));
      setAvailableData(prev => prev.filter(item => !moveKeys.includes(item.key)));
      setAssignedData(prev => [...prev, ...movedItems]);
    }

    console.log('Updated assignedData:', assignedData);
    console.log('Updated availableData:', availableData);
    setIsAletered(true);
  };

  const filterOption: TransferProps['filterOption'] = (inputValue, item) => {
    return item.workCenter.toLowerCase().includes(inputValue.toLowerCase()); // Adjusted to workCenter
  };

  const renderItem = (item: RecordType) => {
    return {
      label: <span className="custom-item">{item.workCenter}</span>, // Adjusted to workCenter
      value: item.key,
    };
  };



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
      titles={['Available Work Center', 'Assigned Work Center']}
      showSearch
      filterOption={filterOption}
    />
  );
};

export default UserGroup;
