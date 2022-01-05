import React, {useContext} from "react";
import { AppContext } from "../AccountPage";

const AdminSection = (props) => {

    const { actor } = useContext(AppContext);

    const handleSubmit = async () => {

        const listOfCapsules = await actor.getEntriesToBeSent();
        console.log(listOfCapsules);
    };

    return (
        <div className={'subscribeButtonDiv'}>
            <button className={'subscriptionButton'} type="submit" onClick={handleSubmit}> Send Emails </button>
        </div>
    );
}

export default AdminSection;