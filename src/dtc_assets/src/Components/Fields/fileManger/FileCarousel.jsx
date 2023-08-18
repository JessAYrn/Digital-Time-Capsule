import React, {useState, useEffect, useMemo} from "react";
import FileUpload from "./FileUpload";
import { UI_CONTEXTS } from "../../../functionsAndConstants/Contexts";
import EditIcon from '@mui/icons-material/Edit';
import UploadIcon from '@mui/icons-material/Upload';
import "./fileCarousel.scss";
import { fileLoaderHelper } from "../../../functionsAndConstants/loadingFunctions";
import ButtonField from "../Button";
import { NULL_STRING_ALL_LOWERCASE } from "../../../functionsAndConstants/Constants";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import { defaultFileMetaData } from "../../../reducers/journalReducer";

const FileCarousel = (props) => {

    const {
        filesMetaDataArray,
        journalDispatch,
        actorDispatch,
        onChange,
        journalState,
        actorState,
        setChangesWereMade,
        editModeDefault,
        disabled,
        index,
        editable,
        dispatchActionToChangeFileMetaData,
        dispatchActionToChangeFileLoadStatus,
        dispatchActionToRemoveFile,
        withoutButtons
    } = props;

    const [editing, setEditing] = useState(false);
    const [photosLoaded, setPhotosLoaded] = useState(false);

    useEffect(async () => {
        if(photosLoaded) return;
        const promises = [];
        filesMetaDataArray.forEach((fileData, fileIndex) => {
            if(fileData.file || !fileData.fileName) return;
            promises.push(fileLoaderHelper({
                fileData, 
                fileIndex,
                index,
                actorState,
                journalDispatch,
                dispatchActionToChangeFileLoadStatus,
                dispatchActionToChangeFileMetaData
            }));
        });
        const result = await Promise.all(promises);
        if(promises.length) setPhotosLoaded(true);
    },[filesMetaDataArray]);

    if(!filesMetaDataArray.length) filesMetaDataArray.push(defaultFileMetaData);

    let EditIcon_;
    if(editing) EditIcon_ = UploadIcon;
    else if(!editing) EditIcon_ = EditIcon; 

    // const toggleEditMode = async () => {
    //     let updatedEditMode = !editMode
    //     setEditMode(updatedEditMode);
    //     if(!updatedEditMode){
    //         journalDispatch({
    //             actionType: types.SET_IS_LOADING,
    //             payload: true
    //         });
    //         let photos = journalState.bio.photos.filter((metaData, i) =>  metaData.fileName !== NULL_STRING_ALL_LOWERCASE);
    //         photos = photos.map(metaData => {
    //             return {
    //                 fileName: metaData.fileName,
    //                 lastModified: metaData.lastModified,
    //                 fileType: metaData.fileType,
    //             };
    //         });
    //         let result = await actorState.backendActor.updatePhotos(photos);
    //         result = result.ok;
    //         journalDispatch({
    //             actionType: types.SET_BIO,
    //             payload: result
    //         });
    //         result = await actorState.backendActor.submitFiles();
    //         journalDispatch({
    //             actionType: types.SET_IS_LOADING,
    //             payload: false
    //         });
    //     } else {
    //         let result = await actorState.backendActor.clearUnsubmittedFiles();
    //     }
    // };

    const onChange_editButton = () => {
        setEditing(!editing);
    }

    // const deleteFile = async (fileIndex, fileMetaData) => {
    //     let fileIsUnsubmitted = fileMetaData.fileIsUnsubmitted;
    //     let fileName = fileMetaData.fileName;
    //     journalDispatch({
    //         actionType: dispatchActionToDeleteFile,
    //         index: index,
    //         fileIndex: fileIndex
    //     });
    //     if(fileIsUnsubmitted){
    //         let result = await actorState.backendActor.deleteUnsubmittedFile(fileName);
    //     } else {
    //         journalDispatch({
    //             actionType: types.SET_IS_LOADING,
    //             payload: true
    //         });
    //         let result = await actorState.backendActor.deleteSubmittedFile(fileName);
    //         if("ok" in result) result = await actorState.backendActor.updateBio({
    //             dob: journalState.bio.dob,
    //             pob: journalState.bio.pob,
    //             name: journalState.bio.name,
    //             dedications: journalState.bio.dedications,
    //             preface: journalState.bio.preface,
    //             photos: journalState.bio.photos
    //         });
    //         journalDispatch({
    //             actionType: types.SET_BIO,
    //             payload: result.ok
    //         });
    //         journalDispatch({
    //             actionType: types.SET_IS_LOADING,
    //             payload: false
    //         });
    //     };
    // };

    // let hasUnsubmittedFiles = useMemo(() => {
    //     let unsubmittedFile = false;
    //     filesMetaDataArray.forEach(file => {
    //         if(file.fileIsUnsubmitted) unsubmittedFile = true;
    //     });
    //     return unsubmittedFile;
    // },[filesMetaDataArray])

    // useEffect(() => {
    //     let carouselDiv = document.getElementById('photoCarouselDiv');
    //     carouselDiv.scrollLeft = carouselDiv.scrollWidth;
    // },[filesMetaDataArray]);
    // let lastFileIsPopulated = filesMetaDataArray[filesMetaDataArray.length-1].fileName !== NULL_STRING_ALL_LOWERCASE;
    // let maxNumberOfFilesReached = filesMetaDataArray.length >= 4;

    return (
        <Grid xs={12} display={"flex"} flexDirection={"column"}>
            { 
                editable && <Grid className={"fileCarouselButtonDiv"}> 
                        <ButtonField
                            className={"fileCarouselButton"}
                            transparentBackground={true}
                            elevation={0}
                            onClick={onChange_editButton}
                            Icon={EditIcon_}
                            active={true}
                            iconSize={'small'}
                        />
                </Grid>
            }
            <Grid 
                className={'fileUploaderWrapperGrid'}
                columns={12} 
                xs={12}
                overflow={{
                    overflowX: "auto",
                    overflowY: "hidden"
                }}
                display={"flex"}
            >
                {filesMetaDataArray.map((fileMetaData, fileIndex) => {
                    return(
                        <FileUpload
                            dispatchActionToRemoveFile={dispatchActionToRemoveFile}
                            displayDeleteButton={editing && !disabled}
                            label={`file_${fileIndex}`}
                            elementId={`file_${fileIndex}`}
                            index={index}
                            onChange={onChange}
                            fileIndex={fileIndex}
                            key={fileIndex}
                            context={UI_CONTEXTS.JOURNAL}
                            setChangesWereMade={setChangesWereMade}
                            dispatch={journalDispatch}
                            dispatchActionToChangeFileMetaData={dispatchActionToChangeFileMetaData}
                            dispatchActionToChangeFileLoadStatus={dispatchActionToChangeFileLoadStatus}
                            fileData={fileMetaData}
                        />
                    )
                })}
            </Grid>
        </Grid>
    )
};

export default FileCarousel;