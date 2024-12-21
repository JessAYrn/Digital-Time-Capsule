import React, { useState } from 'react';
import TabsComponent from "../../Components/Fields/Tabs";
import TreasuryTab from './TreasuryTab';

const FINANCE_PAGE_TABS = {treasury: "treasury", wallet: "wallet"}
const FINANCE_PAGE_TABS_Array = [FINANCE_PAGE_TABS.treasury,  FINANCE_PAGE_TABS.wallet];

const FinancesPage = (props) => {
  
  const [selectedTab, setSelectedTab] = useState(FINANCE_PAGE_TABS_Array[0]);

  return (
    <> 
      <TabsComponent 
      tabs={FINANCE_PAGE_TABS_Array} 
      selectedTab={selectedTab} 
      setSelectedTab={setSelectedTab} 
      indicatorColor={"secondary"}
      sx={{ backgroundColor: "#0A0A0A", position: "fixed", top: "28px", zIndex: "10" }}
      />
      {selectedTab === FINANCE_PAGE_TABS.treasury && <TreasuryTab/>}
      
    </>
    
  );
};

export default FinancesPage;