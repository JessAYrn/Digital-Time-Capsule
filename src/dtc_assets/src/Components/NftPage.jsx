import React, {useEffect, useState, useContext } from "react";
import { UI_CONTEXTS } from "../Contexts";
import { AppContext } from "../NFTs";
import { NavBar } from "./navigation/NavBar";
import "./NftPage.scss";
const NftPage = () => {

    const {
        actor, 
        authClient, 
        setIsLoaded, 
        setSubmissionsMade, 
        submissionsMade,
        journalState,
        dispatch
    } = useContext(AppContext);

    return(
        <div className='container'>
            <div className={"background"}>
            <NavBar
                walletLink={true}
                journalLink={true}
                nftLink={false}
                accountLink={true}
                dashboardLink={true}
                notificationIcon={false}
                context={UI_CONTEXTS.NFT}
            />
            </div>
        </div>
    );

};

export default NftPage;