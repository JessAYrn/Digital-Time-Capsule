import React, {useState, useContext, useMemo, useCallback, useEffect} from "react";
import InputBox from "../../Components/Fields/InputBox";
import {types} from "../../reducers/journalReducer";
import  {AppContext} from "../App";
import "./JournalPage.scss";
import DatePickerField from "../../Components/Fields/DatePicker";
import { MODALS_TYPES, monthInMilliSeconds, NULL_STRING_ALL_LOWERCASE} from "../../functionsAndConstants/Constants";
import { dateAisLaterThanOrSameAsDateB, getDateAsString, getDateInMilliseconds, milisecondsToNanoSeconds, scrollToBottom, scrollToTop } from "../../functionsAndConstants/Utils";
import { loadJournalData } from "../../functionsAndConstants/loadingFunctions";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ButtonField from "../../Components/Fields/Button";
import FileCarousel from "../../Components/Fields/fileManger/FileCarousel";
import { fileLoaderHelper } from "../../functionsAndConstants/loadingFunctions";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import LockOpenIcon from '@mui/icons-material/LockOpen';
import LockIcon from '@mui/icons-material/Lock';

const JournalPage = (props) => {

    const [pageChangesMade, setPageChangesMade] = useState(false);  
    const [photosLoaded, setPhotosLoaded] = useState(false);
    const [showUnlockTimeDatePicker, setShowUnlockTimeDatePicker] = useState(false);
    
    const { index } = props;

    const { 
        journalState,
        journalDispatch,
        actorState,
        actorDispatch
    } = useContext(AppContext);

    let journalSize = journalState.journal.length;

    const journalPageData = useMemo(() => {
        return journalState.journal[index];
    }, [journalState.journal[index]]);

    // useEffect(async () => {
    //     if(photosLoaded) return;
    //     const promises = [];
    //     journalPageData.filesMetaData.forEach((fileData, fileIndex) => {
    //         if(fileData.fileName === NULL_STRING_ALL_LOWERCASE) return;
    //         if(fileData.file) return;
    //         promises.push(fileLoaderHelper(
    //             fileData, 
    //             fileIndex,
    //             index,
    //             actorState,
    //             journalDispatch,
    //             types.CHANGE_FILE_LOAD_STATUS,
    //             types.SET_FILE
    //         ));
    //     });
    //     if(promises.length) setPhotosLoaded(true);
    //     const result = await Promise.all(promises);
    // },[journalPageData.filesMetaData]);

    useEffect(() => {
        scrollToBottom();
    }, [journalPageData.filesMetaData.length]);

    useEffect(() => { scrollToTop(); },[]);
    
    //marks this page as read so that it no longer shows in the notifications section
    // if(journalPageData.entryKey) actorState.backendActor.markJournalEntryAsRead({entryKey: journalPageData.entryKey});

    // const toggleSwitch = () => {
    //     if(journalPageData.draft){
    //         let isCapsuled = !journalPageData.capsuled
    //         journalDispatch({
    //             actionType: types.CHANGE_CAPSULED,
    //             payload: isCapsuled,
    //             index: index
    //         });
    //         if(isCapsuled) {
    //             journalDispatch({
    //                 actionType: types.CHANGE_UNLOCK_TIME,
    //                 payload: minimumDate,
    //                 index: index
    //             });
    //         } else{
    //             journalDispatch({
    //                 actionType: types.CHANGE_UNLOCK_TIME,
    //                 payload: thisDate,
    //                 index: index
    //             });
    //         };
    //     };
    // };

    // const mapAndSendEntryToApi = async (entryKey, journalEntry, isDraft) => {
    //     let unlockTimeInNanoseconds;
    //     if(journalEntry.unlockTime) {
    //         let unlockTimeInMilliseconds = getDateInMilliseconds(journalEntry.unlockTime);
    //         unlockTimeInNanoseconds = milisecondsToNanoSeconds(unlockTimeInMilliseconds);
    //     } else unlockTimeInNanoseconds = milisecondsToNanoSeconds(parseInt(Date.now()));

    //     const entryAsApiObject = [{
    //         entryTitle: journalEntry.title,
    //         text: journalEntry.entry,
    //         location: journalEntry.location,
    //         date: journalEntry.date,
    //         unlockTime: unlockTimeInNanoseconds,
    //         emailOne: journalEntry.emailOne,
    //         emailTwo: journalEntry.emailTwo,
    //         emailThree: journalEntry.emailThree,
    //         filesMetaData: journalEntry.filesMetaData,
    //         draft: isDraft
    //     }];

    //     const entryKeyAsApiObject = (entryKey >= 0 && entryKey < journalSize - 1 ) ? [{entryKey: entryKey}] : [];
    //     let result = await actorState.backendActor.updateJournalEntry( entryKeyAsApiObject, entryAsApiObject );
    //     let userJournalData = result.ok;
    //     loadJournalData({userJournalData}, journalDispatch, types);
    //     return result;
    // };

    const handleSubmit = useCallback(async () => {
        journalDispatch({
            actionType: types.SET_IS_LOADING,
            payload: true
        });
        
        let files = journalPageData.filesMetaData.filter(fileData => fileData.fileName !== 'null' && !fileData.error);
        journalPageData.filesMetaData = files;
        let filesSuccessfullyUploaded = true;
        let result = await actorState.backendActor.submitFiles();
        if('err' in result) filesSuccessfullyUploaded = false;
    
        let result_1 = await mapAndSendEntryToApi(index, journalPageData, !filesSuccessfullyUploaded);
        let entryDataSuccessfullyUploaded = true;
        if('err' in result_1) entryDataSuccessfullyUploaded = false;
        
        const successfulUpload = filesSuccessfullyUploaded && entryDataSuccessfullyUploaded;
        journalDispatch({
            actionType: types.SET_IS_LOADING,
            payload: false
        });
        if(successfulUpload){
            journalDispatch({
                payload: false,
                actionType: types.CHANGE_DRAFT,
                index: index
            });
        } 
        journalDispatch({
            actionType: types.SET_MODAL_STATUS,
            payload: {
                show: true, 
                which: MODALS_TYPES.onSubmit, 
                success: successfulUpload
            }
        });

    }, [journalPageData]);

    const handleClosePage = (e) => {   
        journalDispatch({
            actionType: types.CHANGE_PAGE_IS_OPEN,
            payload: false,
            index: index
        })
    };

    const toggleLock = () => {
        let showUnlockTimeDatePicker_ = !showUnlockTimeDatePicker;
        if(!showUnlockTimeDatePicker_){
            journalDispatch({
                index: index,
                actionType: types.CHANGE_UNLOCK_TIME,
                payload: null
            });
        } else {
            let currentTime = new Date();
            currentTime = currentTime.getTime();
            const oneMonthFromNow = currentTime + monthInMilliSeconds;
            journalDispatch({
                index: index,
                actionType: types.CHANGE_UNLOCK_TIME,
                payload: oneMonthFromNow
            });
        }
        setShowUnlockTimeDatePicker(showUnlockTimeDatePicker_);
    };

    const LockIcon_ = useMemo(() => {
        let currentTime = new Date();
        currentTime = currentTime.getTime();
        if(!journalPageData.unlockTime || currentTime > journalPageData.unlockTime) return LockOpenIcon;
        else return LockIcon;
    },[journalPageData.unlockTime])

    const onDatePickerChange_unlockTime = (e) => {
        const date = new Date(e);
        const dateInMilliseconds = date.getTime();
        journalDispatch({
            index: index,
            actionType: types.CHANGE_UNLOCK_TIME,
            payload: dateInMilliseconds
        });
    }


    const handleAddFile = async () => {
        journalDispatch({
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
        <>
            <Grid
                columns={12} 
                xs={11}
                md={9}
                display="flex" 
                justifyContent="center" 
                alignItems="center" 
                marginTop={"60px"}
            >
                <Grid
                    columns={12} 
                    xs={6}
                    display="flex" 
                    justifyContent="left" 
                    alignItems="center" 
                >
                    <ButtonField
                        onClick={handleClosePage}
                        Icon={ArrowBackIcon}
                    />
                </Grid>
                <Grid
                    columns={12} 
                    xs={6}
                    display="flex" 
                    justifyContent="right" 
                    alignItems="center" 
                >
                    <ButtonField
                        disabled={journalPageData.submitted}
                        onClick={toggleLock}
                        Icon={LockIcon_}
                    />
                </Grid>
            </Grid>
            <Grid
                columns={12} 
                xs={11}
                md={9}
                display="flex" 
                justifyContent="left" 
                alignItems="center" 
                paddingTop={"0px"}
                paddingBottom={"0px"}
            >
                <DatePickerField
                    value={journalPageData.timeStarted}
                    label={"Date Created"}
                    disabled={true}
                />
            </Grid>
            {
                journalPageData.unlockTime && 
                <Grid
                    columns={12} 
                    xs={11}
                    md={9}
                    display="flex" 
                    justifyContent="left" 
                    alignItems="center" 
                    paddingTop={"0px"}
                    paddingBottom={"0px"}
                >
                    <DatePickerField
                        disablePast={true}
                        value={journalPageData.unlockTime}
                        label={"Unlock Date"}
                        onChange={onDatePickerChange_unlockTime}
                    />
                </Grid>
            }
            {
                journalPageData.timeSubmited && 
                <Grid
                    columns={12} 
                    xs={11}
                    md={9}
                    display="flex" 
                    justifyContent="left" 
                    alignItems="center" 
                    paddingTop={"0px"}
                    paddingBottom={"0px"}
                >
                    <DatePickerField
                        disablePast={true}
                        value={journalPageData.timeSubmited}
                        label={"Date Submitted"}
                    />
                </Grid>
            }
            {/* 
            <div className={"journalText"} >
                <DatePicker
                    id={'entryDate'}
                    label={"Date of Entry: "}
                    rows={"1"}
                    disabled={!journalPageData.draft}
                    setChangesWereMade={setPageChangesMade}
                    dispatch={journalDispatch}
                    dispatchAction={types.CHANGE_DATE}
                    index={index}
                    value={journalPageData.date}
                    max={thisDate}
                />
                <InputBox
                    label={"Location: "}
                    rows={"1"}
                    disabled={!journalPageData.draft}
                    setChangesWereMade={setPageChangesMade}
                    dispatch={journalDispatch}
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
                    dispatch={journalDispatch}
                    dispatchAction={types.CHANGE_ENTRY}
                    index={index}
                    value={(journalPageData) ? journalPageData.entry : ''}
                />
            </div>
            {journalState.journal[index].filesMetaData.length > 0 &&
                <div className='photosSection'>
                    <FileCarousel
                        videoHeight = {'330'}
                        filesMetaDataArray={journalState.journal[index].filesMetaData}
                        journalState={journalState}
                        actorState={actorState}
                        actorDispatch={actorDispatch}
                        setChangesWereMade={setPageChangesMade}
                        editModeDefault={true}
                        disabled={!journalPageData.draft}
                        journalDispatch={journalDispatch}
                        index={index}
                        dispatchActionToAddFile={types.ADD_JOURNAL_ENTRY_FILE}
                        dispatchActionToDeleteFile={types.REMOVE_JOURNAL_ENTRY_FILE}
                        classNameMod={'coverPhoto'}
                        dispatchActionToChangeFileMetaData={types.CHANGE_FILE_METADATA}
                        dispatchActionToChangeFileLoadStatus={types.CHANGE_FILE_LOAD_STATUS}
                        withoutButtons={true}
                    />
                </div>    
            }
            {
                journalPageData.draft &&
                <ButtonField
                    Icon={BiIcons.BiImageAdd}
                    iconSize={25}
                    className={'addFileDiv'}
                    onClick={handleAddFile}
                    withBox={true}
                />
            }
            {
                journalPageData.draft && !filesAreLoading && pageChangesMade &&
                <ButtonField
                    text={'Submit'}
                    className={'submitButtonDiv'}
                    onClick={handleSubmit}
                    withBox={true}
                />
            } */}
        </>
    )
};

export default JournalPage;

