import React, { useContext, useState } from 'react';
import  InputBox  from '../../Components/Fields/InputBox';
import "./AccountPage.scss";
import "./SubscriptionPage.scss";
import { AppContext } from '../Account';
import { NavBar } from '../../Components/navigation/NavBar';
import { UI_CONTEXTS } from '../../functionsAndConstants/Contexts';
import LoadScreen from './LoadScreen';
import { Modal } from './modalContent/Modal';
import  { accountTypes } from '../../reducers/accountReducer';


const AccountSection = (props) => {

    const { 
        accountDispatch, accountState, actorState, modalState, modalDispatch 
    } = useContext(AppContext);
    const [pageChangesMade, setPageChangesMade] = useState(false); 

    const handleUpdate = async () => {
        setPageChangesMade(false);
        accountDispatch({
            actionType: accountTypes.SET_IS_LOADING,
            payload: true
        });
        const profileInput = {
            userName: (accountState.metaData.userName[0]) ? accountState.metaData.userName: [],
            email: (accountState.metaData.email[0]) ? accountState.metaData.email: []
        };
        let result = await actorState.backendActor.updateProfile(profileInput);
        accountDispatch({
            actionType: accountTypes.SET_IS_LOADING,
            payload: false
        });

    };

return(
    modalState.modalStatus.show ?
    <div className={"container__accountPage"}>
        <Modal 
            context={UI_CONTEXTS.ACCOUNT_PAGE}
        />
    </div> : 
    <>
        <NavBar
            walletLink={true}
            journalLink={true}
            accountLink={false}
            dashboardLink={true}
            notificationIcon={false}
            context={UI_CONTEXTS.ACCOUNT_PAGE}
        />
        <div className='container__accountPage'>
        {modalState.isLoading ?
            <LoadScreen/> :
            <div className={`logoDiv account`}>
                <img className={'logoImg'}src="dtc-logo-black.png" alt="Logo"/>
                <div className={`subscriptionSection `}>
                    <InputBox
                        divClassName={"email"}
                        setChangesWereMade={setPageChangesMade}
                        label={"Email: "}
                        rows={"1"}
                        dispatch={accountDispatch}
                        dispatchAction={accountTypes.CHANGE_EMAIL}
                        value={accountState.metaData.email}
                    />
                    <InputBox
                        divClassName={"userName"}
                        setChangesWereMade={setPageChangesMade}
                        label={"Username: "}
                        rows={"1"}
                        dispatch={accountDispatch}
                        dispatchAction={accountTypes.CHANGE_USERNAME}
                        value={accountState.metaData.userName}
                    />
                </div> 
            </div>}
            {
                pageChangesMade &&
                <div className={"submitButtonDiv"} onClick={handleUpdate}>
                        Submit 
                </div>
            }
    </div>
    </>
)

};

export default AccountSection;