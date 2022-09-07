import React, {useEffect, useState, useContext } from "react";
import { UI_CONTEXTS } from "../Contexts";
import { AppContext } from "../NFTs";
import { NavBar } from "./navigation/NavBar";
import FileUpload from "./Fields/FileUpload";
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
    const displayNftFiles = () => {
        return (
            <>
                {
                    journalState.nftData.map((nftFile, index) => {
                        return (
                            <div className="nftFileContainer">
                                <h4>test</h4>
                                <FileUpload
                                    label={'nft'}
                                    elementId={'nft'}
                                    disabled={true}
                                    context={UI_CONTEXTS.NFT}
                                    index={index}
                                />
                            </div>
                        )
                    })
                }
            </>
        );
    };

    return(
        <div className='container'>
            <NavBar
                walletLink={true}
                journalLink={true}
                nftLink={false}
                accountLink={true}
                dashboardLink={true}
                notificationIcon={false}
                context={UI_CONTEXTS.NFT}
            />
            { displayNftFiles() }
        </div>
    );

};

export default NftPage;