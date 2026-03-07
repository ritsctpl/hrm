'use client';

import React, { useState } from 'react';
import { IconButton, InputBase, Paper } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { parseCookies } from 'nookies';
import styles from '../styles/FilterCommonBar.module.css';
import { useTranslation } from 'react-i18next';
import { fetchUserAllData, fetchUserTop50 } from '@services/userService';
import InstructionModal from '@components/InstructionModal';
import UserInstructions from '@modules/buyOff/components/userInstructions';
import { Button } from 'antd';

interface DataFieldCommonBarProps {
  onSearch: (searchTerm: string) => void;
  setData: (data: any[]) => void; // Updated to accept an array of Data
}

const DataFieldCommonBar: React.FC<DataFieldCommonBarProps> = ({ onSearch, setData }) => {
  const [filter, setFilter] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');



  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleItemFetch = async () => {
    const cookies = parseCookies();
    const site = cookies.site;
    if (searchTerm !== "") {
      try {
        const operationTop50List = await fetchUserAllData(searchTerm);
        console.log(operationTop50List);
        // ... existing code ...
        const extractedData = operationTop50List.map(({ user, lastName, status }) => ({
          user,
          lastName,
          status,
        }));
        // ... existing code ...
        // const filteredData = extractedData.filter(row =>
        //   row.user.toLowerCase().includes(searchTerm.toLowerCase())
        // );
        setData(extractedData);
      } catch (error) {
        console.error('Error fetching data fields:', error);
      }
    }
    else {
      try {
        const userData = await fetchUserTop50();
        const extractedData = userData.map(({ user, lastName, status }) => ({
          user,
          lastName,
          status,
        }));
        setData(extractedData || []);

      } catch (error) {
        console.error('Error fetching user:', error);
      }
    }
  };
  const handleItemFetchGo = async () => {
    const cookies = parseCookies();
    const site = cookies.site;
    try {
      const userAllList = await fetchUserTop50();
      // const filteredData = userAllList.filter(row =>
      //   row.shiftName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      //   row.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      //   row.shiftType.toLowerCase().includes(searchTerm.toLowerCase())
      // );
      const extractedData = userAllList.map(({ user, lastName, status }) => ({
        user,
        lastName,
        status,
      }));
      setData(extractedData);
    } catch (error) {
      console.error('Error fetching data fields:', error);
    }
  };
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault(); // Prevent the default form submission
      handleItemFetch();
    }
  };

  const { t } = useTranslation();

  return (
    <div className={styles.dataField}>
      <div className={styles.datafieldNav}>
        <Paper component="form" className={styles.searchPaper}>
          <InputBase
            placeholder={`${t('search')}...`}
            className={styles.searchInput}
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown} // Handle key down events
            sx={{ ml: 1, flex: 1 }}
          />
          <IconButton
            type="button"
            sx={{ p: '10px' }}
            aria-label="search"
            onClick={handleItemFetch} // Trigger search on click
          >
            <SearchIcon className={styles.searchIcon} />
          </IconButton>
        </Paper>
        <div className={styles.goButton}>
          <Button onClick={handleItemFetchGo} type='primary'>
            {t('go')}
          </Button>
          <InstructionModal title="User Maintenance">
            <UserInstructions />
          </InstructionModal>
        </div>
      </div>
      {filter && (
        <div className={styles.searchFilter}>
          <InputBase
            style={{ marginLeft: '20px' }}
            placeholder="Search..."
            inputProps={{ 'aria-label': 'filter-input' }}
          />
        </div>
      )}
    </div>
  );
};

export default DataFieldCommonBar;
