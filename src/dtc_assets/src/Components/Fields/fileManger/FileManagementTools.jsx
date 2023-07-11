import { fileToBlob, flattenUint8array } from "../../../functionsAndConstants/Utils";
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

export const updateFileMetadataInStore = (props) => {
    const { 
        dispatch, dispatchActionToChangeFileMetaData, index, fileIndex, 
        setChangesWereMade, uploadedFile, fileURL,
    } = props
    let fileId = `${uploadedFile.name}-${Date.now()}`;
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
    if(!!setChangesWereMade){
        setChangesWereMade(true);
    } 
    return fileId;
};

export const displayFile = async (props) => {
    const {
        uploadedFile, setFileSrc, 
        setFileType, dispatch, defaultFileSrc
    } = props;
    //check file extension for audio/video type
    //this if statement will ultimately end up triggering the 
    //canPlayThrough() function.
    if(uploadedFile.name.match(/\.(avi|mp3|mp4|mpeg|ogg|webm|mov|MOV)$/i)){
        const result = await getDuration(uploadedFile);
        let duration = result.duration;
        URL.revokeObjectURL(result.url);
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
            return null;
        };
    };
    //triggers useEffect which displays the video
    setFileType(uploadedFile.type);
    const fileURL = await getFileURL(uploadedFile);
    return fileURL;
};

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
};

export const getFileUrl_fromApi = async (
    actorState, 
    fileData
    ) => {

    let fileName = fileData.fileName;
    if(fileName === 'null') return;

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

