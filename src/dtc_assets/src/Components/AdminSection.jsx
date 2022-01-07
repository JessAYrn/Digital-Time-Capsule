import React, {useContext} from "react";
import axios from "axios";
import { AppContext } from "../AccountPage";

const AdminSection = (props) => {

    const { actor } = useContext(AppContext);

    const handleSubmit = async () => {

        const listOfCapsules = await actor.getEntriesToBeSent();
        const emailAddressesArray = listOfCapsules.ok.map((profile) => {
            return profile[0];
        });
        console.log(emailAddressesArray);

        let emailAddresses = '';
        
        emailAddressesArray.forEach(element => {
            if(emailAddresses){
                emailAddresses = emailAddresses.concat(", ", element);
            } else {
                emailAddresses = emailAddresses.concat(element);
            }
        });
        console.log(emailAddresses);

        const res = await axios.post(
            'https://6717drw5l0.execute-api.us-east-2.amazonaws.com/nodemailer',
            {
                emailAddresses: emailAddresses
            }
        ).then(res => console.log(res)).catch(error => console.log(error.message));
    };

    return (
        <div className={'subscribeButtonDiv'}>
            <button className={'subscriptionButton'} type="submit" onClick={handleSubmit}> Send Emails </button>
        </div>
    );
}

export default AdminSection;