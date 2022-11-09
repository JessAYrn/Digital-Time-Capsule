import React, {useState, useContext, useMemo, useCallback, useEffect} from "react";
import FileUpload from "./Fields/FileUpload";
import InputBox from "./Fields/InputBox";
import {types} from "../reducers/journalReducer";
import  {AppContext} from "../App";
import "./JournalPage.scss";
import DatePicker from "./Fields/DatePicker";
import LoadScreen from "./LoadScreen";
import { UI_CONTEXTS } from "../Contexts";
import { MODALS_TYPES, monthInMilliSeconds} from "../Constants";
import { getDateAsString } from "../Utils";
import { getDateInMilliseconds, milisecondsToNanoSeconds } from "../Utils";
import { loadJournalData } from "./loadingFunctions";
import Switch from "./Fields/Switch";

const JournalPage = (props) => {

    const [pageChangesMade, setPageChangesMade] = useState(false);
    
    const {
        index
    } = props;

    const { 
        journalState,
        dispatch
    } = useContext(AppContext);

    let journalSize = journalState.journal.length;

    let todaysDate = new Date();
    let todaysDateInMilliseconds = todaysDate.getTime();
    let oneMonthLater = todaysDateInMilliseconds + monthInMilliSeconds;
    let minimumDate = getDateAsString(oneMonthLater);
    let thisDate = getDateAsString();

    const journalPageData = useMemo(() => {
        return journalState.journal[index];
    }, [journalState.journal[index]]);
    
    //marks this page as read so that it no longer shows in the notifications section
    if(journalPageData.entryKey) journalState.actor.readEntry({entryKey: journalPageData.entryKey});

    const toggleSwitch = () => {
        dispatch({
            actionType: types.CHANGE_CAPSULED,
            payload: !journalPageData.capsuled,
            index: index
        });
    };

    const mapAndSendEntryToApi = async (entryKey, journalEntry, isDraft) => {
        let unlockTimeInNanoseconds;
        if(journalEntry.unlockTime) {
            let unlockTimeInMilliseconds = getDateInMilliseconds(journalEntry.unlockTime);
            unlockTimeInNanoseconds = milisecondsToNanoSeconds(unlockTimeInMilliseconds);
        } else unlockTimeInNanoseconds = milisecondsToNanoSeconds(parseInt(Date.now()));

        const entryAsApiObject = [{
            entryTitle: journalEntry.title,
            text: journalEntry.entry,
            location: journalEntry.location,
            date: journalEntry.date,
            unlockTime: unlockTimeInNanoseconds,
            emailOne: journalEntry.emailOne,
            emailTwo: journalEntry.emailTwo,
            emailThree: journalEntry.emailThree,
            file1MetaData: journalEntry.file1.metaData,
            file2MetaData: journalEntry.file2.metaData,
            draft: isDraft
        }];

        const entryKeyAsApiObject = (entryKey >= 0 && entryKey < journalSize - 1 ) ? [{entryKey: entryKey}] : [];
        
        let result = await journalState.actor.updateJournalEntry(
            entryKeyAsApiObject,
            entryAsApiObject
        );
        if('ok' in result){
            loadJournalData(result, dispatch, types);
        }
        return result;

    }

    const handleSubmit = useCallback(async () => {
        dispatch({
            actionType: types.SET_IS_LOADING,
            payload: true
        });
        let result1 = null;
        let result2 = null;
        let result3 = null;
        if(journalPageData.file1.metaData.fileName !== 'null' && !journalPageData.file1.error){
            await journalState.actor.submitFile(
                journalPageData.file1.metaData.fileIndex,
                journalPageData.file1.metaData.fileName
                ).then(res => {
                result1 = true;
                if("err" in res){
                    result1 = false;
                }
            });
        };
        if(journalPageData.file2.metaData.fileName !== 'null' && !journalPageData.file2.error){
            await journalState.actor.submitFile(
                journalPageData.file2.metaData.fileIndex,
                journalPageData.file2.metaData.fileName
                ).then(res => {
                result2 = true;
                if("err" in res){
                    result2 = false;
                }
            });
        };
        await mapAndSendEntryToApi(index, journalPageData, false).then(res => {
            if("err" in res){
                result3 = false;
            } else {
                result3 = true;
            }
        });
        const result = (result1 || (result1 === null)) && 
                       (result2 || (result2 === null)) && 
                       (result3 || (result3 === null));
        dispatch({
            actionType: types.SET_IS_LOADING,
            payload: false
        });
        if(result){
            dispatch({
                payload: false,
                actionType: types.CHANGE_DRAFT,
                index: index
            });
            dispatch({
                actionType: types.SET_MODAL_STATUS,
                payload: {show: true, which: MODALS_TYPES.onSubmit, success: true}
            });
        } else {
            dispatch({
                actionType: types.SET_MODAL_STATUS,
                payload: {show: true, which: MODALS_TYPES.onSubmit, success: false}
            });
        }

    }, [journalPageData]);

    useEffect(() => {
        dispatch({
            actionType: types.SET_HANDLE_PAGE_SUBMIT_FUNCTION,
            payload: handleSubmit
        });
    },[handleSubmit])

    const handleClosePage = (e) => {
        // new pages don't have entryKey's until they've been submitted to the backend. 
        let isNewPage = !journalPageData.entryKey && journalPageData.entryKey !== 0;
        if(!isNewPage) {
            dispatch({
                actionType: types.CHANGE_PAGE_IS_OPEN,
                payload: false,
                index: index
            })
        } else {
            if(pageChangesMade){
                dispatch({
                    actionType: types.SET_MODAL_STATUS,
                    payload: {show: true, which: MODALS_TYPES.exitWithoutSubmit}
                });
            } else {
                dispatch({
                    actionType: types.REMOVE_UNSUBMITTED_PAGE
                });
            }
        }
    }

    return (
        journalState.isLoading ? 
            <LoadScreen/> : 
                <div className={"journalPageContainer"}>
                    <div className={"logoDiv"}>
                        <img className={'backButtonImg'} src="back-icon.png" alt="Back Button" onClick={(e) => handleClosePage(e)}/>
                        <div className="switchDiv">
                            <h5 className='switchH5'>
                                Time Capsule:
                            </h5>
                            <Switch
                                disabled={!journalPageData.draft}
                                active={journalPageData.capsuled}
                                onClick={toggleSwitch}
                            />
                        </div>
                        <img className={'logoImg'}src="dtc-logo-black.png" alt="Logo" />
                    </div>
                    <div className={"journalText"} >
                        <DatePicker
                            id={'entryDate'}
                            label={"Date of Entry: "}
                            rows={"1"}
                            disabled={!journalPageData.draft}
                            setChangesWereMade={setPageChangesMade}
                            dispatch={dispatch}
                            dispatchAction={types.CHANGE_DATE}
                            index={index}
                            value={(journalPageData) ? journalPageData.date : ''}
                            max={thisDate}
                        />
                        {journalPageData.capsuled && 
                        <DatePicker
                            id={'lockDate'}
                            label={"Date to Unlock Entry: "}
                            rows={"1"}
                            disabled={!journalPageData.draft}
                            setChangesWereMade={setPageChangesMade}
                            dispatch={dispatch}
                            dispatchAction={types.CHANGE_UNLOCK_TIME}
                            index={index}
                            value={(journalPageData) ? journalPageData.unlockTime : ''}
                            min={minimumDate}
                        />}
                        <InputBox
                            label={"Location: "}
                            rows={"1"}
                            disabled={!journalPageData.draft}
                            setChangesWereMade={setPageChangesMade}
                            dispatch={dispatch}
                            dispatchAction={types.CHANGE_LOCATION}
                            index={index}
                            value={(journalPageData) ? journalPageData.location : ''}
                        />
                        <InputBox
                            divClassName={"entry"}
                            label={"Entry: "}
                            rows={"59"}
                            disabled={!journalPageData.draft}
                            setChangesWereMade={setPageChangesMade}
                            dispatch={dispatch}
                            dispatchAction={types.CHANGE_ENTRY}
                            index={index}
                            value={(journalPageData) ? journalPageData.entry : ''}
                        />
                    </div>
                    <div className='fileContainer'>
                        <FileUpload
                            label={'file1'}
                            elementId={'file1'}
                            disabled={!journalPageData.draft}
                            fileIndex={journalPageData.file1.metaData.fileIndex}
                            context={UI_CONTEXTS.JOURNAL}
                            setChangesWereMade={setPageChangesMade}
                            index={index}
                        />
                    </div>
                    <div className='fileContainer'>
                        <FileUpload
                            label={'file2'}
                            elementId={'file2'}
                            disabled={!journalPageData.draft}
                            fileIndex={journalPageData.file2.metaData.fileIndex}
                            context={UI_CONTEXTS.JOURNAL}
                            setChangesWereMade={setPageChangesMade}
                            index={index}
                        />
                    </div>
                    <div className={"submitButtonDiv"}>
                        <button 
                            className={'button'} 
                            type="submit" 
                            onClick={handleSubmit} 
                            disabled={!journalPageData.draft || 
                                journalPageData.file1.isLoading || 
                                journalPageData.file2.isLoading
                            }
                        > 
                            Submit 
                        </button>
                    </div>
                    
                </div>
    )
};

export default JournalPage;

