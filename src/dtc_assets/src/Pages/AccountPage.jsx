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



const AccountSection = (props) => {

    const { journalState, dispatch } = useContext(AppContext);
    const [pageChangesMade, setPageChangesMade] = useState(false);    

    const handleUpdate = async () => {
        setPageChangesMade(false);
        dispatch({
            actionType: types.SET_IS_LOADING,
            payload: true
        });
        const profileInput = {
            userName: (journalState.metaData.userName[0]) ? journalState.metaData.userName: [],
            email: (journalState.metaData.email[0]) ? journalState.metaData.email: []
        };
        let result = await journalState.actor.updateProfile(profileInput);
        dispatch({
            actionType: types.SET_IS_LOADING,
            payload: false
        });

    };
    const isAdmin = journalState.metaData.userName[0] === 'admin';

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
            nftLink={true}
            accountLink={false}
            dashboardLink={true}
            notificationIcon={false}
            context={UI_CONTEXTS.ACCOUNT_PAGE}
        />
        {journalState.isLoading ?
            <LoadScreen/> :
            <div className={`logoDiv account ${isAdmin ? 'admin' : ''}`}>
                <img className={'logoImg'}src="dtc-logo-black.png" alt="Logo"/>
                <div className={`subscriptionSection ${isAdmin ? 'admin_' : ''}`}>
                    <InputBox
                        divClassName={"email"}
                        setChangesWereMade={setPageChangesMade}
                        label={"Email: "}
                        rows={"1"}
                        dispatch={dispatch}
                        dispatchAction={types.CHANGE_EMAIL}
                        value={journalState.metaData.email}
                    />
                    <InputBox
                        divClassName={"userName"}
                        setChangesWereMade={setPageChangesMade}
                        label={"Username: "}
                        rows={"1"}
                        dispatch={dispatch}
                        dispatchAction={types.CHANGE_USERNAME}
                        value={journalState.metaData.userName}
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