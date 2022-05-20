import React, {useContext, useRef} from "react";
import axios from "axios";
import { AppContext } from "../AccountPage";
import "./AdminSection.scss";
import { IDL } from "@dfinity/candid";
import { fileToBlob } from "../Utils";
import { CHUNK_SIZE } from "../Constants";

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

        const result = await actor.createNFTCollection(init);
        console.log(result);
    };

    const mint = async () => {

        const file = inputRef.current.files[0];
        const fileSize = file.size;

        const chunks = Math.ceil(fileSize/CHUNK_SIZE);
        let chunk = 0;

        let promises = [];


        while(chunk < chunks){    
            
            const from = chunk * CHUNK_SIZE;
            const to = from + CHUNK_SIZE;

            const fileChunk = (to < fileSize -1) ? file.slice(from,to ) : file.slice(from);

            let chunkId = parseInt(chunk);
            const fileChunkAsBlob = await fileToBlob(fileChunk);
            promises.push(actor.uploadNftChunk(0, {key: chunkId, val: fileChunkAsBlob}));

            chunk += 1;
        };

        const results = await Promise.all(promises);  
        const receipt = await actor.mintNft(0);
        console.log(results, receipt);
    };

    const handleUpgrade = async () => {

        let promises =[];

        const wasmModule = await fileToBlob(inputRef.current.files[0]);

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