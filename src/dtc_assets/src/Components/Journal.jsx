import JournalPage from "./JournalPage";
import React, {useEffect, useReducer, useState, useContext, useMemo } from "react";
import { useLocation } from "react-router-dom";
import journalReducer, {initialState, types} from "../reducers/journalReducer";
import "./Journal.scss";
import { AppContext } from "../App";
import InputBox from "./Fields/InputBox";
import { dayInNanoSeconds, monthInDays } from "../Constants";
import LoadScreen from "./LoadScreen";
import { Modal } from "./Modal";
import ModalContentSubmit from "./modalContent/ModalContentOnSubmit";
import ModalContentNotifications from "./modalContent/ModalContentNotifications";
import { milisecondsToNanoSeconds } from "../Utils";
import { NavBar } from "./navigation/NavBar";
import { MODALS_TYPES } from "../Constants";
import { mapApiObjectToFrontEndJournalEntriesObject } from "../mappers/journalPageMappers";
import { toHexString } from "../Utils";
import { TEST_DATA_FOR_NOTIFICATIONS } from "../testData/notificationsTestData";

const Journal = (props) => {

    const mql = window.matchMedia('(max-width: 480px)');

    const [journalState, dispatch] = useReducer(journalReducer, initialState);

    //clears useLocation().state upon page refresh so that when the user refreshes the page,
    //changes made to this route aren't overrided by the useLocation().state of the previous route.
    window.onbeforeunload = window.history.replaceState(null, '');

    //gets state from previous route
    const location = useLocation();
    //dispatch state from previous route to redux store if that state exists
    if(location.state){
        dispatch({
            actionType: types.SET_ENTIRE_REDUX_STATE,
            payload: location.state
        });
        //wipe previous location state to prevent infinite loop
        location.state = null;
    }
    const [pageIsVisibleArray, setPageIsVisibleArray] = useState(journalState.journal.map((page) => false));
    const [newPageAdded, setNewPageAdded] = useState(false);
    const [modalStatus, setModalStatus] = useState({show: false, which: MODALS_TYPES.onSubmit});
    const [submitSuccessful,setSubmitSuccessful] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const {actor, authClient, setIsLoaded, setSubmissionsMade, submissionsMade} = useContext(AppContext);

    useEffect(async () => {
        if(journalState.reloadStatuses.journalData){
            setIsLoading(true);
            const journal = await actor.readJournal();
            if("err" in journal){
                actor.create().then((result) => {
                    console.log(result);
                    setIsLoading(false);
                });
            } else {
                const journalEntriesObject = mapApiObjectToFrontEndJournalEntriesObject(journal);
                let journalEntries = journalEntriesObject.allEntries;
                let unreadEntries = journalEntriesObject.unreadEntries;

                dispatch({
                    payload: unreadEntries,
                    actionType: types.SET_JOURNAL_UNREAD_ENTRIES
                })

                const journalBio = journal.ok.userJournalData[1];
                const metaData = {email : journal.ok.email, userName: journal.ok.userName};
                
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
                });
                dispatch({
                    actionType: types.SET_JOURNAL_DATA_RELOAD_STATUS,
                    payload: false,
                });
                setIsLoading(false);
            }
        }
        if(journalState.reloadStatuses.nftData){
            const nftCollection = await actor.getUserNFTsInfo();
            console.log(nftCollection);
            dispatch({
                payload: nftCollection,
                actionType: types.SET_NFT_DATA
            });
            dispatch({
                payload: false,
                actionType: types.SET_NFT_DATA_RELOAD_STATUS
            });
            
        }
        if(journalState.reloadStatuses.walletData){
            //Load wallet data in background
            const walletDataFromApi = await actor.readWalletData();
            const walletData = { 
                balance : parseInt(walletDataFromApi.ok.balance.e8s), 
                address: toHexString(new Uint8Array( [...walletDataFromApi.ok.address])) 
            };
            
            dispatch({
                payload: walletData,
                actionType: types.SET_WALLET_DATA
            });

            dispatch({
                actionType: types.SET_WALLET_DATA_RELOAD_STATUS,
                payload: false,
            });
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
        setModalStatus({show:true, which: MODALS_TYPES.onSubmit});
        if("ok" in result){
            setSubmitSuccessful(true);
        } else {
            setSubmitSuccessful(false);
        }
    }

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

    const putCreateEntryButtonInTable = mql.matches && journalState.journal.length < 6;

    console.log(journalState);

    const displayJournalTable = () => {

        return( 
            <>
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
                                    const currentTimeAsInt = milisecondsToNanoSeconds(Date.now());
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
                                {
                                    (putCreateEntryButtonInTable) ?
                                    <table className={"table"}>
                                        <tr className={"tableRowForButton"}>
                                            <td className={"tableCell"}> 
                                                <button className={'addNewEntryButton'} onClick={addJournalPage}> Create New Entry </button>
                                            </td>
                                        </tr>
                                    </table> : null

                                }
                        </div>
                    </div>
                    {   
                        !putCreateEntryButtonInTable ? 
                            <div className={'addNewEntryButtonDiv'}>
                                <button className={'addNewEntryButton'} onClick={addJournalPage}> Create New Entry </button>
                            </div> : null
                    }
                </div>
            </>
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
        setModalStatus({show: !modalStatus.show, which: MODALS_TYPES.notifications});
    };

    const ChildComponent = useMemo(() => {

        let ChildComp = ModalContentSubmit;
        if(modalStatus.which === MODALS_TYPES.notifications) {
            ChildComp = ModalContentNotifications;
        }

        return ChildComp;
    },[modalStatus]);

    return(
        isLoading ? 
        <LoadScreen/> : modalStatus.show ?
        <div className={"container"}>
            <div className={'background'}>
                <Modal 
                    modalStatus={modalStatus} 
                    setModalStatus={setModalStatus} 
                    ChildComponent={ChildComponent}
                    success={submitSuccessful}
                    setSuccess={setSubmitSuccessful}
                    tableContent={journalState.unreadEntries}
                />
            </div>
        </div> : 
        <React.Fragment>
            <>
                { (getIndexOfVisiblePage() < 0) ? 
                     <React.Fragment>
                        <NavBar
                            walletLink={true}
                            journalLink={false}
                            nftLink={true}
                            accountLink={true}
                            dashboardLink={true}
                            notificationIcon={true}
                            unreadNotifications={journalState.unreadEntries.length}
                            toggleDisplayNotifications={toggleDisplayNotifications}
                            journalState={journalState}
                        />
                        {   mql.matches &&
                            <div className={'submitAndLoginButtonsDiv'}>
                                <button className={'addNewEntryButton'} onClick={addJournalPage}> Create New Entry </button>
                                <button className={'loginButton'} onClick={async () => {
                                    await authClient.logout();
                                    setIsLoaded(false);
                                }} > Log Out </button>  
                            </div> 
                        }
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
                        {   mql.matches &&
                            <div className={'submitAndLoginButtonsDiv'}>
                                <button className={'submitButton'} type="submit" onClick={handleSubmit}> Submit </button> 
                            </div> 
                        }
                        {displayJournalTable()}
                        {   !mql.matches &&
                            <div className={'submitAndLoginButtonsDiv'}>
                                <button className={'submitButton'} type="submit" onClick={handleSubmit}> Submit </button>
                                <button className={'loginButton'} onClick={async () => {
                                    await authClient.logout();
                                    setIsLoaded(false);
                                }} > Log Out </button>  
                            </div> 
                        }
                    </React.Fragment> : 
                    <JournalPage
                        journalSize={journalState.journal.length}
                        closePage={closePage}
                        index={getIndexOfVisiblePage()}
                        journalPageData={journalState.journal[getIndexOfVisiblePage()]}
                        journalReducerDispatchFunction={dispatch}
                    /> 
                }
            </>
        </React.Fragment> 
    );

}

export default Journal;