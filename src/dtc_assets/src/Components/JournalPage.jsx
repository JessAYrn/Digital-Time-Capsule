import React, {useState, useContext, useEffect, useCallback} from "react";
import FileUpload from "./Fields/FileUpload";
import InputBox from "./Fields/InputBox";
import Slider from "./Fields/Slider";
import {types} from "../reducers/journalReducer";
import  {AppContext} from "../App";
import "./JournalPage.scss";
import DatePicker from "./Fields/DatePicker";
import LoadScreen from "./LoadScreen";
import ModalContentSubmit from "./ModalContentOnSubmit";
import { Modal } from "./Modal";

const CHUNK_SIZE = 1024 * 1024;

const JournalPage = (props) => {

    const [file1, setFile1] = useState(null);
    const [file2, setFile2] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [submitSuccessful,setSubmitSuccessful] = useState(null);
    const [isDisabled, setIsDisabled] = useState(false);

    const {
        journalReducerDispatchFunction,
        index,
        journalPageData,
        journalSize,
        closePage
    } = props;

    const { 
        actor,
        setSubmissionsMade,
        submissionsMade
    } = useContext(AppContext);

    const retrieveChunk = async (fileId,chunkIndex) => {

        return await actor.readEntryFileChunk(fileId, chunkIndex);
    }; 

    useEffect(async () => {
        if(!journalPageData.draft){
            setIsDisabled(true);
        }
        if(journalPageData.file1MetaData.fileName !== 'null'){
            setIsLoading(true);
            let index = 0;
            let promises = [];

            const file1ChunkCounteObj = await actor.readEntryFileSize(journalPageData.file1MetaData.fileName);
            const file1ChunkCount = parseInt(file1ChunkCounteObj.ok);
            if( file1ChunkCount > 0){
                while(index < file1ChunkCount){
                    promises.push(retrieveChunk(journalPageData.file1MetaData.fileName, index));
                    index += 1;
                };
                const file1Bytes = await Promise.all(promises);
                let file1BytesArray =[];
                file1Bytes.map((blobObj) => {
                    file1BytesArray.push(blobObj.ok);
                });
                file1BytesArray = file1BytesArray.flat(1);
                const file1ArrayBuffer = new Uint8Array(file1BytesArray).buffer;
                const file1Blob = new Blob(
                    [file1ArrayBuffer], 
                    { 
                        type: journalPageData.file1MetaData.fileType 
                    }
                );
                const file1AsFile = new File(
                    [file1Blob],
                    journalPageData.file1MetaData.fileName, 
                    {
                        type: journalPageData.file1MetaData.fileType, 
                        lastModified: parseInt(journalPageData.file1MetaData.lastModified)
                    } 
                );
                setFile1(file1AsFile);
            }
        };
    
        if(journalPageData.file2MetaData.fileName !== 'null'){
            setIsLoading(true);
            let index = 0;
            let promises = [];

            const file2ChunkCounteObj = await actor.readEntryFileSize(journalPageData.file2MetaData.fileName);
            const file2ChunkCount = parseInt(file2ChunkCounteObj.ok);
            if( file2ChunkCount > 0){
                while(index < file2ChunkCount){
                    promises.push(retrieveChunk(journalPageData.file2MetaData.fileName, index));
                    index += 1;
                };
                const file2Bytes = await Promise.all(promises);
                let file2BytesArray =[];
                file2Bytes.map((blobObj) => {
                    file2BytesArray.push(blobObj.ok);
                });
                file2BytesArray = file2BytesArray.flat(1);
                const file2ArrayBuffer = new Uint8Array(file2BytesArray).buffer;
                const file2Blob = new Blob(
                    [file2ArrayBuffer], 
                    { 
                        type: journalPageData.file2MetaData.fileType 
                    }
                );
                const file2AsFile = new File(
                    [file2Blob],
                    journalPageData.file2MetaData.fileName, 
                    {
                        type: journalPageData.file2MetaData.fileType, 
                        lastModified: parseInt(journalPageData.file2MetaData.lastModified)
                    } 
                );
                setFile2(file2AsFile);
            }
        };
        setIsLoading(false);
    },[journalPageData.file1MetaData.fileName, journalPageData.file2MetaData.fileName]);
    
   
    const uploadChunk = async (fileId, chunkId, fileChunk) => {
        return actor.createJournalEntryFile(
            fileId, 
            chunkId, 
            [...new Uint8Array(await fileChunk.arrayBuffer())]
        );

    };

    const mapAndSendEntryToApi = async (entryKey, journalEntry, isDraft) => {

        const entryAsApiObject = [{
            entryTitle: journalEntry.title,
            text: journalEntry.entry,
            location: journalEntry.location,
            date: journalEntry.date,
            lockTime: parseInt(journalEntry.lockTime),
            emailOne: journalEntry.emailOne,
            emailTwo: journalEntry.emailTwo,
            emailThree: journalEntry.emailThree,
            file1MetaData: journalEntry.file1MetaData,
            file2MetaData: journalEntry.file2MetaData,
            draft: isDraft
        }];

        const entryKeyAsApiObject = (entryKey >= 0 && entryKey < journalSize ) ? [{entryKey: entryKey}] : [];
        
        let result = await actor.updateJournalEntry(
            entryKeyAsApiObject,
            entryAsApiObject
        );
        return result;

    }



    const mapAndSendFileToApi = async (fileId, file) => {
        const fileSize = file.size;

        const chunks = Math.ceil(fileSize/CHUNK_SIZE);
        let chunk = 0;

        let promises = [];


        while(chunk < chunks){    
            
            const from = chunk * CHUNK_SIZE;
            const to = from + CHUNK_SIZE;

            const fileChunk = (to < fileSize -1) ? file.slice(from,to ) : file.slice(from);

            let chunkId = parseInt(chunk);
            promises.push(uploadChunk(fileId, chunkId, fileChunk));

            chunk += 1;
        };

        const results = await Promise.all(promises);  
        return results;
    };



    const handleSubmit = useCallback(async () => {
        setIsLoading(true);
        let result1 = null;
        let result2 = null;
        let result3 = null;
        if(journalPageData.file1MetaData.fileName !== 'null'){
            await mapAndSendFileToApi(journalPageData.file1MetaData.fileName, file1).then(res => {
                result1 = true;
                res.map(status => {
                    if("err" in status){
                        console.log(status);
                        result1 = false;
                    }
                });
            });
        };
        if(journalPageData.file2MetaData.fileName !== 'null') {
            await mapAndSendFileToApi(journalPageData.file2MetaData.fileName, file2).then(res => {
                result2 = true;
                res.map(status => {
                    if("err" in status){
                        console.log(status);
                        result2 = false;
                    }
                });
            });
        }
        await mapAndSendEntryToApi(index, journalPageData, false).then(res => {
            if("err" in res){
                result3 = false;
            } else {
                result3 = true;
            }
        });
        const result = (result1 || (result1 === null)) && 
                       (result2 || (result2 === null)) && 
                       (result3 || (result3 === null));
        setIsLoading(false);
        setShowModal(true);
        if(result){
            setSubmitSuccessful(true);
        } else {
            setSubmitSuccessful(false);
        }

    }, [journalPageData, file1, file2]);

    return (
        isLoading ? 
            <LoadScreen/> : showModal ? 
                <div className={"container"}>
                    <div className={'background'}>
                        <Modal 
                            showModal={showModal} 
                            setShowModal={setShowModal} 
                            ChildComponent={ModalContentSubmit}
                            success={submitSuccessful}
                            setSuccess={setSubmitSuccessful}
                        />
                    </div>
                </div> :
                <div className={"journalPageContainer"}>
                    <div className={"logoDiv"}>
                        <img className={'backButtonImg'} src="back-icon.png" alt="Back Button" onClick={(e) => closePage(e)}/>
                        <img className={'logoImg'}src="dtc-logo-black.png" alt="Logo" />
                    </div>
                    <Slider
                        min={0}
                        max={120}
                        disabled={isDisabled}
                        dispatch={journalReducerDispatchFunction}
                        dispatchAction={types.CHANGE_LOCK_TIME}
                        index={index}
                        value={(journalPageData) ? journalPageData.lockTime : '3'}
                    />
                    <div className={"journalText"} >
                        <DatePicker
                            label={"Date: "}
                            rows={"1"}
                            disabled={isDisabled}
                            dispatch={journalReducerDispatchFunction}
                            dispatchAction={types.CHANGE_DATE}
                            index={index}
                            value={(journalPageData) ? journalPageData.date : ''}
                        />
                        <InputBox
                            label={"Location: "}
                            rows={"1"}
                            disabled={isDisabled}
                            dispatch={journalReducerDispatchFunction}
                            dispatchAction={types.CHANGE_LOCATION}
                            index={index}
                            value={(journalPageData) ? journalPageData.location : ''}
                        />
                        <InputBox
                            divClassName={"entry"}
                            label={"Entry: "}
                            rows={"59"}
                            disabled={isDisabled}
                            dispatch={journalReducerDispatchFunction}
                            dispatchAction={types.CHANGE_ENTRY}
                            index={index}
                            value={(journalPageData) ? journalPageData.entry : ''}
                        />
                    </div>
                    <div className={"journalImages"}>
                        <FileUpload
                            label={'file1'}
                            dispatch={journalReducerDispatchFunction}
                            dispatchAction={types.CHANGE_FILE1_METADATA}
                            value={file1}
                            disabled={isDisabled}
                            setValue={setFile1}
                            index={index}
                        />
                        <FileUpload
                            label={'file2'}
                            dispatch={journalReducerDispatchFunction}
                            dispatchAction={types.CHANGE_FILE2_METADATA}
                            value={file2}
                            disabled={isDisabled}
                            setValue={setFile2}
                            index={index}
                        />
                    </div>
                    {/* <div className={'recipientEmailsDiv'}>
                        <InputBox
                            label={"1st Recipient Email: "}
                            rows={"1"}
                            dispatch={journalReducerDispatchFunction}
                            dispatchAction={types.CHANGE_RECIPIENT_EMAIL_ONE}
                            index={index}
                            value={(journalPageData) ? journalPageData.emailOne : ''}
                        />
                        <InputBox
                            label={"2nd Recipient Email: "}
                            rows={"1"}
                            dispatch={journalReducerDispatchFunction}
                            dispatchAction={types.CHANGE_RECIPIENT_EMAIL_TWO}
                            index={index}
                            value={(journalPageData) ? journalPageData.emailTwo : ''}
                        />
                        <InputBox
                            label={"3rd Recipient Email: "}
                            rows={"1"}
                            dispatch={journalReducerDispatchFunction}
                            dispatchAction={types.CHANGE_RECIPIENT_EMAIL_THREE}
                            index={index}
                            value={(journalPageData) ? journalPageData.emailThree : ''}
                        />
                    </div> */}
                    <div className={"submitButtonDiv"}>
                        <button className={'button'} type="submit" onClick={handleSubmit} disabled={isDisabled}> Submit </button>
                    </div>
                    
                </div>
    )
};

export default JournalPage;

