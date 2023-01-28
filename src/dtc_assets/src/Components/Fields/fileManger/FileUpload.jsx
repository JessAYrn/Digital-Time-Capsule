import React, {useRef, useState, useEffect, useContext, useMemo} from 'react';
import "./FileUpload.scss";
import { types } from '../../../reducers/journalReducer';
import { useEffect } from '../../../../../../dist/dtc_assets';
import { deviceType } from '../../../Utils';
import { DEVICE_TYPES, MAX_DURATION_OF_VIDEO_IN_SECONDS, NULL_STRING_ALL_LOWERCASE, PAGES } from '../../../Constants';
import { MODALS_TYPES } from '../../../Constants';
import { getFileFromApi, getFileURL, mapAndSendFileToApi, getDuration, updateFileMetadataInStore } from './FileManagementTools';
import { AppContext as JournalContext} from '../../../App';
import { UI_CONTEXTS } from '../../../Contexts';

const forbiddenFileTypes = [
    'application/pdf'
];

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
        filesMetaDataArray,
        videoHeight
    } = props;
    let inputRef = useRef();

    const defaultFileSrc = "dtc-logo-black.png";
    const [constructedFile, setConstructedFile] = useState(null);
    const [fileSrc, setFileSrc]  = useState(defaultFileSrc);
    const [fileType, setFileType] = useState("image/png");
    

    var uploadedFile;
    var fileURL;
    
    const typeOfDevice = deviceType();

    let AppContext;
    if(context === UI_CONTEXTS.JOURNAL){
        AppContext = JournalContext;
    }
    const { journalState, dispatch } = useContext(AppContext);

    let fileData = filesMetaDataArray[fileIndex];
    let fileName = fileData.fileName;
    let fileNameIsNull = fileName === NULL_STRING_ALL_LOWERCASE;

    //Upon uploading a file, this function updates the file metadata from its default settings 
    //to that of the file that was uploaded. 
    useEffect(() => {
        filesMetaDataArray[fileIndex];
        fileName = fileData.fileName;
        fileNameIsNull = fileName === NULL_STRING_ALL_LOWERCASE;
    }, [filesMetaDataArray[fileIndex]]);

    //Retrieves file chunks from API and used them, along with the file metadata, to construct
    //a the file and set the constructedFile variable to the newly constructed file. 
    //it only does this if the fileName property of the fileMetaData object is not equal
    //to NULL_STRING_ALL_LOWERCASE. Otherwise, this function does nothing.
    useEffect(() => {
        const getFiles = async () => getFileFromApi(
            journalState,
            dispatch, 
            dispatchActionToChangeFileLoadStatus, 
            fileData,
            index, 
            fileIndex,
            setConstructedFile
        );
        getFiles();
    }, []);

    //updates the fileSrc whenever the constructedFile variable is updated with the proper file
    useEffect( async () => {
        if(constructedFile){
            setFileType(constructedFile.type);
            fileURL = await getFileURL(constructedFile);
            setFileSrc(fileURL);
        };
    },[constructedFile]);

    //returns the fileId of a newly uploaded file, but only of the file fits the format requirements.
    const uploadFileToFrontend = async (uploadedFile) => {
        //check file extension for audio/video type
        //this if statement will ultimately end up triggering the 
        //canPlayThrough() function.
        if(uploadedFile.name.match(/\.(avi|mp3|mp4|mpeg|ogg|webm|mov|MOV)$/i)){
            const duration = await getDuration(uploadedFile);
            if(duration > MAX_DURATION_OF_VIDEO_IN_SECONDS || forbiddenFileTypes.includes(uploadedFile.type)){
                setFileSrc(defaultFileSrc);
                setFileType("image/png");
                dispatch({
                        actionType: types.SET_MODAL_STATUS,
                        payload: {
                            show: true, 
                            which: MODALS_TYPES.fileHasError,
                            duration: duration
                        }
                });
                URL.revokeObjectURL(fileURL);
                return null;
            } else {
                setFileType(uploadedFile.type);
                fileURL = await getFileURL(uploadedFile);
                let fileId = updateFileMetadataInStore(
                    dispatch, 
                    dispatchActionToChangeFileMetaData, 
                    index, 
                    fileIndex, 
                    setChangesWereMade, 
                    uploadedFile
                );
                setConstructedFile(uploadedFile);
                return fileId;
            }
        } else {
            //triggers useEffect which displays the video
            setFileType(uploadedFile.type);
            fileURL = await getFileURL(uploadedFile);
            let fileId = updateFileMetadataInStore(
                dispatch, 
                dispatchActionToChangeFileMetaData, 
                index, 
                fileIndex, 
                setChangesWereMade, 
                uploadedFile
            );
            setConstructedFile(uploadedFile);
            return fileId;
        }
    };

    const handleUpload = async () => {
        uploadedFile = inputRef.current.files[0] || constructedFile;
        dispatch({ 
            actionType: dispatchActionToChangeFileLoadStatus,
            payload: true,
            index: index,
            fileIndex: fileIndex 
        });
        let fileId = await uploadFileToFrontend(uploadedFile);
        if(fileId) await mapAndSendFileToApi(journalState, fileId, uploadedFile);

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
            { !disabled && fileNameIsNull &&
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