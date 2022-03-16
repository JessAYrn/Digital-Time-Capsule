import React, {useContext} from "react";
import axios from "axios";
import { AppContext } from "../AccountPage";
import "./AdminSection.scss";

const AdminSection = (props) => {

    const { actor } = useContext(AppContext);

    const postEmail = async (emailAddress) => {

        const res = await axios.post(
            'https://6717drw5l0.execute-api.us-east-2.amazonaws.com/nodemailer',
            {
                emailAddresses: emailAddress
            }
        );

        return res;
    };

    const handleSubmit = async () => {

        const listOfCapsules = await actor.getEntriesToBeSent();
        const emailAddressesArray = listOfCapsules.ok.map((profile) => {
            return profile[0];
        });
        console.log(emailAddressesArray);

        let promises = [];

        emailAddressesArray.forEach(element => {
            promises.push(postEmail(element));
        });

        const results = await Promise.all(promises);
        console.log(results);
        
    };

    const handleSubmitRefill = async () => {

        const result = await actor.refillCanisterCycles();
        console.log(result);
    };

    return (
        <React.Fragment>
            <div className={'sendEmailsButtonDiv'}>
                <button className={'sendEmailsButton'} type="submit" onClick={handleSubmit}> Send Emails </button>
            </div>
            <div className={'sendEmailsButtonDiv'}>
                <button className={'refillAllCanisterCycles'} type="submit" onClick={handleSubmitRefill}> Refill All Canister Cycles </button>
            </div>
        </React.Fragment>
        
    );
}

export default AdminSection;