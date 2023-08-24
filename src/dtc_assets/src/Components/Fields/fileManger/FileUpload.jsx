import React, { useContext, useState} from 'react';
import "./FileUpload.scss";
import { mapAndSendFileToApi, getIsWithinProperFormat, updateFileMetadataInStore, getFileURL, createFileId } from './FileManagementTools';
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
import ModalComponent from '../../modal/Modal';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningIcon from '@mui/icons-material/Warning';


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

    
    const { actorState } = useContext(AppContext);
    const [modalProps, setModalProps] = useState({});
    const [modalIsOpen, setModalIsOpen] = useState(false);

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
            uploadedFile, dispatch, 
            dispatchActionToChangeFileMetaData, index, fileIndex,
            setChangesWereMade, actorState
        }
        const formatStatus = await getIsWithinProperFormat(uploadedFile);
        if(!formatStatus.isProperFormat){
            setModalProps({...formatStatus.modalInput})
            setModalIsOpen(true);
            dispatch({ 
                actionType: dispatchActionToChangeFileLoadStatus,
                payload: false,
                index: index,
                fileIndex: fileIndex 
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
            setModalProps({ 
                bigText: "File Upload Unsuccessful.",
                Icon: ErrorOutlineIcon
            })
            setModalIsOpen(true);
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

    return(
        <>
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
            <ModalComponent 
                {...modalProps}
                open={modalIsOpen} 
                handleClose={() => setModalIsOpen(false)} 
                components={[{
                    Component: ButtonField, 
                    props: {
                        active: true,
                        text: "OK",
                        Icon: ThumbUpAltIcon,
                        onClick: () => setModalIsOpen(false)
                    }
                }]}
            />
        </>
    );
}

export default FileUpload;