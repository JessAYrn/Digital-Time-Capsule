import React, {useRef, useState, useEffect, useContext, useMemo} from 'react';
import "./FileUpload.scss";
import { types } from '../../reducers/journalReducer';
import { useEffect } from '../../../../../dist/dtc_assets';
import { deviceType, getFileArrayBuffer } from '../../Utils';
import { DEVICE_TYPES, MAX_DURATION_OF_VIDEO_IN_SECONDS } from '../../Constants';
import { MODALS_TYPES } from '../../Constants';
import { CHUNK_SIZE } from '../../Constants';
import { fileToBlob } from '../../Utils';
import { AppContext as JournalContext} from '../../App';
import { AppContext as NftContext } from '../../NFTs';
import { UI_CONTEXTS } from '../../Contexts';

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
    if(context === UI_CONTEXTS.NFT){
        AppContext = NftContext
    }
    const { actor, journalState, dispatch } = useContext(AppContext);

    let dispatchActionToChangeFileMetaData;
    let dispatchActionToChangeFileBlob;
    let dispatchActionToChangeFileLoadStatus;
    let fileData;


    if(fileIndex === journalState.journal[index].file1.metaData.fileIndex){
        fileData = journalState.journal[index].file1;
        dispatchActionToChangeFileMetaData = types.CHANGE_FILE1_METADATA;
        dispatchActionToChangeFileBlob = types.CHANGE_FILE1_BLOB;
        dispatchActionToChangeFileLoadStatus = types.CHANGE_FILE1_LOAD_STATUS;
    }
    if(fileIndex === journalState.journal[index].file2.metaData.fileIndex){
        fileData = journalState.journal[index].file2;
        dispatchActionToChangeFileMetaData = types.CHANGE_FILE2_METADATA;
        dispatchActionToChangeFileBlob = types.CHANGE_FILE2_BLOB;
        dispatchActionToChangeFileLoadStatus = types.CHANGE_FILE2_LOAD_STATUS;
    }

    const retrieveChunk = async (fileId,chunkIndex) => {

        const chunk = await actor.readEntryFileChunk(fileId, chunkIndex);
        return chunk
    }; 

    useEffect(async () => {
        if(fileData.metaData.fileName === 'null'){
            return
        };
        if(fileData.blob){
            const fileAsFile = new File(
                [fileData.blob],
                fileData.metaData.fileName, 
                {
                    type: fileData.metaData.fileType, 
                    lastModified: parseInt(fileData.metaData.lastModified)
                } 
            );

            setConstructedFile(fileAsFile);
            
        } else {
            dispatch({ 
                actionType: dispatchActionToChangeFileLoadStatus,
                payload: true,
                index: index 
            });
            let index_1 = 0;
            let promises = [];
    
            const fileChunkCounteObj = await actor.readEntryFileSize(fileData.metaData.fileName);
            const fileChunkCount = parseInt(fileChunkCounteObj.ok);
            if( fileChunkCount > 0){
                while(index_1 < fileChunkCount){
                    promises.push(retrieveChunk(fileData.metaData.fileName, index_1));
                    index_1 += 1;
                };
                const fileBytes = await Promise.all(promises);
                let fileBytesArray =[];
                fileBytes.map((blobObj) => {
                    fileBytesArray.push(blobObj.ok);
                });
                fileBytesArray = fileBytesArray.flat(1);
                const fileArrayBuffer = new Uint8Array(fileBytesArray).buffer;
                const fileBlob = new Blob(
                    [fileArrayBuffer], 
                    { 
                        type: fileData.metaData.fileType 
                    }
                );
                const fileAsFile = new File(
                    [fileBlob],
                    fileData.metaData.fileName, 
                    {
                        type: fileData.metaData.fileType, 
                        lastModified: parseInt(fileData.metaData.lastModified)
                    } 
                );
                setConstructedFile(fileAsFile);
            }
            dispatch({ 
                actionType: dispatchActionToChangeFileLoadStatus,
                payload: false,
                index: index 
            });
        }
    },[fileData.metaData.fileName]);

    var uploadedFile;
    var obUrl;
    
    const typeOfDevice = deviceType();

    const processAndDisplayFile = async (file) => {
        setFileType(file.type);
        let fileAsBuffer = await getFileArrayBuffer(file);
        let fileBlob = new Blob([new Uint8Array(fileAsBuffer)], { type: file.type });
        dispatch({
            actionType: dispatchActionToChangeFileBlob,
            payload: fileBlob,
            index: index
        });
        let url = window.URL.createObjectURL(fileBlob);
        setFileSrc(url);
    };

    useEffect( async () => {
        if(constructedFile){
            processAndDisplayFile(constructedFile);
        }
    },[constructedFile]);

    const uploadChunk = async (chunkId, fileChunk) => {
        
        const fileChunkAsBlob = await fileToBlob(fileChunk)
        return actor.uploadJournalEntryFile(
            fileIndex, 
            chunkId, 
            fileChunkAsBlob
        );

    };

    const mapAndSendFileToApi = async (file) => {
        const fileSize = file.size;

        const chunks = Math.ceil(fileSize/CHUNK_SIZE);
        let chunk = 0;

        let promises = [];
        const clearResult = await actor.clearLocalFile(fileData.metaData.fileIndex);
        while(chunk < chunks){    
            
            const from = chunk * CHUNK_SIZE;
            const to = from + CHUNK_SIZE;

            const fileChunk = (to < fileSize -1) ? file.slice(from,to ) : file.slice(from);

            let chunkId = parseInt(chunk);
            promises.push(uploadChunk(chunkId, fileChunk));

            chunk += 1;
        };

        const results = await Promise.all(promises); 
    };

    const getDuration = async (file) => {
        obUrl = URL.createObjectURL(file);
       
        return new Promise((resolve) => {
          const audio = document.createElement("audio");
          audio.muted = true;
          const source = document.createElement("source");
          source.src = obUrl; //--> blob URL
          audio.preload= "metadata";
          audio.appendChild(source);
          audio.onloadedmetadata = function(){
             resolve(audio.duration)
          };
        });
    }

    const updateFileMetadataInStore = (file) => {
        dispatch({
            payload: {
                fileName: `${file.name}-${Date.now()}`,
                lastModified: file.lastModified,
                fileType: file.type,
                fileIndex: fileIndex
            },
            actionType: dispatchActionToChangeFileMetaData,
            index: index
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
            index: index 
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
                URL.revokeObjectURL(obUrl);
            } else {
                await processAndDisplayFile(uploadedFile);
                updateFileMetadataInStore(uploadedFile);
                setConstructedFile(uploadedFile);
                await mapAndSendFileToApi(uploadedFile);
            }
        } else {
            //triggers useEffect which displays the video
            await processAndDisplayFile(uploadedFile);
            updateFileMetadataInStore(uploadedFile);
            setConstructedFile(uploadedFile);
            await mapAndSendFileToApi(uploadedFile);
        }

        dispatch({ 
            actionType: dispatchActionToChangeFileLoadStatus,
            payload: false,
            index: index 
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
                                        autoPlay="false" 
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
            { !disabled &&
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