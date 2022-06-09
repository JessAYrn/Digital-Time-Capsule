import React, {useEffect, useState, useContext } from "react";
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
                journalState={journalState}
            />
            </div>
        </div>
    );

};

export default NftPage;