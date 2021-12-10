import React, {useContext} from 'react';
import { AppContext } from "../App";


const CreateJournal = (props) => {
    const {    
        authClient, 
        actor,
        setIsLoaded
    } = useContext(AppContext);

    const createUserJournal = () => {

        console.log("Client: ", authClient);
        actor.create({userName: "JesseTheGreat"}).then((result) => {
            console.log(result);
        });

    }

    return(
        <div>
            <button onClick={createUserJournal}> Create Journal </button>
        </div>
    )
};

export default CreateJournal;