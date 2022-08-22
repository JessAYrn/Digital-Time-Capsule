import React, {useState, useContext, useMemo, useCallback, useEffect} from "react";
import FileUpload from "./Fields/FileUpload";
import InputBox from "./Fields/InputBox";
import Slider from "./Fields/Slider";
import {types} from "../reducers/journalReducer";
import  {AppContext} from "../App";
import "./JournalPage.scss";
import DatePicker from "./Fields/DatePicker";
import LoadScreen from "./LoadScreen";
import { UI_CONTEXTS } from "../Contexts";
import { MODALS_TYPES } from "../Constants";

const JournalPage = (props) => {

    const [pageChangesMade, setPageChangesMade] = useState(false);
    
    const {
        index
    } = props;

    const { 
        actor,
        journalState,
        dispatch
    } = useContext(AppContext);

    let journalSize = journalState.journal.length;

    const journalPageData = useMemo(() => {
        return journalState.journal[index];
    }, [journalState.journal[index]])

    const mapAndSendEntryToApi = async (entryKey, journalEntry, isDraft) => {

        const entryAsApiObject = [{
            entryTitle: journalEntry.title,
            text: journalEntry.entry,
            location: journalEntry.location,
            date: journalEntry.date,
            lockTime: parseInt(journalEntry.lockTime),
            emailOne: journalEntry.emailOne,
            emailTwo: journalEntry.emailTwo,
            emailThree: journalEntry.emailThree,
            file1MetaData: journalEntry.file1.metaData,
            file2MetaData: journalEntry.file2.metaData,
            draft: isDraft
        }];

        const entryKeyAsApiObject = (entryKey >= 0 && entryKey < journalSize - 1 ) ? [{entryKey: entryKey}] : [];
        
        let result = await actor.updateJournalEntry(
            entryKeyAsApiObject,
            entryAsApiObject
        );
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
            await actor.submitFile(
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
            await actor.submitFile(
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
        if(pageChangesMade){
            dispatch({
                actionType: types.SET_MODAL_STATUS,
                payload: {show: true, which: MODALS_TYPES.exitWithoutSubmit}
            });
        } else {
            dispatch({
                actionType: types.CHANGE_PAGE_IS_OPEN,
                payload: false,
                index: index
            })
        }
    }

    return (
        journalState.isLoading ? 
            <LoadScreen/> : 
                <div className={"journalPageContainer"}>
                    <div className={"logoDiv"}>
                        <img className={'backButtonImg'} src="back-icon.png" alt="Back Button" onClick={(e) => handleClosePage(e)}/>
                        <img className={'logoImg'}src="dtc-logo-black.png" alt="Logo" />
                    </div>
                    <Slider
                        min={0}
                        max={120}
                        setChangesWereMade={setPageChangesMade}
                        disabled={!journalPageData.draft}
                        dispatch={dispatch}
                        dispatchAction={types.CHANGE_LOCK_TIME}
                        index={index}
                        value={(journalPageData) ? journalPageData.lockTime : '3'}
                    />
                    <div className={"journalText"} >
                        <DatePicker
                            label={"Date: "}
                            rows={"1"}
                            disabled={!journalPageData.draft}
                            setChangesWereMade={setPageChangesMade}
                            dispatch={dispatch}
                            dispatchAction={types.CHANGE_DATE}
                            index={index}
                            value={(journalPageData) ? journalPageData.date : ''}
                        />
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

