import React, { useContext} from 'react';
import "./FileUpload.scss";
import { MODALS_TYPES } from '../../../functionsAndConstants/Constants';
import { mapAndSendFileToApi, getIsWithinProperFormat, updateFileMetadataInStore, getFileURL, createFileId } from './FileManagementTools';
import { modalTypes } from '../../../reducers/modalReducer';
import { AppContext as AccountContext} from '../../../Routes/Account';
import { AppContext as HomePageContext} from '../../../Routes/HomePage';
import { AppContext as JournalContext} from '../../../Routes/App';
import { AppContext as WalletContext} from '../../../Routes/Wallet';
import { AppContext as TreasuryContext} from '../../../Routes/Treasury';
import { AppContext as GroupJournalContext} from '../../../Routes/GroupJournal';
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto';
import DeleteIcon from '@mui/icons-material/Delete';
import { retrieveContext } from '../../../functionsAndConstants/Contexts';
import { Card, CardMedia } from '@mui/material';
import ButtonField from '../Button';
import Grid from '@mui/material/Unstable_Grid2/Grid2';

const FileUpload = (props) => {
    const {
        index,
        elementId,
        setChangesWereMade,
        fileIndex,
        context,
        disabled,
        dispatchActionToChangeFileMetaData,
        dispatchActionToChangeFileLoadStatus,
        dispatchActionToRemoveFile,
        fileData,
        dispatch,
        displayDeleteButton,
        onChange
    } = props;
            
    let contexts = {
        WalletContext,
        JournalContext,
        HomePageContext,
        AccountContext,
        TreasuryContext,
        GroupJournalContext
    };

    let AppContext = retrieveContext(contexts, context);

    
    const { actorState, modalDispatch } = useContext(AppContext);

    const deleteFile = async () => {
        dispatch({
            actionType: dispatchActionToRemoveFile,
            fileIndex: fileIndex,
            index: index
        });
        if(fileData.fileName) actorState.backendActor.deleteFile(fileData.fileName);
        onChange();
    };

    const handleUpload = async (e) => {
        const uploadedFile = e.target.files[0];
        dispatch({ 
            actionType: dispatchActionToChangeFileLoadStatus,
            payload: true,
            index: index,
            fileIndex: fileIndex 
        });
        let inputForDisplayFileFunction = {
            uploadedFile, dispatch, modalDispatch, 
            dispatchActionToChangeFileMetaData, index, fileIndex,
            setChangesWereMade, actorState
        }
        const formatStatus = await getIsWithinProperFormat(uploadedFile);
        if(!formatStatus.isProperFormat){
            modalDispatch({
                actionType: modalTypes.SET_MODAL_STATUS,
                payload: formatStatus.modalDispatchInput
            });
            return;
        }
        const fileURL = await getFileURL(uploadedFile);
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
            actorState.backendActor.deleteFile(fileId);
            modalDispatch({
                actionType: modalTypes.SET_MODAL_STATUS, 
                payload: {
                    show: true, 
                    which: MODALS_TYPES.error,
                    message: "File Upload Unsuccessful"
                }
            });
            return;
        }
        updateFileMetadataInStore({ ...inputForDisplayFileFunction, fileURL, fileId});
        if(uploadedFile.type.includes("quicktime")){
            modalDispatch({
                actionType: modalTypes.SET_MODAL_STATUS,
                payload: { show: true,  which: MODALS_TYPES.quicktimeVideoDetected }
            });
        }
        onChange();
    };

    return(
        <Card 
            className={`cardComponent ${elementId}`}
        >
            {fileData.file || fileData.isLoading ?
                <>
                    {
                        displayDeleteButton && !fileData.isLoading &&
                            <Grid className={'deleteFileButtonDiv'}>
                                <ButtonField 
                                    className={'DeleteFileButton'}
                                    id={elementId} 
                                    Icon={DeleteIcon}
                                    active={true}
                                    onClick={deleteFile}
                                /> 
                            </Grid>
                    }
                    <CardMedia
                        component={
                            fileData.isLoading ? 
                            "img" : 
                            fileData.fileType.includes("image") ? 
                            "img" : 
                            "video"
                        }
                        className='cardMediaComponent'
                        autoPlay
                        muted
                        height={500}
                        controls
                        src={fileData.isLoading ? "../../../../assets/Loading.gif" : fileData.file}
                    /> 
                </>:
                <ButtonField 
                    className={'FileUploaderButton'}
                    disabled={disabled}
                    id={elementId} 
                    text={"Upload Photo / Video"}
                    upload={true}
                    Icon={AddAPhotoIcon}
                    onChange={handleUpload}
                /> 
            }
        </Card>
    );
}

export default FileUpload;