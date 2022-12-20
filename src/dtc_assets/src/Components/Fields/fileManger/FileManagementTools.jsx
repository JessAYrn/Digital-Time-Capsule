import { UI_CONTEXTS } from "../../../Contexts";
import { getFileArrayBuffer, fileToBlob } from "../../../Utils";

export const retrieveChunk = async (journalState, context, fileName, chunkIndex) => {
    let chunk;
    if(context === UI_CONTEXTS.JOURNAL){
        chunk = await journalState.actor.readEntryFileChunk(fileName, chunkIndex);
        chunk = chunk.ok;
    }
    return chunk
}; 

export const getFileURL = async (file) => {
    let fileAsBuffer = await getFileArrayBuffer(file);
    let fileBlob = new Blob([new Uint8Array(fileAsBuffer)], { type: file.type });
    let url = window.URL.createObjectURL(fileBlob);
    return url;
};

export const uploadChunk = async (journalState, fileId, chunkId, fileChunk) => {    
    const fileChunkAsBlob = await fileToBlob(fileChunk);
    return journalState.actor.uploadJournalEntryFile(
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
         resolve(audio.duration)
      };
    });
}
