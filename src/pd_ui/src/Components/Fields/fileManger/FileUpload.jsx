import React, { useContext, useEffect, useState} from 'react';
import "./FileUpload.scss";
import { mapAndSendFileToApi, getIsWithinProperFormat, updateFileMetadataInStore, createFileId } from './FileManagementTools';
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto';
import DeleteIcon from '@mui/icons-material/Delete';
import { Card, CardMedia } from '@mui/material';
import ButtonField from '../Button';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningIcon from '@mui/icons-material/Warning';
import { fileLoaderHelper } from '../../../functionsAndConstants/loadingFunctions';
import { AppContext } from '../../../Context';


const FileUpload = (props) => {

    const {
        index,
        elementId,
        setChangesWereMade,
        fileIndex,
        disabled,
        dispatchActionToChangeFileMetaData,
        dispatchActionToChangeFileLoadStatus,
        dispatchActionToRemoveFile,
        fileData,
        dispatch,
        displayDeleteButton,
        onChange,
        revokeDataURL
    } = props;

    const { navigationAndApiState, setModalIsOpen, setModalProps } = useContext(AppContext);
    const [errorWhenDisplaying, setErrorWhenDisplaying] = useState(null);

    useEffect(async () => {
        if(errorWhenDisplaying || (fileData.fileName && !fileData.file)){
            await fileLoaderHelper({
                fileData,
                index,
                fileIndex,
                navigationAndApiState, 
                dispatch, 
                dispatchActionToChangeFileLoadStatus,
                dispatchActionToChangeFileMetaData
            });
            setErrorWhenDisplaying(null);
        }
    }, [errorWhenDisplaying, fileData.fileName]);

    const deleteFile = async () => {
        dispatch({
            actionType: dispatchActionToRemoveFile,
            fileIndex: fileIndex,
            index: index
        });
        if(fileData.fileName) navigationAndApiState.backendActor.deleteFile(fileData.fileName);
        onChange();
    };

    const handleUpload = async (e) => {
        dispatch({
            actionType: dispatchActionToChangeFileLoadStatus,
            payload: true,
            fileIndex: fileIndex,
            index: index
        });

        const uploadedFile = e.target.files[0];
        dispatch({ 
            actionType: dispatchActionToChangeFileLoadStatus,
            payload: true,
            index: index,
            fileIndex: fileIndex 
        });
        let inputForDisplayFileFunction = {
            uploadedFile, dispatch, 
            dispatchActionToChangeFileMetaData, index, fileIndex,
            setChangesWereMade, navigationAndApiState
        }
        const formatStatus = await getIsWithinProperFormat(uploadedFile);
        if(!formatStatus.isProperFormat){
            setModalProps({...formatStatus.modalInput})
            setModalIsOpen(true);
            dispatch({
                actionType: dispatchActionToChangeFileLoadStatus,
                payload: false,
                fileIndex: fileIndex,
                index: index
            });
            return;
        }
        const fileURL = URL.createObjectURL(uploadedFile);
        const fileId = createFileId(uploadedFile);
        const responses = await mapAndSendFileToApi({ ...inputForDisplayFileFunction, fileId});
        let hasError = false;
        for(const response of responses) if( "err" in response) hasError = true;

        dispatch({ 
            actionType: dispatchActionToChangeFileLoadStatus,
            payload: false,
            index: index,
            fileIndex: fileIndex 
        });

        if(hasError) {
            navigationAndApiState.backendActor.deleteFile(fileId);
            setModalProps({ bigText: "File Upload Unsuccessful.", Icon: ErrorOutlineIcon})
            setModalIsOpen(true);
            dispatch({
                actionType: dispatchActionToChangeFileLoadStatus,
                payload: false,
                fileIndex: fileIndex,
                index: index
            });
            return;
        }
        updateFileMetadataInStore({ ...inputForDisplayFileFunction, fileURL, fileId});
        if(uploadedFile.type.includes("quicktime")){
            setModalProps({ 
                bigText: "QuickTime Video Detected",
                smallText: "QuickTime Videos are only visible using the Safari Browser.",
                Icon: WarningIcon
            })
            setModalIsOpen(true);
        }
        onChange();
    };

    const onLoad = () => {
        if(revokeDataURL){ 
            setErrorWhenDisplaying(false);
            URL.revokeObjectURL(fileData.file);
        }
    }
    
    return(
        <>
            <Card 
                className={`cardComponent ${elementId}`}
            >
                {
                    displayDeleteButton && !fileData.isLoading &&
                    <Grid className={'deleteFileButtonDiv'}>
                        <ButtonField 
                            className={'DeleteFileButton'}
                            id={elementId} 
                            Icon={DeleteIcon}
                            color={"secondary"}
                            onClick={deleteFile}
                        /> 
                    </Grid>
                }
                {fileData.file && !fileData.isLoading && !errorWhenDisplaying ?
                    <CardMedia
                        component={ fileData.fileType.includes("image") ? "img" : "video" }
                        className='cardMediaComponent'
                        id={`${elementId}_imgTag`}
                        muted
                        onLoad={onLoad}
                        onError={() => setErrorWhenDisplaying(true)}
                        height={500}
                        controls
                        src={fileData.file}
                    /> :
                    <ButtonField 
                        className={'FileUploaderButton'}
                        disabled={disabled}
                        isLoading={fileData.isLoading || errorWhenDisplaying}
                        id={elementId} 
                        text={"Upload Photo / Video"}
                        upload={true}
                        Icon={AddAPhotoIcon}
                        onChange={handleUpload}
                    /> 
                }
            </Card>
        </>
    );
}

export default FileUpload;