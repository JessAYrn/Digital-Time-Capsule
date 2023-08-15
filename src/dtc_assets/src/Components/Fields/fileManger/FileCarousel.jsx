import React, {useState, useEffect, useMemo} from "react";
import FileUpload from "./FileUpload";
import { UI_CONTEXTS } from "../../../functionsAndConstants/Contexts";
import "./fileCarousel.scss";

import ButtonField from "../Button";
import Grid from "@mui/material/Unstable_Grid2/Grid2";

const FileCarousel = (props) => {

    const {
        filesMetaDataArray,
        journalDispatch,
        actorDispatch,
        dispatchActionToAddFile,
        journalState,
        actorState,
        dispatchActionToDeleteFile,
        setChangesWereMade,
        editModeDefault,
        disabled,
        index,
        dispatchActionToChangeFileMetaData,
        dispatchActionToChangeFileLoadStatus,
        videoHeight,
        withoutButtons
    } = props;

    const [editMode, setEditMode] = useState(editModeDefault);

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

    const addFile = () => {
        journalDispatch({
            actionType: dispatchActionToAddFile
        });
    };

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
        <Grid 
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
                        label={`file_${fileIndex}`}
                        elementId={`file_${fileIndex}`}
                        disabled={ disabled}
                        index={index}
                        fileIndex={fileIndex}
                        key={fileIndex}
                        context={UI_CONTEXTS.JOURNAL}
                        setChangesWereMade={setChangesWereMade}
                        dispatch={journalDispatch}
                        dispatchActionToChangeFileMetaData={dispatchActionToChangeFileMetaData}
                        dispatchActionToChangeFileLoadStatus={dispatchActionToChangeFileLoadStatus}
                        fileData={fileMetaData}
                        videoHeight={videoHeight}
                    />
                )
            })}
        </Grid>
    )
};

export default FileCarousel;