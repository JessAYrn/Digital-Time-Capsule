import React, { useEffect, useContext } from 'react';
import axios from 'axios';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import  InputBox  from './Fields/InputBox';
import { types } from '../reducers/journalReducer'
import CardInput from './CardInput';
import AdminSection from './AdminSection';
import "./SubscriptionPage.scss";
import { AppContext } from '../AccountPage';



const SubcriptionPage = (props) => {
    const {
        journalState,
        dispatch
    } = props;

    const { actor, authClient } = useContext(AppContext);

    useEffect(async () => {
        const journal = await actor.readJournal();
        console.log(journal);
        if("err" in journal){
            actor.create({
                userName: "admin",
                email: "admin@test.com"
        }).then((result) => {
                console.log(result);
            });
        } else {
            const metaData = {email : journal.ok.email, userName: journal.ok.userName};
            
            dispatch({
                payload: metaData,
                actionType: types.SET_METADATA
            });
        }
    },[actor, authClient]);

    const stripe = useStripe();
    const elements = useElements();

    const handleSubmitPay = async (e) => {
        e.preventDefault();

        if(!stripe || ! elements){
            return;
        }

        const res = await axios.post(
            'https://6717drw5l0.execute-api.us-east-2.amazonaws.com/pay', 
            {email: journalState.bio.email}
        );

        const clientSecret = res.data['client_secret'];

        const result = await stripe.confirmCardPayment(
            clientSecret, 
            { 
                payment_method: {
                    card: elements.getElement(CardElement),
                    billing_details: {
                        email: journalState.bio.email
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
                email: journalState.bio.email
            }
        });

        if(result.error){
            console.log(result.error.message);
        } else {
            const res = await axios.post(
                'https://6717drw5l0.execute-api.us-east-2.amazonaws.com/sub',
                {
                    payment_method: result.paymentMethod.id,
                    email: journalState.bio.email
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
    <div className='subscriptionSectionContainer'>
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
                {journalState.metaData.userName === 'admin' ? <AdminSection/> : <CardInput/>}
                <div className={'subscribeButtonDiv'}>
                    <button className={'subscriptionButton'} type="submit" onClick={handleSubmitSub}> Subscribe </button>
                </div>
            </div> 
        </div>
    </div>
)

};

export default SubcriptionPage;