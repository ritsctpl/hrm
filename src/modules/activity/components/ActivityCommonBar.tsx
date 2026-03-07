'use client';

import React, { useState } from 'react';
import styles from '../styles/ActivityMaintenance.module.css';
import { IconButton, InputBase, Paper } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { parseCookies } from 'nookies';
import { fetchTop50Activity } from '@services/activityService';
import { useTranslation } from 'react-i18next';
import InstructionModal from '@components/InstructionModal';
import UserInstructions from '@modules/buyOff/components/userInstructions';
import { Button } from 'antd';


interface DataFieldCommonBarProps {
  onSearch: (searchTerm: string) => void;
  setFilteredData: ([]) => void;
}

const ActivityCommonBar: React.FC<DataFieldCommonBarProps> = ({ onSearch, setFilteredData }) => {
  const [filter, setFilter] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const { t } = useTranslation()


  let activityTop50List;
  const handleFilter = () => {
    setFilter(prev => !prev);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleSearchClick = () => {
    onSearch(searchTerm);
  };

  const handleItemFetch = () => {
    const fetchTop50Activities = async () => {
      const cookies = parseCookies();
      const site = cookies.site;

      try {
        activityTop50List = await fetchTop50Activity(site);
        setFilteredData(activityTop50List);
      }
      catch (error) {
        console.error('Error fetching top 50 activities:', error);
      }
    };

    fetchTop50Activities();
  };


  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault(); // Prevent the default form submission
      handleSearchClick();
    }
  };

  return (
    <div className={styles.dataField}>
      <div className={styles.datafieldNav}>
        <Paper component="form" className={styles.searchPaper}>
          <InputBase
            className={styles.searchInput}
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            placeholder={`${t('search')}...`}
            sx={{ ml: 1, flex: 1 }}
          />
          <IconButton
            type="button"
            sx={{ p: '10px' }}
            aria-label="search"
            onClick={handleSearchClick} // Trigger search on click
          >
            <SearchIcon className={styles.searchIcon} />
          </IconButton>
        </Paper>
        <div className={styles.goButton}>
          <Button type="primary" onClick={handleItemFetch}>
            {t("go")}
          </Button>
          <InstructionModal title="Activity Maintenance">
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

export default ActivityCommonBar;
