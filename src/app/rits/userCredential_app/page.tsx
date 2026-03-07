'use client';

import React from 'react';
import UserCredentialMain from '@modules/userCredential/components/UserCredentialMain';
import { MyProvider } from '@modules/userCredential/hooks/UserCredentialContext';

const ApiConfigurationMainPage: React.FC = () => {
  return (
    <MyProvider>
      <UserCredentialMain />
    </MyProvider>
  );
};

export default ApiConfigurationMainPage;
