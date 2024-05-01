import React, { useContext, useState } from 'react';
import  InputBox  from '../../Components/Fields/InputBox';
import "./AccountPage.scss";
import "./SubscriptionPage.scss";
import { AppContext } from '../../Context';
import { NavBar } from '../../Components/navigation/NavBar';
import  { accountTypes } from '../../reducers/accountReducer';


const AccountSection = (props) => {

    const { 
        accountDispatch, 
        accountState, 
        actorState 
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
    <>
        <NavBar/>
        <div className='container__accountPage'>
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
            </div>
        </div>
    </>
)

};

export default AccountSection;