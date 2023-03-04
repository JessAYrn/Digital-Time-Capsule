import React, {useEffect, useState, useContext } from "react";
import { UI_CONTEXTS } from "../Contexts";
import { AppContext } from "../Routes/NFTs";
import { NavBar } from "../Components/navigation/NavBar";
import FileUpload from "../Components/Fields/fileManger/FileUpload";
import { Modal } from "../Components/Modal";
import "./NftPage.scss";
const NftPage = () => {

    const {
        journalState,
        dispatch
    } = useContext(AppContext);
    const displayNftFiles = () => {
        return (
            journalState.modalStatus.show ?
            <div className={"container"}>
                <Modal 
                    context={UI_CONTEXTS.NFT}
                />
            </div> : 
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