import { NavBar } from "../../Components/navigation/NavBar";
import React, { useContext } from 'react';
import { UI_CONTEXTS } from "../../functionsAndConstants/Contexts";
import { AppContext } from "../App";
import './GroupJournalPage.scss'

const GroupJournalPage = (props) => {
  const { homePageState} = useContext(AppContext);

  return (
    <div>
      <NavBar
        walletLink={false}
        journalLink={true}
        accountLink={true}
        dashboardLink={true}
        notificationIcon={false}
        context={UI_CONTEXTS.GROUPJOURNAL}
      />
      <div className='GroupJournalPage_container'>
        coming soon
      </div>
    </div> 
  );
};

export default GroupJournalPage;