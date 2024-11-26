import React, {useState, useMemo} from "react";
import FileUpload from "./FileUpload";
import EditIcon from '@mui/icons-material/Edit';
import UploadIcon from '@mui/icons-material/Upload';
import "./fileCarousel.scss";
import ButtonField from "../Button";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import { defaultFileMetaData } from "../../../reducers/journalReducer";


const FileCarousel = (props) => {

    const {
        revokeDataURL,
        filesMetaDataArray,
        dispatch,
        onChange,
        setChangesWereMade,
        disabled,
        index,
        editable,
        dispatchActionToChangeFileMetaData,
        dispatchActionToChangeFileLoadStatus,
        dispatchActionToRemoveFile,
    } = props;

    const [editing, setEditing] = useState(false);

    if(!filesMetaDataArray.length) filesMetaDataArray.push(defaultFileMetaData);

    let EditIcon_;
    if(editing) EditIcon_ = UploadIcon;
    else if(!editing) EditIcon_ = EditIcon; 

    const onChange_editButton = () => {
        setEditing(!editing);
    }

    const fileComponentsToDisplay = useMemo(() => {
        const fileComponents = filesMetaDataArray.map((fileMetaData, fileIndex) => {
            if(fileMetaData) {
                return(
                    <FileUpload
                        revokeDataURL={revokeDataURL}
                        dispatchActionToRemoveFile={dispatchActionToRemoveFile}
                        displayDeleteButton={(editing || !editable) && !disabled}
                        label={`file_${fileIndex}`}
                        elementId={`file_${fileIndex}`}
                        index={index}
                        onChange={onChange}
                        fileIndex={fileIndex}
                        key={fileIndex}
                        setChangesWereMade={setChangesWereMade}
                        dispatch={dispatch}
                        dispatchActionToChangeFileMetaData={dispatchActionToChangeFileMetaData}
                        dispatchActionToChangeFileLoadStatus={dispatchActionToChangeFileLoadStatus}
                        fileData={fileMetaData}
                    />
                )
            } else return null
        });
        return fileComponents.filter((component) => !!component);
    },[filesMetaDataArray])

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
                {fileComponentsToDisplay}
            </Grid>
        </Grid>
    )
};

export default FileCarousel;