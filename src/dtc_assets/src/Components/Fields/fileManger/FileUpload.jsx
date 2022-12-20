import React, {useRef, useState, useEffect, useContext, useMemo} from 'react';
import "./FileUpload.scss";
import { types } from '../../../reducers/journalReducer';
import { useEffect } from '../../../../../../dist/dtc_assets';
import { deviceType, getFileArrayBuffer } from '../../../Utils';
import { DEVICE_TYPES, MAX_DURATION_OF_VIDEO_IN_SECONDS } from '../../../Constants';
import { MODALS_TYPES } from '../../../Constants';
import { CHUNK_SIZE } from '../../../Constants';
import { fileToBlob } from '../../../Utils';
import { retrieveChunk, getFileURL, uploadChunk, getDuration } from './FileManagementTools';
import { AppContext as JournalContext} from '../../../App';
import { UI_CONTEXTS } from '../../../Contexts';

const forbiddenFileTypes = [
    'application/pdf'
];

const FileUpload = (props) => {
    const {
        label,
        index,
        elementId,
        setChangesWereMade,
        fileIndex,
        context,
        disabled
    } = props;
    let inputRef = useRef();

    const [constructedFile, setConstructedFile] = useState(null);
    const [fileSrc, setFileSrc]  = useState("dtc-logo-black.png");
    const [fileType, setFileType] = useState("image/png");

    let AppContext;
    if(context === UI_CONTEXTS.JOURNAL){
        AppContext = JournalContext;
    }
    const { journalState, dispatch } = useContext(AppContext);

    let dispatchActionToChangeFileMetaData = types.CHANGE_FILE_METADATA;
    let dispatchActionToChangeFileLoadStatus = types.CHANGE_FILE_LOAD_STATUS;
    let fileData = journalState.journal[index].filesMetaData[fileIndex];
    let fileName = fileData.fileName;
    let fileNameIsNull = fileName === "null";

    useEffect(() => {
        fileData = journalState.journal[index].filesMetaData[fileIndex];
        fileName = fileData.fileName;
        fileNameIsNull = fileName === "null";
    }, [journalState.journal[index].filesMetaData[fileIndex]]);

    useEffect(async () => {
        if(fileName === 'null') return;
        dispatch({ 
            actionType: dispatchActionToChangeFileLoadStatus,
            payload: true,
            index: index,
            fileIndex: fileIndex 
        });
        let index_ = 0;
        let promises = [];
        let fileChunkCounteObj;
        let fileChunkCount;
        if( context === UI_CONTEXTS.JOURNAL){
            fileChunkCounteObj = await journalState.actor.readEntryFileSize(fileName);
            fileChunkCount = parseInt(fileChunkCounteObj.ok);
        } 
        if( fileChunkCount > 0){
            while(index_ < fileChunkCount){
                promises.push(retrieveChunk(journalState, context, fileName, index_));
                index_ += 1;
            };
            let fileBytes = await Promise.all(promises);
            fileBytes = fileBytes.flat(1);
            const fileArrayBuffer = new Uint8Array(fileBytes).buffer;
            let metaData_ = fileData.metaData ? fileData.metaData : fileData;
            const fileBlob = new Blob(
                [fileArrayBuffer], 
                { 
                    type: metaData_.fileType 
                }
            );
            const fileAsFile = new File(
                [fileBlob],
                fileName, 
                {
                    type: metaData_.fileType, 
                    lastModified: parseInt(metaData_.lastModified)
                } 
            );
            setConstructedFile(fileAsFile);
        }
        dispatch({ 
            actionType: dispatchActionToChangeFileLoadStatus,
            payload: false,
            index: index,
            fileIndex: fileIndex 
        });
    },[fileName]);

    var uploadedFile;
    var fileURL;
    
    const typeOfDevice = deviceType();

    useEffect( async () => {
        if(constructedFile){
            setFileType(constructedFile.type);
            fileURL = await getFileURL(constructedFile);
            setFileSrc(fileURL)
        };
    },[constructedFile]);

    const mapAndSendFileToApi = async (file) => {
        const fileSize = file.size;

        const chunks = Math.ceil(fileSize/CHUNK_SIZE);
        let chunk = 0;

        let promises = [];
        while(chunk < chunks){    
            
            const from = chunk * CHUNK_SIZE;
            const to = from + CHUNK_SIZE;

            const fileChunk = (to < fileSize -1) ? file.slice(from,to ) : file.slice(from);

            let chunkId = parseInt(chunk);
            let fileId = journalState.journal[index].filesMetaData[fileIndex].fileName;
            promises.push(uploadChunk(journalState, fileId, chunkId, fileChunk));

            chunk += 1;
        };
        const results = await Promise.all(promises); 
    };

    const updateFileMetadataInStore = (file) => {
        dispatch({
            payload: {
                fileName: `${file.name}-${Date.now()}`,
                lastModified: file.lastModified,
                fileType: file.type
            },
            actionType: dispatchActionToChangeFileMetaData,
            index: index,
            fileIndex: fileIndex
        })
        if(!!setChangesWereMade){
            setChangesWereMade(true);
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

        //check file extension for audio/video type
        //this if statement will ultimately end up triggering the 
        //canPlayThrough() function.
        if(uploadedFile.name.match(/\.(avi|mp3|mp4|mpeg|ogg|webm|mov|MOV)$/i)){
            const duration = await getDuration(uploadedFile);
            if(duration > MAX_DURATION_OF_VIDEO_IN_SECONDS || forbiddenFileTypes.includes(uploadedFile.type)){
                setFileSrc("dtc-logo-black.png");
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
            } else {
                setFileType(uploadedFile.type);
                fileURL = await getFileURL(uploadedFile);
                setFileSrc(fileURL)
                updateFileMetadataInStore(uploadedFile);
                setConstructedFile(uploadedFile);
                await mapAndSendFileToApi(uploadedFile);
            }
        } else {
            //triggers useEffect which displays the video
            setFileType(uploadedFile.type);
            fileURL = await getFileURL(uploadedFile);
            setFileSrc(fileURL)
            updateFileMetadataInStore(uploadedFile);
            setConstructedFile(uploadedFile);
            await mapAndSendFileToApi(uploadedFile);
        }

        dispatch({ 
            actionType: dispatchActionToChangeFileLoadStatus,
            payload: false,
            index: index,
            fileIndex: fileIndex 
        });
        
    };

    return(
        <div className={'imageDivContainer'}>
            <div className={'imageDiv'}>  
                {
                    fileData.isLoading ? 
                        <>
                            <img src="Loading.gif" alt="Loading Screen" />
                        </> :
                        <>
                            { 
                                (fileType.includes("image")) ? 
                                    <img 
                                        src={fileSrc} 
                                        id={elementId}
                                        alt="image preview" 
                                        className="imagePreview__image" 
                                    /> :
                                    (fileType.includes("quicktime") && (typeOfDevice !== DEVICE_TYPES.desktop)) ?
                                    <video 
                                        width="330" 
                                        height="443" 
                                        className="imagePreview__video" 
                                        preload
                                        id={elementId}
                                        style={{borderRadius: 10 + 'px'}}
                                        controls
                                        muted
                                        poster={'video-thumbnail.png'}
                                        playsInline
                                        src={fileSrc}
                                    ></video> :
                                    <video 
                                        width="330" 
                                        height="443" 
                                        style={{borderRadius: 10 + 'px'}}
                                        className="imagePreview__video" 
                                        preload="metadata"
                                        id={elementId}
                                        controls
                                        muted
                                        playsInline
                                    >
                                        <source src={fileSrc} type='video/mp4; codecs="avc1.42E01E, mp4a.40.2"'/>
                                        <source src={fileSrc} type='video/ogg; codecs="theora, vorbis"'/>
                                        <source src={fileSrc} type='video/webm; codecs="vp8, vorbis"'/>
                                        <source src={fileSrc} type='video/mpeg'/>
                                        Your browser does not support the video tag.
                                    </video>  
                            
                            }
                            {
                                !fileSrc && 
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