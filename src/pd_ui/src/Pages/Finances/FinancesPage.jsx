import React, { useContext } from 'react';
import RenderTreasuryTab from './TreasuryTab/RenderTreasuryTab';
import WalletTab from './WalletTab';
import { TABS } from '../../reducers/navigationAndApiReducer';
import  {AppContext}  from '../../Context';

const FinancesPage = (props) => {
  const {navigationAndApiState} = useContext(AppContext);

  return (
    <> 
      {navigationAndApiState.location.tab === TABS.treasury && <RenderTreasuryTab/>}
      {navigationAndApiState.location.tab === TABS.wallet && <WalletTab/>}
    </>
    
  );
};

export default FinancesPage;