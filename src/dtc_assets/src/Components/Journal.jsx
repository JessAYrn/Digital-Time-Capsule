import JournalPage from "./JournalPage";
import React, { useContext, useEffect, useMemo } from "react";
import {initialState, types} from "../reducers/journalReducer";
import "./Journal.scss";
import { AppContext } from "../App";
import InputBox from "./Fields/InputBox";
import { dayInNanoSeconds, monthInDays } from "../Constants";
import LoadScreen from "./LoadScreen";
import { Modal } from "./Modal";
import { NavBar } from "./navigation/NavBar";
import { MODALS_TYPES } from "../Constants";
import { UI_CONTEXTS } from "../Contexts";
import { getIntObserverFunc, visibilityFunctionDefault } from "./animations/IntersectionObserverFunctions";
import { dateAisLaterThanOrSameAsDateB, getDateAsString, getDateInMilliseconds } from "../Utils";

const Journal = (props) => {

    const mql = window.matchMedia('(max-width: 650px)');
    const { journalState, dispatch} = useContext(AppContext);

    const handleSubmit = async () => {
        dispatch({
            actionType: types.SET_IS_LOADING,
            payload: true
        });
        const result = await journalState.actor.updateBio({
            dob: journalState.bio.dob,
            pob: journalState.bio.pob,
            name: journalState.bio.name,
            dedications: journalState.bio.dedications,
            preface: journalState.bio.preface
        });
        dispatch({
            actionType: types.SET_IS_LOADING,
            payload: false
        });
        
        if("ok" in result){
            dispatch({
                actionType: types.SET_MODAL_STATUS,
                payload: {show:true, which: MODALS_TYPES.onSubmit, success: true}
            });
        } else {
            dispatch({
                actionType: types.SET_MODAL_STATUS,
                payload: {show:true, which: MODALS_TYPES.onSubmit, success: false}
            });
        }
    }

    const openPage = async (e, index, unlocked) => {
        if(unlocked){
            dispatch({
                actionType: types.CHANGE_PAGE_IS_OPEN,
                payload: true,
                index: index
            });
        }
    };

    const addJournalPage = () => {
        //Ensures that there are no unsubmitted entries left over from a previous post
        journalState.actor.clearUnsubmittedFiles();
        dispatch({
            actionType: types.ADD_JOURNAL_PAGE
        });
    }

    const putCreateEntryButtonInTable = mql.matches && journalState.journal.length < 6;

    useEffect(() => {
        const containers = document.querySelectorAll(".contentContainer.animatedLeft");
        containers.forEach( (container, index) => {
            let props_ = {
                className: "animatedLeft",
                containerIndex: index,
                visibilityFunction: visibilityFunctionDefault
            };
            const observer = new IntersectionObserver(getIntObserverFunc(props_), {threshold: .05});
            observer.observe(container);
        });
    }, [journalState]);

    let animatedLeftElementIndex = 0;

    const displayJournalTable = () => {

        return( 
            <>
                <div 
                    className={'tableDivContainer contentContainer animatedLeft' + 
                    ` _${animatedLeftElementIndex++}`}
                >
                    <div className={'tableDiv '}>
                        <table className={"tableHeader "}>
                            <tbody>
                                <tr className={"tableRow "}>
                                    <th className={"tableCell "}>DATE</th>
                                    <th className={"tableCell "}>LOCATION</th>
                                    <th className={"tableCell "}>AVAILABLE</th>
                                    <th className={"tableCell "}></th>

                                </tr>
                            </tbody>
                        </table>
                        <div className='scrollable '>
                            <table className={"table"}>
                                <tbody>
                                    { journalState.journal.map((page, index) => {
                                        let today = getDateAsString();
                                        const unlocked = dateAisLaterThanOrSameAsDateB(today, page.unlockTime);
                                        const openButton = (unlocked) ? 'Open' : 'Locked';
                                        return(
                                            <tr className={"tableRow "+index} key={index}>
                                                <td className={"tableCell "+index}>{page.date}</td>
                                                <td className={"tableCell "+index}>{page.location}</td>
                                                <td className={"tableCell "+index}>{page.unlockTime}  </td>
                                                <td className={"tableCell "+index}> <button className={'openButton'} onClick={(e) => openPage(e, index, unlocked)}> {openButton} </button> </td>
                                            </tr>  
                                        );
                                    }) }
                                </tbody>
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
        return journalState.journal.findIndex(page => page.isOpen === true);
    }

    return(
        journalState.modalStatus.show ?
        <div className={"container"}>
            <Modal 
                context={UI_CONTEXTS.JOURNAL}
                index={getIndexOfVisiblePage()}
            />
        </div> : 
        <React.Fragment>
            <>
                { (getIndexOfVisiblePage() < 0) ? 
                    <div className={"container"}>
                        <NavBar
                            walletLink={true}
                            journalLink={false}
                            nftLink={true}
                            accountLink={true}
                            dashboardLink={true}
                            notificationIcon={true}
                            unreadNotifications={journalState.unreadEntries.length}
                            context={UI_CONTEXTS.JOURNAL}
                        />
                        {journalState.isLoading ? 
                        <LoadScreen/> : 
                        <div className={"container__Journal"}>
                            <div className={"section__1"}>
                                {   mql.matches &&
                                    <div className={'submitAndLoginButtonsDiv animatedLeft contentContainer '+` _${animatedLeftElementIndex++}`}>
                                        <button className={'addNewEntryButton '} onClick={addJournalPage}> Create New Entry </button> 
                                    </div> 
                                }
                                <div className={'biography'}>
                                    {mql.matches && <div className={'coverPhotoDiv contentContainer animatedLeft '+` _${animatedLeftElementIndex++}`}>
                                        <img className={'coverPhoto'} src="dtc-logo-black.png" alt="TDTC logo" />
                                    </div>}
                                    <div className={"contentContainer animatedLeft"+` _${animatedLeftElementIndex++}`}>
                                        <InputBox
                                            label={"This Journal Belongs To: "}
                                            rows={"1"}
                                            dispatch={dispatch}
                                            dispatchAction={types.CHANGE_NAME}
                                            value={journalState.bio.name}
                                        />
                                    </div>
                                    <div className={"contentContainer animatedLeft"+` _${animatedLeftElementIndex++}`}>
                                        <InputBox
                                            label={"Date of Birth: "}
                                            rows={"1"}
                                            dispatch={dispatch}
                                            dispatchAction={types.CHANGE_DOB}
                                            value={journalState.bio.dob}
                                        />
                                    </div>
                                    <div className={"contentContainer animatedLeft"+` _${animatedLeftElementIndex++}`}>
                                        <InputBox
                                            label={"Place of Birth: "}
                                            className={"animatedLeft"}
                                            rows={"1"}
                                            dispatch={dispatch}
                                            dispatchAction={types.CHANGE_POB}
                                            value={journalState.bio.pob}
                                        />
                                    </div>
                                    <div className={"contentContainer animatedLeft"+` _${animatedLeftElementIndex++}`}>
                                        <InputBox
                                            divClassName={'dedications'}
                                            label={"Dedications: "}
                                            rows={"8"}
                                            dispatch={dispatch}
                                            dispatchAction={types.CHANGE_DEDICATIONS}
                                            value={journalState.bio.dedications}
                                        />
                                    </div>
                                    <div className={"contentContainer animatedLeft"+` _${animatedLeftElementIndex++}`}>
                                        <InputBox
                                            divClassName={'preface'}
                                            label={"Preface: "}
                                            rows={"24"}
                                            dispatch={dispatch}
                                            dispatchAction={types.CHANGE_PREFACE}
                                            value={journalState.bio.preface}
                                        />
                                    </div>
                                </div>
                                <div className={'submitAndLoginButtonsDiv animatedLeft contentContainer'+` _${animatedLeftElementIndex++}`}>
                                    <button className={'submitButton'} type="submit" onClick={handleSubmit}> Submit </button> 
                                </div> 
                            </div>
                            <div className={"section__2"}>
                                {!mql.matches && 
                                <div 
                                    className={'coverPhotoDiv contentContainer animatedLeft'+ 
                                    ` _${animatedLeftElementIndex++}`}
                                >
                                    <img className={'coverPhoto'} src="dtc-logo-black.png" alt="TDTC logo" />
                                </div>}
                                {displayJournalTable()}
                            </div>
                        </div> }
                    </div> : 
                    <JournalPage
                        index={getIndexOfVisiblePage()}
                    /> 
                }
            </>
        </React.Fragment> 
    );

}

export default Journal;