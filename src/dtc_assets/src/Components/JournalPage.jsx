import React, {useState, useContext, useEffect, useCallback} from "react";
import FileUpload from "./Fields/FileUpload";
import InputBox from "./Fields/InputBox";
import Slider from "./Fields/Slider";
import {types} from "../reducers/journalReducer";
import  {AppContext} from "../App";
import "./JournalPage.scss";
import DatePicker from "./Fields/DatePicker";

const CHUNK_SIZE = 1024 * 1024;

const JournalPage = (props) => {

    const [file1, setFile1] = useState(null);
    const [file2, setFile2] = useState(null);

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
        if(journalPageData.file1ID !== 'empty'){
            let index = 0;
            let promises = [];

            const file1BlobSizeObj = await actor.readEntryFileSize(journalPageData.file1ID);
            const file1BlobSize = parseInt(file1BlobSizeObj.ok);
            while(index < file1BlobSize){
                promises.push(retrieveChunk(journalPageData.file1ID, index));
                index += 1;
            };
            const file1Blob = await Promise.all(promises); 
            console.log(file1Blob);
        };
    
        if(journalPageData.file2ID !== 'empty'){
            const file2Blob = await actor.readEntryFileSize(journalPageData.file2ID);
            console.log(file2Blob);
        };
    },[journalPageData.file1ID, journalPageData.file2ID]);
    
   
    const uploadChunk = async (fileId, chunkId, fileChunk) => {
        console.log(chunkId);
        return actor.createJournalEntryFile(
            fileId, 
            chunkId, 
            [...new Uint8Array(await fileChunk.arrayBuffer())]
        );

    };

    const mapAndSendEntryToApi = async (entryKey, journalEntry) => {

        const entryAsApiObject = [{
            entryTitle: journalEntry.title,
            text: journalEntry.entry,
            location: journalEntry.location,
            date: journalEntry.date,
            lockTime: parseInt(journalEntry.lockTime),
            emailOne: journalEntry.emailOne,
            emailTwo: journalEntry.emailTwo,
            emailThree: journalEntry.emailThree,
            file1ID: journalEntry.file1ID,
            file2ID: journalEntry.file2ID
        }];

        const entryKeyAsApiObject = (entryKey >= 0 && entryKey < journalSize ) ? [{entryKey: entryKey}] : [];
        
        actor.updateJournalEntry(
            entryKeyAsApiObject,
            entryAsApiObject
        );

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

        console.log(results);
    };



    const handleSubmit = useCallback(async () => {
        if(journalPageData.file1ID !== 'empty'){
            await mapAndSendFileToApi(journalPageData.file1ID, file1);
        };
        if(journalPageData.file2ID !== 'empty') {
            await mapAndSendFileToApi(journalPageData.file2ID, file2);
        }
        await mapAndSendEntryToApi(index, journalPageData);
        setSubmissionsMade(submissionsMade + 1);

    }, [journalPageData, file1, file2]);

    console.log(journalPageData);

    return (
        <div className={"journalPageContainer"}>
            <div className={"logoDiv"}>
                <img className={'backButtonImg'} src="back-icon.png" alt="Back Button" onClick={(e) => closePage(e)}/>
                <img className={'logoImg'}src="dtc-logo-black.png" alt="Logo" />
            </div>
            <Slider
                min={0}
                max={120}
                dispatch={journalReducerDispatchFunction}
                dispatchAction={types.CHANGE_LOCK_TIME}
                index={index}
                value={(journalPageData) ? journalPageData.lockTime : '3'}
            />
            <div className={"journalText"} >
                <DatePicker
                    label={"Date: "}
                    rows={"1"}
                    dispatch={journalReducerDispatchFunction}
                    dispatchAction={types.CHANGE_DATE}
                    index={index}
                    value={(journalPageData) ? journalPageData.date : ''}
                />
                <InputBox
                    label={"Location: "}
                    rows={"1"}
                    dispatch={journalReducerDispatchFunction}
                    dispatchAction={types.CHANGE_LOCATION}
                    index={index}
                    value={(journalPageData) ? journalPageData.location : ''}
                />
                <InputBox
                    divClassName={"entry"}
                    label={"Entry: "}
                    rows={"59"}
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
                    dispatchAction={types.CHANGE_FILE1_ID}
                    value={file1}
                    setValue={setFile1}
                    index={index}
                />
                <FileUpload
                    label={'file2'}
                    dispatch={journalReducerDispatchFunction}
                    dispatchAction={types.CHANGE_FILE1_ID}
                    value={file2}
                    setValue={setFile2}
                    index={index}
                />
            </div>
            <div className={'recipientEmailsDiv'}>
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
            </div>
            <div>
                <button type="submit" onClick={handleSubmit}> Submit </button>
            </div>
            
        </div>
    )
};

export default JournalPage;

