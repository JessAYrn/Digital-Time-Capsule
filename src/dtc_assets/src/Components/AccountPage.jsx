import React, { useContext, useState} from 'react';
import  InputBox  from './Fields/InputBox';
import { types } from '../reducers/journalReducer'
import AdminSection from './AdminSection';
import "./SubscriptionPage.scss";
import { AppContext } from '../Account';
import { NavBar } from './navigation/NavBar';
import { UI_CONTEXTS } from '../Contexts';



const SubcriptionPage = (props) => {

    const { actor, journalState, dispatch } = useContext(AppContext);
    const [isLoading, setIsLoading] = useState(false);

    console.log('journalState: ', journalState);

    const handleUpdate = async () => {

        const profileInput = {
            userName: (journalState.metaData.userName[0]) ? journalState.metaData.userName: [],
            email: (journalState.metaData.email[0]) ? journalState.metaData.email: []
        };
        console.log("input: ",profileInput);
        let result = await actor.updateProfile(profileInput);
        console.log(result);
        // if("err" in result){
        //     showErrorMessage();
        // };

    };

    console.log(journalState.metaData);

return(
    <div className='container'>
        <div className={"background"}>
            <NavBar
                walletLink={true}
                journalLink={true}
                nftLink={true}
                accountLink={false}
                dashboardLink={true}
                notificationIcon={false}
                context={UI_CONTEXTS.ACCOUNT_PAGE}
            />
            <div className={"logoDivContainer"}>
                <div className={'logoDiv'}>
                    <img className={'logoImg'}src="dtc-logo-black.png" alt="Logo"/>
                    <div className={'subscriptionSection'}>
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
                        {journalState.metaData.userName[0] === 'admin' && <AdminSection/>}
                    </div> 
                </div>
            </div>
        </div>
    </div>
)

};

export default SubcriptionPage;