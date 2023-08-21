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
        dispatch,
        onChange,
        actorState,
        setChangesWereMade,
        disabled,
        index,
        editable,
        dispatchActionToChangeFileMetaData,
        dispatchActionToChangeFileLoadStatus,
        dispatchActionToRemoveFile,
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
                dispatch,
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

    const onChange_editButton = () => {
        setEditing(!editing);
    }

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
                            displayDeleteButton={(editing || !editable) && !disabled}
                            label={`file_${fileIndex}`}
                            elementId={`file_${fileIndex}`}
                            index={index}
                            onChange={onChange}
                            fileIndex={fileIndex}
                            key={fileIndex}
                            context={UI_CONTEXTS.JOURNAL}
                            setChangesWereMade={setChangesWereMade}
                            dispatch={dispatch}
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