import React, { useContext, useReducer } from 'react'
import ButtonField from './Fields/Button';
import * as GiIcons from 'react-icons/gi';
import './JournalButton.scss'
import * as BiIcons from 'react-icons/bi'
import journalReducer, {initialState, types} from '../reducers/journalReducer';
import { AppContext } from '../Routes/App';
import { JOURNAL_TABS } from '../Constants';
// TfiNotepad
// SlNotebook
// BiNotepad


const JournalButtons = () => {
  // const [journalState, dispatch] = useReducer(journalReducer, initialState);
  const {
    journalState,
    dispatch
  } = useContext(AppContext);
  

  let changeTab=(journalTab)=>{
    dispatch({
      actionType:types.SET_JOURNAL_TAB,
      payload:journalTab
    })
  }

  return (

    <div className='container_journal_buttons'>
        
        <ButtonField
        Icon={GiIcons.GiStabbedNote}
        iconSize={25}
        iconColor={'#fff'}
        className={journalState.journalPageTab===JOURNAL_TABS.diaryTab?'journalButtonOne active':'journalButtonOne'}
        onClick={()=>changeTab(JOURNAL_TABS.diaryTab)}
        withBox={true}
        />
        
        <ButtonField
        Icon={BiIcons.BiNotepad}
        iconSize={25}
        iconColor={'#fff'}
        // className={'journalButtonTwo'}
        className={journalState.journalPageTab!==JOURNAL_TABS.diaryTab?'journalButtonTwo active':'journalButtonTwo'}
        onClick={()=>changeTab(JOURNAL_TABS.notesTab)}
        withBox={true}
        />
    </div>
    
  )
}

export default JournalButtons;