import { NavBar } from "../../Components/navigation/NavBar";
import React, { useContext } from 'react';
import { UI_CONTEXTS } from "../../functionsAndConstants/Contexts";
import { AppContext } from "../../Context";
import './Notes.scss';

const Notes = (props) => {
  const { journalState, journalDispatch} = useContext(AppContext);
  return (
  <>
    <NavBar
      walletLink={true}
      journalLink={false}
      accountLink={true}
      dashboardLink={true}
      notificationIcon={true}
      unreadNotifications={journalState.notifications.length}
      context={UI_CONTEXTS.JOURNAL}
    />
    <div className='NotesPage_container'>
      coming soon
    </div>
  </>
  );
};

export default Notes;
