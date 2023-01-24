import React, {useContext, useRef} from "react";
import axios from "axios";
import { AppContext } from "../Account";
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

    const handleSubmit = async () => {

        const listOfCapsules = await journalState.actor.getEntriesToBeSent();
        const emailAddressesArray = listOfCapsules.ok.map((profile) => {
            return profile[0];
        });
        let promises = [];

        emailAddressesArray.forEach(element => {
            promises.push(postEmail(element));
        });

        const results = await Promise.all(promises);        
    };

    const upgradeJournalData = async (principal, wasmModule) => {

        console.log(`Upgrading: ${principal.toText()}`);
        const arg = IDL.encode([IDL.Principal], [principal]);
        await journalState.actor.installCode(principal, [...arg], wasmModule);
        console.log(`Done: ${principal.toText()}`);

    };

    const createNewNftCollection = async () => {

        const logoResult = {
            logo_type: "Basic",
            data: "Basic"
        };

        const init = {
            logo: logoResult,
            name: "OG Collection",
            symbol: "OGC",
            maxLimit : 250
        };
        
        const result = await journalState.actor.createNFTCollection(init);
    };

    const mint = async () => {

        const file = inputRef.current.files[0];
        const fileSize = file.size;
        const fileType = file.type;

        const chunks = Math.ceil(fileSize/CHUNK_SIZE);
        let chunk = 0;

        let promises = [];


        while(chunk < chunks){    
            
            const from = chunk * CHUNK_SIZE;
            const to = from + CHUNK_SIZE;
            const fileChunk = (to < fileSize -1) ? file.slice(from,to ) : file.slice(from);
            const fileChunkAsBlob = await fileToBlob(fileChunk);
            promises.push(journalState.actor.uploadNftChunk(0, chunk, fileChunkAsBlob));

            chunk += 1;
        };
        const results = await Promise.all(promises);  
        const receipt = await journalState.actor.mintNft(0, fileType, 1);
    };

    const handleUpgrade = async () => {
        let promises =[];
        const wasmModule = await fileToBlob(inputRef.current.files[0]);
        const principalsList = await journalState.actor.getPrincipalsList();
        principalsList.forEach((principal) => promises.push(upgradeJournalData(principal, wasmModule)));
        await Promise.all(promises);
    };

    return (
        <React.Fragment>
            <div className={'sendEmailsButtonDiv'}>
                <button className={'sendEmailsButton'} type="submit" onClick={handleSubmit}> Send Emails </button>
            </div>
            <div className={'sendEmailsButtonDiv'}>
                <input 
                    type="file"
                    ref={inputRef} 
                />
            </div>
            <div className={'sendEmailsButtonDiv'}>
                <button className={'upgradeUserJournalWasm'} type="submit" onClick={createNewNftCollection}> Create NFT Collection </button>
            </div>
            <div className={'sendEmailsButtonDiv'}>
                <button className={'upgradeUserJournalWasm'} type="submit" onClick={handleUpgrade}> Upgrade User Journal Wasm </button>
            </div>
            <div className={'sendEmailsButtonDiv'}>
                <button className={'upgradeUserJournalWasm'} type="submit" onClick={mint}> Mint NFT </button>
            </div>
        </React.Fragment>
        
    );
}

export default AdminSection;