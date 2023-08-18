import JournalPage from "./JournalPage";
import React, { useContext, useEffect, useState } from "react";
import {types} from "../../reducers/journalReducer";
import "./Journal.scss";
import { AppContext } from "../App";
import InputBox from "../../Components/Fields/InputBox";
import SpeedDialField, { SpeedDialPositions } from '../../Components/Fields/SpeedDialField'
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import LoadScreen from "./LoadScreen";
import { Modal } from "./modalContent/Modal";
import { NavBar } from "../../Components/navigation/NavBar";
import { UI_CONTEXTS } from "../../functionsAndConstants/Contexts";
import { getHighestEntryKey, milisecondsToNanoSeconds, scrollTo_X, scrollTo_X } from "../../functionsAndConstants/Utils";
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto';
import FileCarousel, { scrollRight } from "../../Components/Fields/fileManger/FileCarousel";
import DataTable from "../../Components/Fields/Table";
import DatePickerField from "../../Components/Fields/DatePicker";
import "../../SCSS/scrollable.scss";
import "../../SCSS/contentContainer.scss";
import { journalPagesTableColumns, mapRequestsForAccessToTableRows } from "../../mappers/journalPageMappers";
import { mapApiObjectToFrontEndJournalEntriesObject } from "../../mappers/journalPageMappers";

const count = 30


const Journal = (props) => {

    const { journalState, journalDispatch, actorState, actorDispatch, modalState, modalDispatch} = useContext(AppContext);
    const [counter, setCounter] = useState(1);

    const sendData = async () => {
        journalDispatch({
            actionType: types.SET_IS_LOADING,
            payload: true
        })
        const photos = journalState.bio.photos.filter(file => !!file.fileName);
        const result = await actorState.backendActor.updateBio({
            dob: journalState.bio.dob[0] ? [milisecondsToNanoSeconds(journalState.bio.dob[0])] : [],
            pob: journalState.bio.pob,
            name: journalState.bio.name,
            dedications: journalState.bio.dedications,
            preface: journalState.bio.preface,
            photos: photos
        });
        journalDispatch({
            actionType: types.SET_IS_LOADING,
            payload: false
        })
        setCounter(1);
    };

    useEffect(() => {if(counter % count === 0) sendData()},[counter]);


    const onTextBoxChange = () => setCounter(counter + 1);

    const onDatePickerChange = async (e) => {
        const date = new Date(e);
        const dateInMilliseconds = date.getTime();
        journalDispatch({
            actionType: types.CHANGE_DOB,
            payload: [dateInMilliseconds]
        });
        await sendData();
    }

    const triggerSendDataFunctionAfterReduxStateUpdate = () => {setCounter(count)};

    const openPage = async (props) => {
        const {entryKey, locked} = props;
        const index = journalState.journal.findIndex((page) => page.entryKey === entryKey);
        if(!locked){
            journalDispatch({
                actionType: types.CHANGE_PAGE_IS_OPEN,
                payload: true,
                index: index
            });
        }
    };

    const addFile = () => {
        journalDispatch({ actionType: types.ADD_COVER_PHOTO });
        const element = document.querySelector(".fileUploaderWrapperGrid");
        element?.scrollIntoView({behavior: "smooth"});
    };

    const createJournalPage = async () => {
        //Ensures that there are no unsubmitted entries left over from a previous post
        const result = await actorState.backendActor.createJournalEntry();
        
        let journalEntries = result.ok;
        journalEntries = mapApiObjectToFrontEndJournalEntriesObject(journalEntries);
        const entryKey = getHighestEntryKey(journalEntries);
        journalDispatch({ payload: journalEntries, actionType: types.SET_JOURNAL });
        openPage({entryKey: entryKey, locked: false});
    };

    const speedDialActions = [
        {name: "New Jorunal Entry", icon: NoteAddIcon , onClick: createJournalPage},
        {name: "New Cover Photo", icon: AddAPhotoIcon, onClick: addFile}
    ]

    const getIndexOfVisiblePage = () => {
        return journalState.journal.findIndex(page => page.isOpen === true);
    }

    return(
        modalState.modalStatus.show ?
        <Modal context={UI_CONTEXTS.JOURNAL} index={getIndexOfVisiblePage()}/> :
        modalState.isLoading ? 
        <LoadScreen/> : 
        <Grid 
            container 
            className={'container_journal'} 
            columns={12} 
            xs={12} 
            rowSpacing={8} 
            display="flex" 
            justifyContent="center" 
            alignItems="center" 
            flexDirection={"column"}
        >
            <NavBar context={UI_CONTEXTS.JOURNAL} isLoading={journalState.isLoading}/>
            {(getIndexOfVisiblePage() >=0) ?
            <JournalPage index={getIndexOfVisiblePage()}/> :
            <>
                <Grid 
                    className={"firstWritingSectionWrapperGrid"}
                    columns={12} 
                    xs={11} 
                    md={9} 
                    rowSpacing={0} 
                    display="flex" 
                    justifyContent="center" 
                    alignItems="center" 
                    flexDirection={"column"} 
                    marginTop={"20px"}
                >
                    <InputBox
                        label={"This Journal Belongs To: "}
                        rows={"1"}
                        editable={true}
                        dispatch={journalDispatch}
                        onChange={onTextBoxChange}
                        onBlur={sendData}
                        dispatchAction={types.CHANGE_NAME}
                        value={journalState.bio.name}
                    />
                    <Grid xs={12} display={"flex"} justifyContent={"left"} alignItems={"center"}>
                        <DatePickerField
                            value={journalState.bio.dob[0]}
                            label={"Date Of Birth"}
                            onChange={onDatePickerChange}
                            editable={true}
                            md={11}
                            xs={11}
                        />
                    </Grid>
                    <InputBox
                        label={"Place of Birth: "}
                        rows={"1"}
                        editable={true}
                        onChange={onTextBoxChange}
                        onBlur={sendData}
                        dispatch={journalDispatch}
                        dispatchAction={types.CHANGE_POB}
                        value={journalState.bio.pob}
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
                    editable={true}
                    onChange={triggerSendDataFunctionAfterReduxStateUpdate}
                    filesMetaDataArray={journalState.bio.photos}
                    journalState={journalState}
                    actorState={actorState}
                    actorDispatch={actorDispatch}
                    journalDispatch={journalDispatch}
                    dispatchActionToAddFile={types.ADD_COVER_PHOTO}
                    dispatchActionToRemoveFile={types.REMOVE_COVER_PHOTO}
                    classNameMod={'coverPhoto'}
                    dispatchActionToChangeFileMetaData={types.CHANGE_FILE_METADATA_JOURNAL_COVER_PAGE}
                    dispatchActionToChangeFileLoadStatus={types.CHANGE_FILE_LOAD_STATUS_JOURNAL_COVER_PAGE}
                />
                </Grid>
                <Grid 
                    className={"secondWritingSectionWrapperGrid"}
                    columns={12} 
                    xs={11} md={9} 
                    rowSpacing={8} 
                    display="flex" 
                    justifyContent="center" 
                    alignItems="center" 
                    flexDirection={"column"}
                >
                    <InputBox
                        label={"Dedications: "}
                        editable={true}
                        onChange={onTextBoxChange}
                        onBlur={sendData}
                        rows={"8"}
                        dispatch={journalDispatch}
                        dispatchAction={types.CHANGE_DEDICATIONS}
                        value={journalState.bio.dedications}
                    />
                    <InputBox
                        label={"Preface: "}
                        editable={true}
                        onChange={onTextBoxChange}
                        onBlur={sendData}
                        rows={"16"}
                        dispatch={journalDispatch}
                        dispatchAction={types.CHANGE_PREFACE}
                        value={journalState.bio.preface}
                    />
                </Grid>
                <Grid 
                    className={'DataTableWrapperGrid'}
                    columns={12} 
                    xs={11} md={9} 
                    rowSpacing={8} 
                    display="flex" 
                    justifyContent="center" 
                    alignItems="center" 
                    flexDirection={"column"}
                >
                    <DataTable
                        onRowClick={openPage}
                        transparent={true}
                        columns={journalPagesTableColumns}
                        rows={mapRequestsForAccessToTableRows(journalState.journal)}
                    />
                </Grid>
                <SpeedDialField
                    actions={speedDialActions}
                    position={SpeedDialPositions}
                />
            </>}  
        </Grid>
    );

}

export default Journal;