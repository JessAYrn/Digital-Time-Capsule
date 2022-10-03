import React, { useContext } from 'react';
import  InputBox  from './Fields/InputBox';
import { types } from '../reducers/journalReducer'
import AdminSection from './AdminSection';
import "./AccountPage.scss";
import "./SubscriptionPage.scss";
import { AppContext } from '../Account';
import { NavBar } from './navigation/NavBar';
import { UI_CONTEXTS } from '../Contexts';



const SubcriptionPage = (props) => {

    const { journalState, dispatch } = useContext(AppContext);

    const handleUpdate = async () => {

        const profileInput = {
            userName: (journalState.metaData.userName[0]) ? journalState.metaData.userName: [],
            email: (journalState.metaData.email[0]) ? journalState.metaData.email: []
        };
        let result = await journalState.actor.updateProfile(profileInput);
        // if("err" in result){
        //     showErrorMessage();
        // };

    };

    const isAdmin = journalState.metaData.userName[0] === 'admin';

return(
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
        <div className={`logoDiv ${isAdmin ? 'admin' : ''}`}>
            <img className={'logoImg'}src="../../assets/dtc-logo-black.png" alt="Logo"/>
            <div className={`subscriptionSection ${isAdmin ? 'admin_' : ''}`}>
                <InputBox
                    divClassName={"email"}
                    label={"Email: "}
                    rows={"1"}
                    dispatch={dispatch}
                    dispatchAction={types.CHANGE_EMAIL}
                    value={journalState.metaData.email}
                />
                <InputBox
                    divClassName={"userName"}
                    label={"Username: "}
                    rows={"1"}
                    dispatch={dispatch}
                    dispatchAction={types.CHANGE_USERNAME}
                    value={journalState.metaData.userName}
                />
                <div className={'updateButtonDiv'}>
                    <button className={'updateButton'} type="submit" onClick={handleUpdate}> Update Username & Email </button>
                </div>
                {isAdmin && <AdminSection/>}
            </div> 
        </div>
    </div>
)

};

export default SubcriptionPage;