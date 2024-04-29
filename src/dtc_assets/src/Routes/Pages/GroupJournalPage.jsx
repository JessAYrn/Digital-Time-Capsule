import { NavBar } from "../../Components/navigation/NavBar";
import React, { useContext } from 'react';
import { UI_CONTEXTS } from "../../functionsAndConstants/Contexts";
import { AppContext } from "../../Context";
import './GroupJournalPage.scss'

const GroupJournalPage = (props) => {
  const { homePageState} = useContext(AppContext);

  return (
    <div>
      <NavBar />
      <div className='GroupJournalPage_container'>
        coming soon
      </div>
    </div> 
  );
};

export default GroupJournalPage;