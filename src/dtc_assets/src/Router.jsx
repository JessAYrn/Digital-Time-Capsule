import React from 'react';
import { Route, Routes, HashRouter } from 'react-router-dom';
import HomePage from './Routes/HomePage';
import App from './Routes/App';
import AccountPage from "./Routes/Account"
import WalletApp from './Routes/Wallet';
import NFTapp from './Routes/NFTs';
import { defaultProviders } from "@connect2ic/core/providers"
import { createClient } from "@connect2ic/core"
import { Connect2ICProvider } from "@connect2ic/react"
import { NAV_LINKS } from './Constants';
import * as canisterIds from "../../../canister_ids.json";
import * as dtcFiles from "../../declarations/dtc"
import Treasury from './Routes/Treasury';
import GroupJournal from './Routes/GroupJournal';

const Router = (props) => {
    const dtc_canisterId = canisterIds.dtc.ic;
    const dtc_idlFactory = dtcFiles.idlFactory;

    const client = createClient({
        globalProviderConfig: {
            host: 'https://mainnet.ic0.app',
            whitelist: [dtc_canisterId],
            appName: ''
        },
        canisters: {
            dtc: {
                canisterId: dtc_canisterId,
                idlFactory: dtc_idlFactory
            } 
        },
        providers: defaultProviders
    });

    return(
        <Connect2ICProvider client={client}>
            <HashRouter>
                <Routes>
                    <Route path={NAV_LINKS.dashboard} element={<HomePage />}/>
                    <Route path={NAV_LINKS.journal} element={<App />}/>
                    <Route path={NAV_LINKS.account} element={<AccountPage />}/>
                    <Route path={NAV_LINKS.wallet} element={<WalletApp />}/>
                    <Route path={NAV_LINKS.nft} element={<NFTapp />}/>
                    <Route path={NAV_LINKS.treasury} element={<Treasury/>}/>
                    <Route path={NAV_LINKS.groupJournal} element={<GroupJournal/>}/>
                </Routes>
            </HashRouter>
        </Connect2ICProvider>
    );
};

export default Router;