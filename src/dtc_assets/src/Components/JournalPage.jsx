import React, {useState, useContext, useMemo, useCallback, useEffect} from "react";
import FileUpload from "./Fields/fileManger/FileUpload";
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
import { loadJournalDataResponseAfterSubmit } from "./loadingFunctions";
import * as RiIcons from 'react-icons/ri';
import * as BiIcons from 'react-icons/bi';
import { IconContext } from 'react-icons/lib';
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
            filesMetaData: journalEntry.filesMetaData,
            draft: isDraft
        }];

        const entryKeyAsApiObject = (entryKey >= 0 && entryKey < journalSize - 1 ) ? [{entryKey: entryKey}] : [];
        
        let result = await journalState.actor.updateJournalEntry(
            entryKeyAsApiObject,
            entryAsApiObject
        );
        if('ok' in result){
            loadJournalDataResponseAfterSubmit(result, dispatch, types);
        }
        return result;

    };

    const handleSubmit = useCallback(async () => {
        dispatch({
            actionType: types.SET_IS_LOADING,
            payload: true
        });
        
        let files = journalPageData.filesMetaData.filter(fileData => fileData.fileName !== 'null' && !fileData.error);
        journalPageData.filesMetaData = files;
        let filesSuccessfullyUploaded = true;
        let result = await journalState.actor.submitFiles();
        if('err' in result) filesSuccessfullyUploaded = false;
    
        let result_1 = await mapAndSendEntryToApi(index, journalPageData, !filesSuccessfullyUploaded);
        let entryDataSuccessfullyUploaded = true;
        if('err' in result_1) entryDataSuccessfullyUploaded = false;
        
        const successfulUpload = filesSuccessfullyUploaded && entryDataSuccessfullyUploaded;
        dispatch({
            actionType: types.SET_IS_LOADING,
            payload: false
        });
        if(successfulUpload){
            dispatch({
                payload: false,
                actionType: types.CHANGE_DRAFT,
                index: index
            });
        } 
        dispatch({
            actionType: types.SET_MODAL_STATUS,
            payload: {
                show: true, 
                which: MODALS_TYPES.onSubmit, 
                success: successfulUpload
            }
        });

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
    };

    const handleDeleteFile = async () => {
        dispatch({
            index: index,
            actionType: types.REMOVE_JOURNAL_ENTRY_FILE
        });
        let fileCount = journalPageData.filesMetaData.length;
        let fileName = journalPageData.filesMetaData[fileCount-1].fileName;
        let result = await journalState.actor.deleteUnsubmittedFile(fileName);
    };

    const handleAddFile = async () => {
        dispatch({
            index: index,
            actionType: types.ADD_JOURNAL_ENTRY_FILE
        });
    };

    let filesAreLoading = useMemo(() => {
        let filesLoading = false;
        journalPageData.filesMetaData.forEach(file => {
            if(file.isLoading) filesLoading = file.isLoading;
        });
        return filesLoading;
    }, [journalPageData.filesMetaData]);

    return (
        journalState.isLoading ? 
            <LoadScreen/> : 
                <div className={"journalPageContainer"}>
                    <div className={"logoDiv"}>
                        <div className={'backButtonDiv'}>
                            <IconContext.Provider value={{ size: '25px'}}>
                                <RiIcons.RiArrowGoBackLine onClick={handleClosePage}/>
                            </IconContext.Provider>
                        </div>
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
                            rows={"30"}
                            disabled={!journalPageData.draft}
                            setChangesWereMade={setPageChangesMade}
                            dispatch={dispatch}
                            dispatchAction={types.CHANGE_ENTRY}
                            index={index}
                            value={(journalPageData) ? journalPageData.entry : ''}
                        />
                    </div>
                    {journalPageData.filesMetaData.map((metaData, fileIndex) => {
                        return(
                            <div className='fileContainer'>
                                {
                                    (journalPageData.filesMetaData.length-1 === fileIndex) && journalPageData.draft &&
                                    <div className={'removeFileDiv'}>
                                        <IconContext.Provider value={{ size: '25px', color: 'red'}}>
                                            <RiIcons.RiDeleteBin2Line onClick={handleDeleteFile}/>
                                        </IconContext.Provider>
                                    </div>
                                }
                                <FileUpload
                                    label={`file_${metaData.fileIndex}`}
                                    elementId={`file_${metaData.fileIndex}`}
                                    disabled={!journalPageData.draft}
                                    fileIndex={fileIndex}
                                    key={fileIndex}
                                    context={UI_CONTEXTS.JOURNAL}
                                    setChangesWereMade={setPageChangesMade}
                                    index={index}
                                />
                            </div>
                        )
                    })}
                    {
                        journalPageData.draft &&
                        <div className={'addFileDiv'}>
                            <IconContext.Provider value={{ size: '25px'}}>
                                <BiIcons.BiImageAdd onClick={handleAddFile}/>
                            </IconContext.Provider>
                        </div>
                    }
                    {
                        journalPageData.draft && !filesAreLoading && pageChangesMade &&
                        <div className={"submitButtonDiv"} onClick={handleSubmit}>
                                Submit 
                        </div>
                    }
                </div>
    )
};

export default JournalPage;

