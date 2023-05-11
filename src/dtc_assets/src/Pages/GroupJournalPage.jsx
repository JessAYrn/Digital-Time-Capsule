import { NavBar } from "../Components/navigation/NavBar";
import React, { useContext } from 'react';
import { UI_CONTEXTS } from "../Contexts";
import { AppContext } from "../Routes/App";
import './GroupJournalPage.scss'

const GroupJournalPage = (props) => {
  const { journalState, dispatch} = useContext(AppContext);
  
//   const openModal = () => {
//     dispatch({
//         actionType: types.SET_MODAL_STATUS,
//         payload: {show: true, which: MODALS_TYPES.onSend}
//     });
// };
  return (
   journalState?.modalStatus?.show ?
    <div >
        <Modal 
            context={UI_CONTEXTS.GROUPJOURNAL}
        />
    </div>:
    <div>
    {
    journalState.isLoading ?
    <LoadScreen/> :
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
    }
    </div>
    
  );
};

export default GroupJournalPage;