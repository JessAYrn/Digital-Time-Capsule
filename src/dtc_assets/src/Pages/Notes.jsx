import { NavBar } from "../Components/navigation/NavBar";
import React, { useContext } from 'react';
import { UI_CONTEXTS } from "../Contexts";
import { AppContext } from "../Routes/App";
import './Notes.scss';

const Notes = (props) => {
  const { journalState, dispatch} = useContext(AppContext);
  return (<>
  <NavBar
    walletLink={true}
    journalLink={false}
    accountLink={true}
    dashboardLink={true}
    notificationIcon={true}
    unreadNotifications={journalState.unreadEntries.length}
    context={UI_CONTEXTS.JOURNAL}
  />
  <div className='NotesPage_container'>
    coming soon
  </div>
  </>);
};

export default Notes;
