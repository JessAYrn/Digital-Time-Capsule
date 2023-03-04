import React from 'react';
import { CardElement } from '@stripe/react-stripe-js';
import './CardInput.scss';

const CARD_ELEMENT_OPTIONS = {
    style: {
        base: {
            color: '#32325d',
            fontFamily: "'Julius Sans One', sans-serif",
            fontSmoothing: 'antialiased',
            fontSize: '16px',
            "::placeholder": {
                color: '#aab7c4'
            },
        },
        invalid: {
            color: '#fa755a',
            iconColor: 'fa755a'
        },
    },
};

const CardInput = (props) => {

    return(
        <CardElement options={CARD_ELEMENT_OPTIONS}/>
    )

};

export default CardInput;