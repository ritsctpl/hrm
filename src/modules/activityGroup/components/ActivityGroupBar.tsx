'use client';

import React, { useState } from 'react';
import styles from '../styles/activityGroup.module.css';
import { IconButton, InputBase, Paper } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useTranslation } from 'react-i18next';
import { Button } from 'antd';
import UserInstructions from '@modules/buyOff/components/userInstructions';
import InstructionModal from '@components/InstructionModal';


interface UserGroupBarProps {
  handleTop50: (searchTerm: string) => void;
  handleSearchClicks: (searchTerm: string) => void;
}

const ActivityGroupBar: React.FC<UserGroupBarProps> = ({ handleTop50, handleSearchClicks }) => {
  const { t } = useTranslation()
  const [filter, setFilter] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');



  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleSearchClick = () => {
    handleSearchClicks(searchTerm)
  };

  const handleGoClick = () => {
    handleTop50(searchTerm)
    setSearchTerm('')
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
            placeholder={`${t('search')}...`}
            className={styles.searchInput}
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            sx={{ ml: 1, flex: 1 }}
          />
          <IconButton
            type="button"
            sx={{ p: '10px' }}
            aria-label="search"
            onClick={handleSearchClick}
          >
            <SearchIcon className={styles.searchIcon} />
          </IconButton>
        </Paper>
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
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px' }}>
        <Button style={{ marginRight: "20px" }} type='primary' onClick={handleGoClick}>{t("go")}</Button>
        <InstructionModal title="Activity Group Maintenance">
          <UserInstructions />
        </InstructionModal>
      </div>
    </div>
  );
};

export default ActivityGroupBar;
