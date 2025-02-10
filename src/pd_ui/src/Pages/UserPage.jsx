import JournalPage from "./JournalPage";
import React, { useContext, useEffect, useState } from "react";
import {types} from "../reducers/userReducer";
import { AppContext } from "../Context";
import InputBox from "../components/Fields/InputBox";
import SpeedDialField from '../components/Fields/SpeedDialField'
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import { getHighestEntryKey, milisecondsToNanoSeconds } from "../functionsAndConstants/Utils";
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto';
import FileCarousel from "../components/Fields/fileManger/FileCarousel";
import DataTable from "../components/Fields/Table";
import DatePickerField from "../components/Fields/DatePicker";
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { journalPagesTableColumns, mapRequestsForAccessToTableRows } from "../mappers/journalPageMappers";
import { mapApiObjectToFrontEndJournalEntriesObject } from "../mappers/journalPageMappers";

const count = 30


const UserPage = (props) => {

    const { userState, userDispatch, navigationAndApiState, navigationAndApiDispatch, setModalIsOpen, setModalIsLoading, setModalProps} = useContext(AppContext);
    const [counter, setCounter] = useState(1);

    const sendData = async () => {
        userDispatch({
            actionType: types.SET_IS_LOADING,
            payload: true
        })
        const photos = userState.bio.photos.filter(file => file && !!file.fileName);
        const result = await navigationAndApiState.backendActor.updateBio({
            dob: userState.bio.dob[0] ? [milisecondsToNanoSeconds(userState.bio.dob[0])] : [],
            pob: userState.bio.pob,
            name: userState.bio.name,
            dedications: userState.bio.dedications,
            preface: userState.bio.preface,
            photos: photos
        });
        userDispatch({
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
        userDispatch({
            actionType: types.CHANGE_DOB,
            payload: [dateInMilliseconds]
        });
        await sendData();
    }

    const triggerSendDataFunctionAfterReduxStateUpdate = () => {setCounter(count)};

    const openPage = async (props) => {
        const {entryKey, locked} = props;
        const index = userState.userData.findIndex((page) => page.entryKey === entryKey);
        if(!locked){
            userDispatch({
                actionType: types.CHANGE_PAGE_IS_OPEN,
                payload: true,
                index: index
            });
        }
    };

    const addFile = () => {
        userDispatch({ actionType: types.ADD_COVER_PHOTO });
        const element = document.querySelector(".fileUploaderWrapperGrid");
        element?.scrollIntoView({behavior: "smooth"});
    };

    const createJournalPage = async () => {
        setModalIsLoading(true);
        setModalIsOpen(true);
        const result = await navigationAndApiState.backendActor.createJournalEntry();
        if('err' in result) {
            setModalProps({
                flexDirection: "column",
                components: [
                    <Typography padding={"10px"} variant='h6' children={"Your data canisgter is full."} />,
                    <ErrorOutlineIcon/>,
                    <Typography padding={"10px"} children={"You'll have to purchase another canister for storage"} />,
                ]
            });
            setModalIsLoading(false)
            return;
        }
        let journalEntries = result.ok;
        journalEntries = mapApiObjectToFrontEndJournalEntriesObject(journalEntries);
        const entryKey = getHighestEntryKey(journalEntries);
        userDispatch({ payload: journalEntries, actionType: types.SET_JOURNAL });
        openPage({entryKey: entryKey, locked: false});
        setModalIsOpen(false);
        setModalIsLoading(false)
    };

    const speedDialActions = [
        {name: "New Jorunal Entry", icon: NoteAddIcon , onClick: createJournalPage},
        {name: "New Cover Photo", icon: AddAPhotoIcon, onClick: addFile}
    ]

    const getIndexOfVisiblePage = () => {
        return userState.userData.findIndex(page => page.isOpen === true);
    }

    return(
        <>
        <Grid 
            container 
            columns={12} 
            xs={12} 
            rowSpacing={8} 
            display="flex" 
            justifyContent="center" 
            alignItems="center" 
            flexDirection={"column"}
        >
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
                        onChange={onTextBoxChange}
                        value={userState.bio.name}
                    />
                    <DatePickerField
                        value={userState.bio.dob[0]}
                        label={"Date Of Birth"}
                        onChange={onDatePickerChange}
                    />
                    <InputBox
                        label={"Place of Birth: "}
                        rows={"1"}
                        onChange={onTextBoxChange}
                        value={userState.bio.pob}
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
                    revokeDataURL={false}
                    onChange={triggerSendDataFunctionAfterReduxStateUpdate}
                    filesMetaDataArray={userState.bio.photos}
                    userState={userState}
                    navigationAndApiDispatch={navigationAndApiDispatch}
                    dispatch={userDispatch}
                    dispatchActionToAddFile={types.ADD_COVER_PHOTO}
                    dispatchActionToRemoveFile={types.MARK_COVER_PHOTO_AS_DELETED}
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
                        onChange={onTextBoxChange}
                        rows={"8"}
                        value={userState.bio.dedications}
                    />
                    <InputBox
                        label={"Preface: "}
                        onChange={onTextBoxChange}
                        rows={"16"}
                        value={userState.bio.preface}
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
                        rows={mapRequestsForAccessToTableRows(userState.userData)}
                    />
                </Grid>
                <SpeedDialField actions={speedDialActions} position={"right"}/>
            </>}  
        </Grid>
        </>
    );

}

export default UserPage;