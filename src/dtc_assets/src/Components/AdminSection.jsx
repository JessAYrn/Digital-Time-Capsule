import React, {useContext, useRef} from "react";
import axios from "axios";
import { AppContext } from "../Routes/Account";
import "./AdminSection.scss";
import { IDL } from "@dfinity/candid";
import { fileToBlob } from "../Utils";
import { CHUNK_SIZE } from "../Constants";


const AdminSection = (props) => {
    let inputRef = useRef();


    const { journalState } = useContext(AppContext);

    const postEmail = async (emailAddress) => {

        const res = await axios.post(
            'https://6717drw5l0.execute-api.us-east-2.amazonaws.com/nodemailer',
            {
                emailAddresses: emailAddress
            }
        );

        return res;
    };

    const handleUpgrade = async () => {
        const wasmModule = await fileToBlob(inputRef.current.files[0]);
        await journalState.backendActor.installCode(wasmModule);
        console.log('done');

    };

    return (
        <React.Fragment>
            <div className={'sendEmailsButtonDiv'}>
                <input 
                    type="file"
                    ref={inputRef} 
                />
            </div>
            <div className={'sendEmailsButtonDiv'}>
                <button className={'upgradeUserJournalWasm'} type="submit" onClick={handleUpgrade}> Upgrade User Journal Wasm </button>
            </div>
        </React.Fragment>
        
    );
}

export default AdminSection;