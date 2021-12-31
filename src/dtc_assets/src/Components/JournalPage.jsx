import React, {useState, useContext, useEffect, useCallback} from "react";
import FileUpload from "./Fields/FileUpload";
import InputBox from "./Fields/InputBox";
import Slider from "./Fields/Slider";
import {types} from "../reducers/journalReducer";
import  {AppContext} from "../App";
import "./JournalPage.scss";

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

    useEffect( async () => {
        
        await actor.readJournal();
    }, [actor, file1, file2]);

    const uploadChunk = async (fileId, chunkId, fileChunk) => {

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
            lockTime: journalEntry.lockTime,
            emailOne: journalEntry.emailOne,
            emailTwo: journalEntry.emailTwo,
            emailThree: journalEntry.emailThree
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


        while(chunk <= chunks - 1){    
            
            const from = chunk * CHUNK_SIZE;
            const to = from + CHUNK_SIZE;

            const fileChunk = (to < fileSize -1) ? file.slice(from,to ) : file.slice(from);

            const chunkId = `chunk-number-${chunk}`;
            promises.push(uploadChunk(fileId, chunkId, fileChunk));

            chunk += 1;
        };

        const results = await Promise.all(promises);    
    };



    const handleSubmit = useCallback(async () => {
        await mapAndSendEntryToApi(index, journalPageData);
        setSubmissionsMade(submissionsMade + 1);
        console.log('Reading Journal: ',await actor.readJournal());
        // await mapAndSendFileToApi("test1", file1);
        // await mapAndSendFileToApi("test2", file2);

    }, [journalPageData, file1, file2]);

    console.log(journalPageData);

    return (
        <div className={"journalPageContainer"}>
            <div className={"logoDiv"}>
                <img className={'backButtonImg'} src="back-icon.png" alt="Back Button" onClick={(e) => closePage(e)}/>
                <img className={'logoImg'}src="dtc-logo-black.png" alt="Logo" />
            </div>
            <Slider
                min={3}
                max={120}
                dispatch={journalReducerDispatchFunction}
                dispatchAction={types.CHANGE_LOCK_TIME}
                index={index}
                value={journalPageData.lockTime}
            />
            <div className={"journalText"} >
                <InputBox
                    label={"Date: "}
                    rows={"1"}
                    dispatch={journalReducerDispatchFunction}
                    dispatchAction={types.CHANGE_DATE}
                    index={index}
                    value={journalPageData.date}
                />
                <InputBox
                    label={"Location: "}
                    rows={"1"}
                    dispatch={journalReducerDispatchFunction}
                    dispatchAction={types.CHANGE_LOCATION}
                    index={index}
                    value={journalPageData.location}
                />
                <InputBox
                    divClassName={"entry"}
                    label={"Entry: "}
                    rows={"59"}
                    dispatch={journalReducerDispatchFunction}
                    dispatchAction={types.CHANGE_ENTRY}
                    index={index}
                    value={journalPageData.entry}
                />
            </div>
            <div className={"journalImages"}>
                <FileUpload
                    label={'file1'}
                    value={file1}
                    setValue={setFile1}
                    index={index}
                />
                <FileUpload
                    label={'file2'}
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
                    value={journalPageData.emailOne}
                />
                <InputBox
                    label={"2nd Recipient Email: "}
                    rows={"1"}
                    dispatch={journalReducerDispatchFunction}
                    dispatchAction={types.CHANGE_RECIPIENT_EMAIL_TWO}
                    index={index}
                    value={journalPageData.emailTwo}
                />
                <InputBox
                    label={"3rd Recipient Email: "}
                    rows={"1"}
                    dispatch={journalReducerDispatchFunction}
                    dispatchAction={types.CHANGE_RECIPIENT_EMAIL_THREE}
                    index={index}
                    value={journalPageData.emailThree}
                />
            </div>
            <div>
                <button type="submit" onClick={handleSubmit}> Submit </button>
            </div>
            
        </div>
    )
};

export default JournalPage;

