import React, {useContext, useRef} from "react";
import axios from "axios";
import { AppContext } from "../AccountPage";
import "./AdminSection.scss";
import { IDL } from "@dfinity/candid";

import {readFile} from 'fs-web';

const AdminSection = (props) => {
    let inputRef = useRef();


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

    const getArrayBuffer = (inputFile) => {
        const reader = new FileReader();

        return new Promise((resolve, reject) => {
            reader.onload = () => {
                resolve(reader.result);
            }
            reader.readAsArrayBuffer(inputFile)
        
        });
    }; 

    const loadWasm = async () => {

        const buffer = await getArrayBuffer(inputRef.current.files[0]);
        return [...new Uint8Array(buffer)];
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

    const upgradeJournalData = async (principal, wasmModule) => {

        console.log(`Upgrading: ${principal.toText()}`);
        const arg = IDL.encode([IDL.Principal], [principal]);
        await actor.installCode(principal, [...arg], wasmModule);
        console.log(`Done: ${principal.toText()}`);

    };

    const handleUpgrade = async () => {

        let promises =[];

        const wasmModule = await loadWasm();

        const principalsList = await actor.getPrincipalsList();

        principalsList.forEach((principal) => promises.push(upgradeJournalData(principal, wasmModule)));

        await Promise.all(promises);

        console.log("wasm module: ",wasmModule);
    };

    return (
        <React.Fragment>
            <div className={'sendEmailsButtonDiv'}>
                <button className={'sendEmailsButton'} type="submit" onClick={handleSubmit}> Send Emails </button>
            </div>
            <div className={'sendEmailsButtonDiv'}>
                <button className={'refillAllCanisterCycles'} type="submit" onClick={handleSubmitRefill}> Refill All Canister Cycles </button>
            </div>
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