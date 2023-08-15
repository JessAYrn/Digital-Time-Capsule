import React, { useContext} from 'react';
import "./FileUpload.scss";
import { MODALS_TYPES } from '../../../functionsAndConstants/Constants';
import { mapAndSendFileToApi, getIsWithinProperFormat, updateFileMetadataInStore, getFileURL } from './FileManagementTools';
import { modalTypes } from '../../../reducers/modalReducer';
import { AppContext as AccountContext} from '../../../Routes/Account';
import { AppContext as HomePageContext} from '../../../Routes/HomePage';
import { AppContext as JournalContext} from '../../../Routes/App';
import { AppContext as WalletContext} from '../../../Routes/Wallet';
import { AppContext as TreasuryContext} from '../../../Routes/Treasury';
import { AppContext as GroupJournalContext} from '../../../Routes/GroupJournal';
import UploadIcon from '@mui/icons-material/Upload';
import { retrieveContext } from '../../../functionsAndConstants/Contexts';
import { Card, CardMedia } from '@mui/material';
import ButtonField from '../Button';

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
        videoHeight,
        fileData,
        dispatch,
        reduxState
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
        let fileId = updateFileMetadataInStore({ ...inputForDisplayFileFunction, fileURL});
        await mapAndSendFileToApi({ ...inputForDisplayFileFunction, fileId});
        dispatch({ 
            actionType: dispatchActionToChangeFileLoadStatus,
            payload: false,
            index: index,
            fileIndex: fileIndex 
        });
        if(uploadedFile.type.includes("quicktime")){
            modalDispatch({
                actionType: modalTypes.SET_MODAL_STATUS,
                payload: { show: true,  which: MODALS_TYPES.quicktimeVideoDetected }
            });
        }
    };

    return(
        <Card 
            className='cardComponent'
        >
            {fileData.file ?
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
                /> :
                <ButtonField 
                    className={'FileUploaderButton'}
                    disabled={disabled}
                    id={elementId} 
                    text={"Upload Photo / Video"}
                    type="file" 
                    upload={true}
                    Icon={UploadIcon}
                    onChange={handleUpload}
                /> 
            }
        </Card>
    );
}

export default FileUpload;