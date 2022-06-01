import React, { useEffect, useContext, useState} from 'react';
import axios from 'axios';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import  InputBox  from './Fields/InputBox';
import { types } from '../reducers/journalReducer'
import CardInput from './CardInput';
import AdminSection from './AdminSection';
import "./SubscriptionPage.scss";
import { AppContext } from '../AccountPage';
import LoadScreen from './LoadScreen';
import { NavBar } from './navigation/NavBar';



const SubcriptionPage = (props) => {
    const {
        journalState,
        dispatch
    } = props;

    const { actor, authClient } = useContext(AppContext);
    const [userName, setUserName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(async () => {
        setIsLoading(true);
        const journal = await actor.readJournal();
        setUserName(journal.ok.userName[0]);
        if("err" in journal){
            actor.create().then((result) => {
                console.log(result);
            });
            setIsLoading(false);
        } else {
            const metaData = {email : journal.ok.email, userName: journal.ok.userName};
            
            dispatch({
                payload: metaData,
                actionType: types.SET_METADATA
            });
            setIsLoading(false);
        }
    },[actor, authClient]);

    const stripe = useStripe();
    const elements = useElements();

    const handleUpdate = async () => {

        const profileInput = {
            userName: (journalState.metaData.userName[0]) ? journalState.metaData.userName: [],
            email: (journalState.metaData.email[0]) ? journalState.metaData.email: []
        };

        let result = await actor.updateProfile(profileInput);
        console.log(result);
        // if("err" in result){
        //     showErrorMessage();
        // };

    };

    const handleSubmitPay = async (e) => {
        e.preventDefault();

        if(!stripe || ! elements){
            return;
        }

        const res = await axios.post(
            'https://6717drw5l0.execute-api.us-east-2.amazonaws.com/pay', 
            {email: journalState.metaData.email}
        );

        const clientSecret = res.data['client_secret'];

        const result = await stripe.confirmCardPayment(
            clientSecret, 
            { 
                payment_method: {
                    card: elements.getElement(CardElement),
                    billing_details: {
                        email: journalState.metaData.email
                    }
                }
            }
        );

        if(result.error){
            console.log(result.error.message);
        } else {
            if(result.paymentIntent.status === 'succeeded'){
                console.log('Money is in the Bank!');
            }
        }

    }; 

    const handleSubmitSub = async (e) => {

        if(!stripe || ! elements){
            return;
        }

        const result = await stripe.createPaymentMethod({
            type: 'card',
            card: elements.getElement(CardElement),
            billing_details: {
                email: journalState.metaData.email
            }
        });

        if(result.error){
            console.log(result.error.message);
        } else {
            const res = await axios.post(
                'https://6717drw5l0.execute-api.us-east-2.amazonaws.com/sub',
                {
                    payment_method: result.paymentMethod.id,
                    email: journalState.metaData.email
                }
            );
    
            console.log(res.data);
    
            const {client_secret, status} = res.data;
    
            if(status === 'requires_action'){
                stripe.confirmCardPayment(client_secret).then((result) => {
                    if(result.error){
                        console.log('There was an issue');
                        console.log(result.error);
                    } else {
                        if(result.paymentIntent.status === 'succeeded'){
                            console.log('Money is in the Bank!');
                        }
                    }
                });
            } else {
                console.log('Money in the Bank!');
            }
        }

    }; 
    console.log(journalState.metaData);

return(
    isLoading ?
    <LoadScreen/> :
    <div className='container'>
        <div className={"background"}>
            <NavBar
                walletLink={true}
                journalLink={true}
                nftLink={true}
                accountLink={false}
                dashboardLink={true}
                notificationIcon={false}
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
                        {userName === 'admin' && <AdminSection/>}
                        {/* <CardInput/>
                        <div className={'subscribeButtonDiv'}>
                            <button className={'subscriptionButton'} type="submit" onClick={handleSubmitSub}> Subscribe </button>
                        </div> */}
                    </div> 
                </div>
            </div>
        </div>
    </div>
)

};

export default SubcriptionPage;