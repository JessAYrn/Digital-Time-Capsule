import React, { useContext } from 'react';
import TreasuryTab from './TreasuryTab';
import WalletTab from './WalletTab';
import { TABS } from '../../reducers/navigationAndApiReducer';
import  {AppContext}  from '../../Context';

const FinancesPage = (props) => {
  const {navigationAndApiState} = useContext(AppContext);

  return (
    <> 
      {navigationAndApiState.location.tab === TABS.treasury && <TreasuryTab/>}
      {navigationAndApiState.location.tab === TABS.wallet && <WalletTab/>}
    </>
    
  );
};

export default FinancesPage;