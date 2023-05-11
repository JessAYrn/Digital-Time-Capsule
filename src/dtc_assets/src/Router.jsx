import React, {useState, useEffect} from 'react';
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
import * as managerCanisterFiles from "../../declarations/manager";
import * as dtcAssetsFiles from "../../declarations/dtc_assets";
import { extractCanisterIdFromURL, getCurrentURL } from './Utils';

const Router = (props) => {

    const [client, setClient] = useState(null);
    const dtc_idlFactory = dtcFiles.idlFactory;
    const managerCanister_idlFactory = managerCanisterFiles.idlFactory;
    

    useEffect(() => {
        
        const loadClient = async () => {
            let dtc_canisterId;
            let managerCanister_canisterId;
            if(process.env.NODE_ENV === "development") {
                dtc_canisterId = canisterIds.dtc.ic;
                managerCanister_canisterId = canisterIds.manager.ic;
            } else {
                let URL = getCurrentURL();
                let frontEndPrincipal = extractCanisterIdFromURL(URL);
                let dtcAssetsCanister = dtcAssetsFiles.createActor(frontEndPrincipal,{agentOptions: {host: "https://icp-api.io"}});
                let authorizedPrincipals = await dtcAssetsCanister.list_authorized();
                dtc_canisterId = authorizedPrincipals[0];
                managerCanister_canisterId = authorizedPrincipals[1];

            }
            let client_ = createClient({
                globalProviderConfig: {
                    host: 'https://mainnet.ic0.app',
                    whitelist: [dtc_canisterId],
                    appName: ''
                },
                canisters: {
                    dtc: {
                        canisterId: dtc_canisterId,
                        idlFactory: dtc_idlFactory
                    }, manager: {
                        canisterId: managerCanister_canisterId,
                        idlFactory: managerCanister_idlFactory
                    }
                },
                providers: defaultProviders
            });
            setClient(client_);
        };

      loadClient();
    },[]);
    
    return(
       client &&
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