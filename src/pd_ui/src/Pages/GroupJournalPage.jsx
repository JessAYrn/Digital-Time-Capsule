import { NavBar } from "../Components/navigation/NavBar";
import React, { useContext } from 'react';
import { AppContext } from "../Context";

const GroupJournalPage = (props) => {
  const { homePageState} = useContext(AppContext);

  return (
    <div>
      <NavBar />
      <div className=''>
        coming soon
      </div>
    </div> 
  );
};

export default GroupJournalPage;