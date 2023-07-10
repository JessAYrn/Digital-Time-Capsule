import React, {useRef, useState, useEffect, useContext, useMemo} from 'react';
import "./FileUpload.scss";
import { useEffect } from '../../../../../../dist/dtc_assets';
import { deviceType } from '../../../functionsAndConstants/Utils';
import { DEVICE_TYPES, NULL_STRING_ALL_LOWERCASE } from '../../../functionsAndConstants/Constants';
import { mapAndSendFileToApi, displayFile, updateFileMetadataInStore } from './FileManagementTools';
import { AppContext as AccountContext} from '../../../Routes/Account';
import { AppContext as HomePageContext} from '../../../Routes/HomePage';
import { AppContext as JournalContext} from '../../../Routes/App';
import { AppContext as WalletContext} from '../../../Routes/Wallet';
import { AppContext as TreasuryContext} from '../../../Routes/Treasury';
import { AppContext as GroupJournalContext} from '../../../Routes/GroupJournal';
import { retrieveContext } from '../../../functionsAndConstants/Contexts';

const FileUpload = (props) => {
    const {
        index,
        elementId,
        forceDisplayDefaultFileSrc,
        setChangesWereMade,
        fileIndex,
        context,
        disabled,
        classNameMod,
        dispatchActionToChangeFileMetaData,
        dispatchActionToChangeFileLoadStatus,
        videoHeight,
        fileData,
        dispatch,
        reduxState
    } = props;
    let inputRef = useRef();

    const defaultFileSrc = "dtc-logo-black.png";
    const [fileSrc, setFileSrc]  = useState(defaultFileSrc);
    const [fileType, setFileType] = useState("image/png");
        
    const typeOfDevice = deviceType();
    
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

    //Upon uploading a file, this function updates the file metadata from its default settings 
    //to that of the file that was uploaded. 
    useEffect(() => { if (fileData.file) setFileSrc(fileData.file); }, [fileData]);

    //returns the fileId of a newly uploaded file, but only of the file fits the format requirements.

    const handleUpload = async () => {
        const uploadedFile = inputRef.current.files[0];
        dispatch({ 
            actionType: dispatchActionToChangeFileLoadStatus,
            payload: true,
            index: index,
            fileIndex: fileIndex 
        });
        let inputForDisplayFileFunction = {
            uploadedFile, setFileSrc, setFileType, dispatch, 
            dispatchActionToChangeFileMetaData, index, fileIndex,
            setChangesWereMade, defaultFileSrc, actorState
        }
        let fileURL = await displayFile(inputForDisplayFileFunction);
        inputForDisplayFileFunction = { ...inputForDisplayFileFunction, fileURL};
        let fileId = updateFileMetadataInStore(inputForDisplayFileFunction);
        inputForDisplayFileFunction = { ...inputForDisplayFileFunction, fileId};
        if(fileId) await mapAndSendFileToApi(inputForDisplayFileFunction);

        dispatch({ 
            actionType: dispatchActionToChangeFileLoadStatus,
            payload: false,
            index: index,
            fileIndex: fileIndex 
        });
    };

    const fileSrcToDisplay = forceDisplayDefaultFileSrc ? defaultFileSrc : fileSrc;

    return(
        <div className={`imageDivContainer ${classNameMod}`}>
            <div className={`imageDiv ${classNameMod}`}>  
                {
                    fileData.isLoading ? 
                        <>
                            <img src="Loading.gif" alt="Loading Screen" />
                        </> :
                        <>
                            { 
                                (fileType.includes("image")) ? 
                                    <img 
                                        src={fileSrcToDisplay} 
                                        id={elementId}
                                        alt="image preview" 
                                        className="imagePreview__image" 
                                    /> :
                                    (fileType.includes("quicktime") && (typeOfDevice !== DEVICE_TYPES.desktop)) ?
                                    <video 
                                        width="330" 
                                        height={videoHeight} 
                                        className="imagePreview__video" 
                                        preload
                                        id={elementId}
                                        style={{borderRadius: 10 + 'px'}}
                                        controls
                                        muted
                                        poster={'video-thumbnail.png'}
                                        playsInline
                                        src={fileSrcToDisplay}
                                    ></video> :
                                    <video 
                                        width="330" 
                                        height={videoHeight} 
                                        style={{borderRadius: 10 + 'px'}}
                                        className="imagePreview__video" 
                                        preload="metadata"
                                        id={elementId}
                                        controls
                                        muted
                                        playsInline
                                    >
                                        <source src={fileSrcToDisplay} type='video/mp4; codecs="avc1.42E01E, mp4a.40.2"'/>
                                        <source src={fileSrcToDisplay} type='video/ogg; codecs="theora, vorbis"'/>
                                        <source src={fileSrcToDisplay} type='video/webm; codecs="vp8, vorbis"'/>
                                        <source src={fileSrcToDisplay} type='video/mpeg'/>
                                        Your browser does not support the video tag.
                                    </video>  
                            
                            }
                            {
                                !fileSrcToDisplay && 
                                <span className="imagePreview__default-display">
                                    Image Preview
                                </span>   
                            } 
                        </> 
                }          
            </div>
            { !disabled && fileData.fileName === NULL_STRING_ALL_LOWERCASE &&
                <input 
                    disabled={disabled}
                    id={`uploadedImaged__${elementId}`} 
                    type="file" 
                    className={'imageInputButton'} 
                    ref={inputRef} 
                    onChange={handleUpload}
                /> 
            }
        </div>
    );
}

export default FileUpload;