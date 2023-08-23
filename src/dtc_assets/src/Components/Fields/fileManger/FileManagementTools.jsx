import { fileToBlob, flattenUint8array } from "../../../functionsAndConstants/Utils";
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

import { 
    CHUNK_SIZE, MAX_DURATION_OF_VIDEO_IN_SECONDS, forbiddenFileTypes, MODALS_TYPES 
} from "../../../functionsAndConstants/Constants";
import { types } from "../../../reducers/journalReducer";
// import actorReducer, { actorInitialState, actorTypes } from "../../../reducers/actorReducer";



export const retrieveChunk = async (actorState, fileName, chunkIndex) => {
    let chunk;
    chunk = await actorState.backendActor.readEntryFileChunk(fileName, chunkIndex);
    chunk = chunk.ok;
    return chunk
}; 

export const getFileURL = async (file) => {
    return new Promise((res, rej) => {
        var reader = new FileReader();  
        reader.onload = function(e) { 
            var myDataUrl = e.target.result;
            res(myDataUrl);
            // do something with the URL in the DOM,
            // then save it to local storage
        };  
        reader.readAsDataURL(file);
    });
};

export const uploadChunk = async (actorState, fileId, chunkId, fileChunk) => {    
    const fileChunkAsBlob = await fileToBlob(fileChunk);
    return actorState.backendActor.uploadJournalEntryFile(
        fileId, 
        chunkId, 
        fileChunkAsBlob
    );
};

export const getDuration = async (file) => {
    let obUrl = URL.createObjectURL(file);
    return new Promise((resolve) => {
      const audio = document.createElement("audio");
      audio.muted = true;
      const source = document.createElement("source");
      source.src = obUrl; //--> blob URL
      audio.preload= "metadata";
      audio.appendChild(source);
      audio.onloadedmetadata = function(){
         resolve({duration :audio.duration, url: obUrl})
      };
    });
}

export const createFileId = (uploadedFile) => {
    let fileId = `${uploadedFile.name}-${Date.now()}`
    return fileId
}

export const updateFileMetadataInStore = (props) => {
    const { 
        dispatch, dispatchActionToChangeFileMetaData, index, fileIndex, 
        setChangesWereMade, uploadedFile, fileURL, fileId
    } = props
    dispatch({
        payload: {
            fileName: fileId,
            lastModified: uploadedFile.lastModified,
            fileType: uploadedFile.type,
            file: fileURL
        },
        actionType: dispatchActionToChangeFileMetaData,
        index: index,
        fileIndex: fileIndex
    })
    if(!!setChangesWereMade) setChangesWereMade(true);
};

export const getIsWithinProperFormat = async (uploadedFile) => {
    if(uploadedFile.name.match(/\.(avi|mp3|mp4|mpeg|ogg|webm|mov|MOV)$/i)){
        const result = await getDuration(uploadedFile);
        let duration = result.duration;
        URL.revokeObjectURL(result.url);
        if(duration > MAX_DURATION_OF_VIDEO_IN_SECONDS) {
            return {
                isProperFormat: false, 
                modalInput:{ 
                    bigText: "Video Too Long.",
                    smallText: `Only videos up to ${MAX_DURATION_OF_VIDEO_IN_SECONDS} seconds may be uploaded`,
                    Icon: ErrorOutlineIcon
                }
            };
        };
    };
    if(forbiddenFileTypes.includes(uploadedFile.type)){
        return {
            isProperFormat: false, 
            modalInput:{ 
                bigText: "Unsupported File Type.",
                smallText: "The File Type you selected cannot be uploaded here.",
                Icon: ErrorOutlineIcon
            } 
        }
    }
    return {isProperFormat: true};
}
export const mapAndSendFileToApi = async (props) => {
    const {actorState, fileId, uploadedFile} = props;
    const fileSize = uploadedFile.size;

    const chunks = Math.ceil(fileSize/CHUNK_SIZE);
    let chunk = 0;

    let promises = [];
    while(chunk < chunks){    
        
        const from = chunk * CHUNK_SIZE;
        const to = from + CHUNK_SIZE;

        const fileChunk = (to < fileSize -1) ? uploadedFile.slice(from,to ) : uploadedFile.slice(from);

        let chunkId = parseInt(chunk);
        promises.push(uploadChunk(actorState, fileId, chunkId, fileChunk));

        chunk += 1;
    };
    const results = await Promise.all(promises); 
    return results
};

export const getFileUrl_fromApi = async (
    actorState, 
    fileData
    ) => {

    let fileName = fileData.fileName;
    let index_ = 0;
    let promises = [];
    let fileChunkCounteObj;
    let fileChunkCount;
    fileChunkCounteObj = await actorState.backendActor.readEntryFileSize(fileName);
    fileChunkCount = parseInt(fileChunkCounteObj.ok);
    let fileURL;

    if( fileChunkCount > 0){
        while(index_ < fileChunkCount){
            promises.push(retrieveChunk(actorState, fileName, index_));
            index_ += 1;
        };
        let fileBytes = await Promise.all(promises);
        fileBytes = flattenUint8array(fileBytes);
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
        fileURL = await getFileURL(fileAsFile);
    };
    return fileURL;
};

