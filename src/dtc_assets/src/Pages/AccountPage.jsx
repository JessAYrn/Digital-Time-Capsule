import React, { useContext, useState } from 'react';
import  InputBox  from '../Components/Fields/InputBox';
import { types } from '../reducers/journalReducer'
import AdminSection from '../Components/AdminSection';
import "./AccountPage.scss";
import "./SubscriptionPage.scss";
import { AppContext } from '../Routes/Account';
import { NavBar } from '../Components/navigation/NavBar';
import { UI_CONTEXTS } from '../Contexts';
import LoadScreen from '../Components/LoadScreen';
import { Modal } from '../Components/Modal';
import { walletInitialState, walletTypes } from '../reducers/walletReducer';
import accountReducer, { accountInitialState, accountTypes } from '../reducers/accountReducer';


const AccountSection = (props) => {

    const { journalState, journalDispatch, accountDispatch, accountState, actorState } = useContext(AppContext);
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
    const isAdmin = accountState?.metaData?.userName[0] === 'admin';

return(
    journalState.modalStatus.show ?
    <div className={"container__accountPage"}>
        <Modal 
            context={UI_CONTEXTS.ACCOUNT_PAGE}
        />
    </div> : 
    <div className='container__accountPage'>
        <NavBar
            walletLink={true}
            journalLink={true}
            accountLink={false}
            dashboardLink={true}
            notificationIcon={false}
            context={UI_CONTEXTS.ACCOUNT_PAGE}
        />
        {accountState.isLoading ?
            <LoadScreen/> :
            <div className={`logoDiv account ${isAdmin ? 'admin' : ''}`}>
                <img className={'logoImg'}src="dtc-logo-black.png" alt="Logo"/>
                <div className={`subscriptionSection ${isAdmin ? 'admin_' : ''}`}>
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
                    {isAdmin && <AdminSection/>}
                </div> 
            </div>}
            {
                pageChangesMade &&
                <div className={"submitButtonDiv"} onClick={handleUpdate}>
                        Submit 
                </div>
            }
    </div>
)

};

export default AccountSection;