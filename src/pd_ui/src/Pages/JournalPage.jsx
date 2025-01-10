import React, {useState, useContext, useMemo, useEffect} from "react";
import InputBox from "../components/Fields/InputBox";
import {types} from "../reducers/journalReducer";
import { AppContext } from "../Context";
import DatePickerField from "../components/Fields/DatePicker";
import { monthInMilliSeconds} from "../functionsAndConstants/Constants";
import { milisecondsToNanoSeconds, scrollToTop } from "../functionsAndConstants/Utils";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ButtonField from "../components/Fields/Button";
import FileCarousel from "../components/Fields/fileManger/FileCarousel";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import LockOpenIcon from '@mui/icons-material/LockOpen';
import LockIcon from '@mui/icons-material/Lock';
import SpeedDialField from "../components/Fields/SpeedDialField";
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto';
import DoneIcon from '@mui/icons-material/Done';
import CloseIcon from '@mui/icons-material/Close';
import { mapApiObjectToFrontEndJournalEntriesObject } from "../mappers/journalPageMappers";


const count = 30;

const JournalPage = (props) => {
    const [counter, setCounter] = useState(1);
    const [showUnlockTimeDatePicker, setShowUnlockTimeDatePicker] = useState(false);
    
    const { index } = props;

    const { 
        journalState,
        journalDispatch,
        navigationAndApiState,
        navigationAndApiDispatch,
        setModalIsOpen,
        setModalIsLoading,
    } = useContext(AppContext);

    const journalPageData = useMemo(() => {
        return journalState.journal[index];
    }, [journalState.journal[index]]);


    useEffect(() => { scrollToTop(); },[]);

    useEffect(() => {if(counter % count === 0) sendData()},[counter]);

    const triggerSendDataFunctionAfterReduxStateUpdate = () => setCounter(count);


    const onTextBoxChange = () => setCounter(counter + 1);

    const sendData = async () => {
        journalDispatch({ actionType: types.SET_IS_LOADING, payload: true });
        const entryKey = {entryKey: journalPageData.entryKey}
        const filesMetaData = journalPageData.filesMetaData.filter(fileMetaData => !!fileMetaData.fileName)
        const entryAsApiObject = {
            ...journalPageData,
            timeOfUnlock: journalPageData.timeOfUnlock[0] ? [milisecondsToNanoSeconds(journalPageData.timeOfUnlock[0])] : [],
            timeSubmited: journalPageData.timeSubmited[0] ? [milisecondsToNanoSeconds(journalPageData.timeSubmited[0])] : [],
            timeStarted: milisecondsToNanoSeconds(journalPageData.timeStarted),
            filesMetaData: filesMetaData
        };
        await navigationAndApiState.backendActor.updateJournalEntry( entryKey, entryAsApiObject );
        journalDispatch({ actionType: types.SET_IS_LOADING, payload: false });
        setCounter(1);
    };

    const handleClosePage = async (e) => {   
        if (!journalPageData.submitted) sendData();
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

    const handleAddFile = async () => {
        journalDispatch({ index: index, actionType: types.ADD_JOURNAL_ENTRY_FILE });
        const element = document.querySelector(".fileUploaderWrapperGrid");
        element?.scrollIntoView({behavior: "smooth"});
    };

    const submit = async () => {
        setModalIsLoading(true);
        const entryKey = {entryKey: journalPageData.entryKey}
        await sendData();
        let result = await navigationAndApiState.backendActor.submitJournalEntry(entryKey);
        let journalEntries = result.ok;
        journalEntries = mapApiObjectToFrontEndJournalEntriesObject(journalEntries);
        journalDispatch({ payload: journalEntries, actionType: types.SET_JOURNAL });
        journalDispatch({ actionType: types.CHANGE_PAGE_IS_OPEN, payload: false, index: index });
        setModalIsLoading(false);
        setModalIsOpen(false);
    }

    const speedDialActions = [ 
        {name: "Add Photo/Video", icon: AddAPhotoIcon, onClick: handleAddFile},
        {name: "Submit Entry", icon: DoneIcon, onClick: () => setModalIsOpen(true)}
    ];

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
                        disabled={true}
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
                    label={"Title: "}
                    placeHolder={"Give this journal entry a title you'll remember! :-)"}
                    onChange={onTextBoxChange}
                    onBlur={sendData}
                    disabled={journalPageData.submitted}
                    rows={"1"}
                    index={index}
                    dispatch={journalDispatch}
                    dispatchAction={types.CHANGE_ENTRY_TITLE}
                    value={journalPageData.title}
                />
                <InputBox
                    label={"Location: "}
                    placeHolder={"Where are you creating this entry from?"}
                    onChange={onTextBoxChange}
                    onBlur={sendData}
                    rows={"1"}
                    disabled={journalPageData.submitted}
                    index={index}
                    dispatch={journalDispatch}
                    dispatchAction={types.CHANGE_LOCATION}
                    value={journalPageData.location}
                />
                <InputBox
                    label={"Memoir: "}
                    placeHolder={"What's on your mind? "}
                    onChange={onTextBoxChange}
                    onBlur={sendData}
                    disabled={journalPageData.submitted}
                    rows={"16"}
                    index={index}
                    dispatch={journalDispatch}
                    dispatchAction={types.CHANGE_TEXT}
                    value={journalPageData.text}
                />
            </Grid>
            <Grid 
                className={"fileCarouselWrapperGrid"}
                columns={12} 
                xs={12} 
                md={9} 
                rowSpacing={8} 
                display="flex" 
                justifyContent="center" 
                alignItems="center" 
                flexDirection={"column"}
            >
                <FileCarousel
                    disabled={journalPageData.submitted}
                    onChange={triggerSendDataFunctionAfterReduxStateUpdate}
                    filesMetaDataArray={journalPageData.filesMetaData}
                    revokeDataURL={true}
                    index={index}
                    dispatch={journalDispatch}
                    dispatchActionToAddFile={types.ADD_JOURNAL_ENTRY_FILE}
                    dispatchActionToRemoveFile={types.MARK_JOURNAL_ENTRY_AS_DELETED}
                    dispatchActionToChangeFileMetaData={types.CHANGE_FILE_METADATA}
                    dispatchActionToChangeFileLoadStatus={types.CHANGE_FILE_LOAD_STATUS}
                />
            </Grid>
            {!journalPageData.submitted && <SpeedDialField actions={speedDialActions} position={"right"}/>}
        </>
    )
};

export default JournalPage;

