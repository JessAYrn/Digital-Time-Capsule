import { fileToBlob, flattenUint8array } from "../../../Utils";
import { CHUNK_SIZE, PAGES } from "../../../Constants";
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

export const updateFileMetadataInStore = (dispatch, dispatchAction, index, fileIndex, changesMadeFn, file, fileURL) => {
    let fileId = `${file.name}-${Date.now()}`;
    dispatch({
        payload: {
            fileName: fileId,
            lastModified: file.lastModified,
            fileType: file.type,
            file: fileURL
        },
        actionType: dispatchAction,
        index: index,
        fileIndex: fileIndex
    })
    if(!!changesMadeFn){
        changesMadeFn(true);
    } 
    return fileId;
};

export const mapAndSendFileToApi = async (actorState, fileId, file) => {
    const fileSize = file.size;

    const chunks = Math.ceil(fileSize/CHUNK_SIZE);
    let chunk = 0;

    let promises = [];
    while(chunk < chunks){    
        
        const from = chunk * CHUNK_SIZE;
        const to = from + CHUNK_SIZE;

        const fileChunk = (to < fileSize -1) ? file.slice(from,to ) : file.slice(from);

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

