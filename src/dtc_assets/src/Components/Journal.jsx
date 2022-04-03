import JournalPage from "./JournalPage";
import React, {useEffect, useReducer, useState, useContext } from "react";
import journalReducer, {initialState, types} from "../reducers/journalReducer";
import { mapApiObjectToFrontEndObject } from "../mappers/journalPageMappers";
import { Link } from "react-router-dom";
import "./Journal.scss";
import { AppContext } from "../App";
import InputBox from "./Fields/InputBox";
import { dayInNanoSeconds, monthInDays } from "../Constants";
import LoadScreen from "./LoadScreen";
import { Modal } from "./Modal";
import ModalContentSubmit from "./ModalContentOnSubmit";
import ModalContentNotifications from "./ModalContentNotifications";

const Journal = (props) => {

    const mql = window.matchMedia('(max-width: 480px)');

    const [journalState, dispatch] = useReducer(journalReducer, initialState);
    const [pageIsVisibleArray, setPageIsVisibleArray] = useState(journalState.journal.map((page) => false));
    const [newPageAdded, setNewPageAdded] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [submitSuccessful,setSubmitSuccessful] = useState(null);
    const [journalSize, setJournalSize] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const {actor, authClient, setIsLoaded, setSubmissionsMade, submissionsMade} = useContext(AppContext);
    const [displayNotifications, setDisplayNotifications] = useState(false);
    const [unreadJournalEntries, setUnreadJournalEntries] = useState([]);

    useEffect(async () => {
        setIsLoading(true);
        const journal = await actor.readJournal();
        console.log(journal);
        if("err" in journal){
            actor.create().then((result) => {
                console.log(result);
                setIsLoading(false);
            });
        } else {
            let journalEntries = journal.ok.userJournalData[0].map((arrayWithKeyAndPage) => {
                return mapApiObjectToFrontEndObject(arrayWithKeyAndPage[0], arrayWithKeyAndPage[1]);
            });


            journalEntries = journalEntries.sort(function(a,b){
                const dateForAArray = a.date.split('-');
                const yearForA = parseInt(dateForAArray[0]);
                const monthForA = parseInt(dateForAArray[1]);
                const dayForA = parseInt(dateForAArray[2]);

                const dateForBArray = b.date.split('-'); 
                const yearForB = parseInt(dateForBArray[0]);
                const monthForB = parseInt(dateForBArray[1]);
                const dayForB = parseInt(dateForBArray[2]);

                if(yearForA > yearForB){
                    return 1;
                } else if(yearForA < yearForB){
                    return -1;
                } else {
                    if(monthForA > monthForB){
                        return 1;
                    } else if(monthForA < monthForB){
                        return -1;
                    } else {
                        if(dayForA > dayForB){
                            return 1;
                        } else if(dayForA < dayForB){
                            return -1;
                        } else {
                            return 0;
                        }
                    }
                }
            });

            setUnreadJournalEntries(
                journalEntries.filter(entry => !entry.read && 
                    (Date.now() * 1000000 > parseInt(entry.unlockTime)) &&
                    parseInt(entry.lockTime) > 0
                )
            );

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
            setIsLoading(false);
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

    const handleSubmit = async () => {
        setIsLoading(true);
        const result = await actor.updateBio({
            dob: journalState.bio.dob,
            pob: journalState.bio.pob,
            name: journalState.bio.name,
            dedications: journalState.bio.dedications,
            preface: journalState.bio.preface
        });
        setIsLoading(false);
        setShowModal(true);
        if("ok" in result){
            setSubmitSuccessful(true);
        } else {
            setSubmitSuccessful(false);
        }
    }

    const displayJournalTable = () => {

        const openPage = async (e, index, open) => {
            if(open){
                setPageIsVisibleArray(pageIsVisibleArray.map((page, mapIndex) => {
                    if(index === mapIndex){
                        return true;
                    } else {
                        return false;
                    }
                }));
                const entryKey = journalState.journal[index].entryKey;
                const result = await actor.readEntry({entryKey: entryKey});
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

        return( 
            <div>
                <div className={'biographyDiv'}>
                    {mql.matches && <div className={'section2'}>
                        <img src="dtc-logo-black.png" alt="TDTC logo" />
                    </div>}
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
                    {!mql.matches && <div className={'section2'}>
                        <img src="dtc-logo-black.png" alt="TDTC logo" />
                    </div>}
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
                                        const unlockTimeAsInt = page.unlockTime;
                                        const currentTimeAsInt = Date.now() *1000000;
                                        const open = (currentTimeAsInt >= unlockTimeAsInt);
                                        const remainingWaitTime = unlockTimeAsInt - currentTimeAsInt;
                                        const remainingWaitTimeInMonths = remainingWaitTime / (dayInNanoSeconds * monthInDays);
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

    const toggleDisplayNotifications = () => {
        setDisplayNotifications(!displayNotifications);
    };

    const notificationIconSrc = unreadJournalEntries.length ? 'notification-icon-alert.png' : 'notification-icon.png';

    return(
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
        </div> : displayNotifications ? 
        <Modal 
            showModal={displayNotifications} 
            setShowModal={toggleDisplayNotifications} 
            ChildComponent={ModalContentNotifications}
            tableContent={unreadJournalEntries}
        /> :
        <React.Fragment>
            <div className={'linkDiv_Journal'}>
                <nav className={'navBar_Journal'}>
                    <div className="linkContainer">
                        <div className="timeCapsuleLinkDiv">
                            <Link className={"navLink_Journal"} to="/wallet">DTC Wallet</Link>
                        </div>
                        <div className="accountIconLinkDiv">
                            <Link className={"navLink_Journal"} to='/account'>
                                <img src={"account-icon.png"} alt="image preview" className="accountIcon_Journal"/> 
                            </Link>
                        </div>
                        <div className={"notificationIconDiv"}>
                            <img src={notificationIconSrc} onClick={toggleDisplayNotifications}/>
                        </div>
                    </div>
                </nav>
            </div>
            <div>
                { (getIndexOfVisiblePage() < 0) ? 
                     <React.Fragment>
                        {displayJournalTable()}
                        <div className={'submitAndLoginButtonsDiv'}>
                            <button className={'submitButton'} type="submit" onClick={handleSubmit}> Submit </button>
                            <button className={'loginButton'} onClick={async () => {
                                await authClient.logout();
                                setIsLoaded(false);
                            }} > Log Out </button>  
                        </div> 
                    </React.Fragment> : 
                    <JournalPage
                        journalSize={journalSize}
                        closePage={closePage}
                        index={getIndexOfVisiblePage()}
                        journalPageData={journalState.journal[getIndexOfVisiblePage()]}
                        journalReducerDispatchFunction={dispatch}
                    /> 
                }
            </div>
        </React.Fragment> 
    );

}

export default Journal;