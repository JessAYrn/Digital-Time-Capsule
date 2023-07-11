import JournalPage from "./JournalPage";
import React, { useContext, useEffect, useState } from "react";
import {types} from "../../reducers/journalReducer";
import "./Journal.scss";
import { AppContext } from "../App";
import InputBox from "../../Components/Fields/InputBox";
import * as AiIcons from 'react-icons/ai';
import ButtonField from "../../Components/Fields/Button";
import LoadScreen from "./LoadScreen";
import { Modal } from "./modalContent/Modal";
import { NavBar } from "../../Components/navigation/NavBar";
import { MODALS_TYPES, NULL_STRING_ALL_LOWERCASE } from "../../functionsAndConstants/Constants";
import { UI_CONTEXTS } from "../../functionsAndConstants/Contexts";
import { dateAisLaterThanOrSameAsDateB, getDateAsString } from "../../functionsAndConstants/Utils";
import FileCarousel from "../../Components/Fields/fileManger/FileCarousel";
import { fileLoaderHelper } from "../../functionsAndConstants/loadingFunctions";
import "../../SCSS/scrollable.scss";
import "../../SCSS/contentContainer.scss";

const Journal = (props) => {

    const { journalState, journalDispatch, actorState, actorDispatch} = useContext(AppContext);
    const [photosLoaded, setPhotosLoaded] = useState(false);
    const [pageChangesMade, setPageChangesMade] = useState(false); 
    
    useEffect(async () => {
        if(photosLoaded) return;
        const promises = [];

        journalState.bio.photos.forEach((fileData, fileIndex) => {
            if(fileData.fileName === NULL_STRING_ALL_LOWERCASE) return;
            if(fileData.file) return;
            promises.push(fileLoaderHelper(
                fileData, 
                fileIndex,
                null,
                actorState,
                journalDispatch,
                types.CHANGE_FILE_LOAD_STATUS_JOURNAL_COVER_PAGE,
                types.SET_FILE_JOURNAL_COVER_PAGE
            ));
        });
        if(promises.length) setPhotosLoaded(true);
        const result = await Promise.all(promises);
    },[journalState.bio.photos]);


    const handleSubmit = async () => {
        setPageChangesMade(false);
        journalDispatch({
            actionType: types.SET_IS_LOADING,
            payload: true
        });
        const result = await actorState.backendActor.updateBio({
            dob: journalState.bio.dob,
            pob: journalState.bio.pob,
            name: journalState.bio.name,
            dedications: journalState.bio.dedications,
            preface: journalState.bio.preface,
            photos: journalState.bio.photos
        });
        journalDispatch({
            actionType: types.SET_IS_LOADING,
            payload: false
        });
        
        if("ok" in result){
            journalDispatch({
                actionType: types.SET_MODAL_STATUS,
                payload: {show:true, which: MODALS_TYPES.onSubmit, success: true}
            });
        } else {
            journalDispatch({
                actionType: types.SET_MODAL_STATUS,
                payload: {show:true, which: MODALS_TYPES.onSubmit, success: false}
            });
        }
    };

    const openPage = async (e, index, unlocked) => {
        if(unlocked){
            journalDispatch({
                actionType: types.CHANGE_PAGE_IS_OPEN,
                payload: true,
                index: index
            });
        }
    };

    const addJournalPage = () => {
        //Ensures that there are no unsubmitted entries left over from a previous post
        actorState.backendActor.clearUnsubmittedFiles();
        journalDispatch({
            actionType: types.ADD_JOURNAL_PAGE
        });
    }

    const displayJournalTable = () => {

        return( 
            <>
                <div 
                    className={'tableDivContainer contentContainer'}
                >
                    <div className={'tableDiv journal'}>
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
                        </div>
                    </div>
                </div>
            </>
        );
    };

    const getIndexOfVisiblePage = () => {
        return journalState.journal.findIndex(page => page.isOpen === true);
    }

    return(
        journalState.modalStatus.show ?
        <div className={"container journal"}>
            <Modal 
                context={UI_CONTEXTS.JOURNAL}
                index={getIndexOfVisiblePage()}
            />
        </div> : 
        <React.Fragment>
            <>
                { (getIndexOfVisiblePage() < 0) ? 
                    <div className={"container journal"}>
                        <NavBar
                            walletLink={true}
                            journalLink={false}
                            accountLink={true}
                            dashboardLink={true}
                            notificationIcon={true}
                            unreadNotifications={journalState.notifications}
                            context={UI_CONTEXTS.JOURNAL}
                        />
                        {journalState.isLoading ? 
                        <LoadScreen/> : 
                        <div className={"container__Journal"}>
                            <div className={'biography'}>
                                <div className={"contentContainer "}>
                                    <InputBox
                                        label={"This Journal Belongs To: "}
                                        setChangesWereMade={setPageChangesMade}
                                        rows={"1"}
                                        dispatch={journalDispatch}
                                        dispatchAction={types.CHANGE_NAME}
                                        value={journalState.bio.name}
                                    />
                                </div>
                                <div className={"contentContainer "}>
                                    <InputBox
                                        label={"Date of Birth: "}
                                        setChangesWereMade={setPageChangesMade}
                                        rows={"1"}
                                        dispatch={journalDispatch}
                                        dispatchAction={types.CHANGE_DOB}
                                        value={journalState.bio.dob}
                                    />
                                </div>
                                <div className={"contentContainer "}>
                                    <InputBox
                                        label={"Place of Birth: "}
                                        setChangesWereMade={setPageChangesMade}
                                        rows={"1"}
                                        dispatch={journalDispatch}
                                        dispatchAction={types.CHANGE_POB}
                                        value={journalState.bio.pob}
                                    />
                                </div>
                                <div 
                                    className={'coverPhotoDiv contentContainer'}
                                >
                                    <FileCarousel
                                        videoHeight = {'330'}
                                        filesMetaDataArray={journalState.bio.photos}
                                        journalState={journalState}
                                        actorState={actorState}
                                        actorDispatch={actorDispatch}
                                        setChangesWereMade={setPageChangesMade}
                                        journalDispatch={journalDispatch}
                                        dispatchActionToAddFile={types.ADD_COVER_PHOTO}
                                        dispatchActionToDeleteFile={types.REMOVE_COVER_PHOTO}
                                        classNameMod={'coverPhoto'}
                                        dispatchActionToChangeFileMetaData={types.CHANGE_FILE_METADATA_JOURNAL_COVER_PAGE}
                                        dispatchActionToChangeFileLoadStatus={types.CHANGE_FILE_LOAD_STATUS_JOURNAL_COVER_PAGE}
                                    />
                                </div>
                                <div className={"contentContainer "}>
                                    <InputBox
                                        divClassName={'dedications'}
                                        setChangesWereMade={setPageChangesMade}
                                        label={"Dedications: "}
                                        rows={"8"}
                                        dispatch={journalDispatch}
                                        dispatchAction={types.CHANGE_DEDICATIONS}
                                        value={journalState.bio.dedications}
                                    />
                                </div>
                                <div className={"contentContainer "}>
                                    <InputBox
                                        divClassName={'preface'}
                                        setChangesWereMade={setPageChangesMade}
                                        label={"Preface: "}
                                        rows={"29"}
                                        dispatch={journalDispatch}
                                        dispatchAction={types.CHANGE_PREFACE}
                                        value={journalState.bio.preface}
                                    />
                                </div>
                                {displayJournalTable()}
                            </div>
                            {
                                pageChangesMade &&
                                <ButtonField
                                    text={'Submit'}
                                    className={'submitButtonDiv'}
                                    onClick={handleSubmit}
                                    withBox={true}
                                />
                            }
                            <ButtonField
                                Icon={AiIcons.AiFillFileAdd}
                                iconSize={25}
                                className={'addPageDiv'}
                                onClick={addJournalPage}
                                withBox={true}
                            />
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