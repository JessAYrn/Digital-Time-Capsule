import JournalPage from "./JournalPage";
import React, {useEffect, useReducer, useState, useContext } from "react";
import journalReducer, {initialState, types} from "../reducers/journalReducer";
import { mapApiObjectToFrontEndObject } from "../mappers/journalPageMappers";
import "./Journal.scss";
import { AppContext } from "../App";
import InputBox from "./Fields/InputBox";
import { dayInSeconds, monthInDays } from "../Constants";


const Journal = (props) => {

    const [journalState, dispatch] = useReducer(journalReducer, initialState);
    const [pageIsVisibleArray, setPageIsVisibleArray] = useState(journalState.journal.map((page) => false));
    const [newPageAdded, setNewPageAdded] = useState(false);
    const [journalSize, setJournalSize] = useState(0);
    const {actor, authClient, setIsLoaded, setSubmissionsMade, submissionsMade} = useContext(AppContext);

    useEffect(async () => {
        const journal = await actor.readJournal();
        console.log(journal);
        if("err" in journal){
            actor.create({
                userName: "admin",
                email: "admin@test.com"
        }).then((result) => {
                console.log(result);
            });
        } else {
            const journalEntries = journal.ok.userJournalData[0].map((arrayWithKeyAndPage) => {
                return mapApiObjectToFrontEndObject(arrayWithKeyAndPage[1]);
            });
            const journalBio = journal.ok.userJournalData[1];
            const metaData = {email : journal.ok.email, userName: journal.ok.userName};
            
            setJournalSize(journal.length);
            dispatch({
                payload: metaData,
                actionType: types.SET_METADATA
            })
            dispatch({
                payload: journalBio,
                actionType: types.SET_BIO
            })
            dispatch({
                payload: journalEntries,
                actionType: types.SET_JOURNAL
            })
        }
    },[actor, submissionsMade, authClient])

    useEffect(() => {
        setPageIsVisibleArray(journalState.journal.map((page, index) => { 

            if((index === journalState.journal.length -1) && newPageAdded){
                setNewPageAdded(false);
                return true;
            } else {
                return false;
            }
        }));
    },[journalState.journal.length]);

    const displayJournalTable = () => {

        const openPage = (e, index, open) => {
            if(open){
                setPageIsVisibleArray(pageIsVisibleArray.map((page, mapIndex) => {
                    if(index === mapIndex){
                        return true;
                    } else {
                        return false;
                    }
                }))
            } else {
                () => {}
            }
        };

        const addJournalPage = () => {
            dispatch({
                actionType: types.ADD_JOURNAL_PAGE
            });
            setNewPageAdded(true);
            openPage(null, journalState.journal.length - 1);
        }

        const handleSubmit = async () => {
            const result = await actor.updateBio({
                dob: journalState.bio.dob,
                pob: journalState.bio.pob,
                name: journalState.bio.name,
                dedications: journalState.bio.dedications,
                preface: journalState.bio.preface
            });
            console.log(result);
        }

        return(
            <div>
                <div className={'biographyDiv'}>
                    <div className={'section1'}>
                        <InputBox
                            label={"This Journal Belongs To: "}
                            rows={"1"}
                            dispatch={dispatch}
                            dispatchAction={types.CHANGE_NAME}
                            value={journalState.bio.name}
                        />
                        <InputBox
                            label={"Date of Birth: "}
                            rows={"1"}
                            dispatch={dispatch}
                            dispatchAction={types.CHANGE_DOB}
                            value={journalState.bio.dob}
                        />
                        <InputBox
                            label={"Place of Birth: "}
                            rows={"1"}
                            dispatch={dispatch}
                            dispatchAction={types.CHANGE_POB}
                            value={journalState.bio.pob}
                        />
                        <InputBox
                            divClassName={'dedications'}
                            label={"Dedications: "}
                            rows={"8"}
                            dispatch={dispatch}
                            dispatchAction={types.CHANGE_DEDICATIONS}
                            value={journalState.bio.dedications}
                        />
                    </div>
                    <div className={'section2'}>
                        <img src="dtc-logo-black.png" alt="TDTC logo" />
                    </div>
                    <div className={'prefaceDiv'}>
                        <InputBox
                            divClassName={'preface'}
                            label={"Preface: "}
                            rows={"24"}
                            dispatch={dispatch}
                            dispatchAction={types.CHANGE_PREFACE}
                            value={journalState.bio.preface}
                        />
                    </div>
                    <div className={'tableDivContainer'}>
                        <div className={'tableDiv'}>
                            <table className={"tableHeader"}>
                                <tr className={"tableRow "}>
                                    <th className={"tableCell "}>DATE</th>
                                    <th className={"tableCell "}>LOCATION</th>
                                    <th className={"tableCell "}>TIME LAPSED</th>
                                    <th className={"tableCell "}></th>

                                </tr>
                            </table>
                            <div class='scrollable'>
                                <table className={"table"}>
                                    { journalState.journal.map((page, index) => {
                                        const unlockTimeAsInt = parseInt(page.unlockTime);
                                        const currentTimeAsInt = Date.now();
                                        const open = (currentTimeAsInt >= unlockTimeAsInt);
                                        const remainingWaitTime = unlockTimeAsInt - currentTimeAsInt;
                                        const remainingWaitTimeInMonths = remainingWaitTime / (dayInSeconds * monthInDays);
                                        const timeLapsed = page.lockTime - remainingWaitTimeInMonths;
                                        const timeLapsedRound = Math.round(timeLapsed * 100) / 100;
                                        const openButton = (open) ? 'Open' : 'Locked';
                                        return(
                                            <tr className={"tableRow "+index}>
                                                <td className={"tableCell "+index}>{page.date}</td>
                                                <td className={"tableCell "+index}>{page.location}</td>
                                                <td className={"tableCell "+index}> {timeLapsedRound} / {page.lockTime} mo.</td>
                                                <td className={"tableCell "+index}> <button className={'openButton'} onClick={(e) => openPage(e, index, open)}> {openButton} </button> </td>
                                            </tr>  
                                        );
                                    }) }
                                </table>
                            </div>
                        </div>
                        <div className={'addNewEntryButtonDiv'}>
                            <button className={'addNewEntryButton'} onClick={addJournalPage}> Create New Entry </button>
                        </div>
                    </div>
                    <div>
                        <button type="submit" onClick={handleSubmit}> Submit </button>
                    </div>

                </div>
            </div>
        );
    };

    const getIndexOfVisiblePage = () => {
        return pageIsVisibleArray.findIndex(page => page === true);
    }
    const closePage = (e, index) => {
        setPageIsVisibleArray(pageIsVisibleArray.map((page, mapIndex) => {
                return false;
        }))
    };

    return(
        <React.Fragment>
            <div>
                { (getIndexOfVisiblePage() < 0) ? 
                    displayJournalTable() : 
                    <JournalPage
                    journalSize={journalSize}
                    closePage={closePage}
                    index={getIndexOfVisiblePage()}
                    journalPageData={journalState.journal[getIndexOfVisiblePage()]}
                    journalReducerDispatchFunction={dispatch}
                /> }
                <button className={'loginButtonDiv'} onClick={async () => {
                    await authClient.logout();
                    setIsLoaded(false);
                }} > Log Out </button>   
            </div>
        </React.Fragment>
    );

}

export default Journal;