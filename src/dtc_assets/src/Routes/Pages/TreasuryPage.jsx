import { NavBar } from "../../Components/navigation/NavBar";
import React, { useContext } from 'react';
import { UI_CONTEXTS } from "../../Contexts";
import { AppContext } from "../App";
import './TreasuryPage.scss'

const TreasuryPage = (props) => {
  const { journalState, journalDispatch, homePageState} = useContext(AppContext);
  return (
   journalState?.modalStatus?.show ?
    <div >
        <Modal 
            context={UI_CONTEXTS.TREASURY}
        />
    </div>:
    <div>
    {
      homePageState.isLoading ?
      <LoadScreen/> :
      <div>
        <NavBar
          walletLink={false}
          journalLink={true}
          accountLink={true}
          dashboardLink={true}
          notificationIcon={false}
          context={UI_CONTEXTS.TREASURY}
        />
        <div className='treasuryPage_container'>
          coming soon
        </div>
      </div> 
    }
    </div>
    
  );
};

export default TreasuryPage;