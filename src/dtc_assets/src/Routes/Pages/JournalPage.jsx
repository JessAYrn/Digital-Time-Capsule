import React, {useState, useContext, useMemo, useCallback, useEffect} from "react";
import InputBox from "../../Components/Fields/InputBox";
import {types} from "../../reducers/journalReducer";
import { modalTypes } from "../../reducers/modalReducer";
import  {AppContext} from "../App";
import "./JournalPage.scss";
import DatePickerField from "../../Components/Fields/DatePicker";
import { MODALS_TYPES, monthInMilliSeconds, NULL_STRING_ALL_LOWERCASE} from "../../functionsAndConstants/Constants";
import { milisecondsToNanoSeconds, scrollToBottom, scrollToTop } from "../../functionsAndConstants/Utils";
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
    const [counter, setCounter] = useState(1);
    const [showUnlockTimeDatePicker, setShowUnlockTimeDatePicker] = useState(false);
    
    const { index } = props;

    const { 
        journalState,
        journalDispatch,
        actorState,
        actorDispatch,
        modalState,
        modalDispatch
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

    useEffect(() => {if(counter % 30 === 0) sendData()},[counter]);


    const onTextBoxChange = () => setCounter(counter + 1);

    const sendData = async () => {
        journalDispatch({ actionType: types.SET_IS_LOADING, payload: true });
        const entryKey = {entryKey: journalPageData.entryKey}
        const entryAsApiObject = {
            ...journalPageData,
            timeOfUnlock: journalPageData.timeOfUnlock[0] ? [milisecondsToNanoSeconds(journalPageData.timeOfUnlock[0])] : [],
            timeSubmited: journalPageData.timeSubmited[0] ? [milisecondsToNanoSeconds(journalPageData.timeSubmited[0])] : [],
            timeStarted: milisecondsToNanoSeconds(journalPageData.timeStarted)
        };
        await actorState.backendActor.updateJournalEntry( entryKey, entryAsApiObject );
        journalDispatch({ actionType: types.SET_IS_LOADING, payload: false });
        setCounter(1);
    };

    // const handleSubmit = useCallback(async () => {
    //     modalDispatch({
    //         actionType: modalTypes.SET_IS_LOADING,
    //         payload: true
    //     });
        
    //     let files = journalPageData.filesMetaData.filter(fileData => fileData.fileName !== 'null' && !fileData.error);
    //     journalPageData.filesMetaData = files;
    //     let filesSuccessfullyUploaded = true;
    //     let result = await actorState.backendActor.submitFiles();
    //     if('err' in result) filesSuccessfullyUploaded = false;
    
    //     let result_1 = await mapAndSendEntryToApi(index, journalPageData, !filesSuccessfullyUploaded);
    //     let entryDataSuccessfullyUploaded = true;
    //     if('err' in result_1) entryDataSuccessfullyUploaded = false;
        
    //     const successfulUpload = filesSuccessfullyUploaded && entryDataSuccessfullyUploaded;
    //     modalDispatch({
    //         actionType: modalTypes.SET_IS_LOADING,
    //         payload: false
    //     });
    //     if(successfulUpload){
    //         journalDispatch({
    //             payload: false,
    //             actionType: types.CHANGE_DRAFT,
    //             index: index
    //         });
    //     } 
    //     modalDispatch({
    //         actionType: modalTypes.SET_MODAL_STATUS,
    //         payload: {
    //             show: true, 
    //             which: MODALS_TYPES.onSubmit, 
    //             success: successfulUpload
    //         }
    //     });

    // }, [journalPageData]);

    const handleClosePage = async (e) => {   
        sendData();
        journalDispatch({
            actionType: types.CHANGE_PAGE_IS_OPEN,
            payload: false,
            index: index
        })
    };

    const toggleLock = async (bool) => {
        if(bool){
            let currentTime = new Date();
            currentTime = currentTime.getTime();
            const oneMonthFromNow = currentTime + monthInMilliSeconds;
            journalDispatch({
                index: index,
                actionType: types.CHANGE_UNLOCK_TIME,
                payload: [oneMonthFromNow]
            });
        } else {
            journalDispatch({
                index: index,
                actionType: types.CHANGE_UNLOCK_TIME,
                payload: []
            });
        }
        setShowUnlockTimeDatePicker(bool);
    };
    console.log(journalPageData);

    const LockIcon_ = useMemo(() => {
        let currentTime = new Date();
        currentTime = currentTime.getTime();
        if(!journalPageData.timeOfUnlock[0] || currentTime > journalPageData.timeOfUnlock[0]) return LockOpenIcon;
        else return LockIcon;
    },[journalPageData.timeOfUnlock])

    const onDatePickerChange_unlockTime = async (e) => {
        const date = new Date(e);
        const dateInMilliseconds = date.getTime();
        journalDispatch({
            index: index,
            actionType: types.CHANGE_UNLOCK_TIME,
            payload: [dateInMilliseconds]
        });
        await sendData();

    }


    // const handleAddFile = async () => {
    //     journalDispatch({
    //         index: index,
    //         actionType: types.ADD_JOURNAL_ENTRY_FILE
    //     });
    // };

    // let filesAreLoading = useMemo(() => {
    //     let filesLoading = false;
    //     journalPageData.filesMetaData.forEach(file => {
    //         if(file.isLoading) filesLoading = file.isLoading;
    //     });
    //     return filesLoading;
    // }, [journalPageData.filesMetaData]);

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
                        onClick={async () => toggleLock(!showUnlockTimeDatePicker)}
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
                journalPageData.timeOfUnlock[0] && 
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
                        value={journalPageData.timeOfUnlock[0]}
                        label={"Unlock Date"}
                        onChange={onDatePickerChange_unlockTime}
                    />
                </Grid>
            }
            {
                journalPageData.timeSubmited[0] && 
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
                        value={journalPageData.timeSubmited[0]}
                        label={"Date Submitted"}
                    />
                </Grid>
            }
            <Grid 
                columns={12} 
                xs={11} md={9} 
                rowSpacing={8} 
                display="flex" 
                justifyContent="center" 
                alignItems="center" 
                flexDirection={"column"}
            >
                <InputBox
                    label={"memoir: "}
                    onChange={onTextBoxChange}
                    onBlur={() => {}}
                    rows={"16"}
                    index={index}
                    dispatch={journalDispatch}
                    dispatchAction={types.CHANGE_TEXT}
                    value={journalPageData.text}
                />
            </Grid>
            {/* 
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

