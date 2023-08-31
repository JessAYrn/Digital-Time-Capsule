import React, {useState, useEffect} from 'react';
import { Route, Routes, HashRouter } from 'react-router-dom';
import HomePage from './Routes/HomePage';
import App from './Routes/App';
import AccountPage from "./Routes/Account"
import WalletApp from './Routes/Wallet';
import { defaultProviders } from "@connect2ic/core/providers"
import { createClient } from "@connect2ic/core"
import { Connect2ICProvider } from "@connect2ic/react"
import { NAV_LINKS } from './functionsAndConstants/Constants';
import * as canisterIds from "../../../canister_ids.json";
import * as dtcFiles from "../../declarations/dtc"
import Treasury from './Routes/Treasury';
import GroupJournal from './Routes/GroupJournal';
import * as managerCanisterFiles from "../../declarations/manager";
import * as dtcAssetsFiles from "../../declarations/dtc_assets";
import { extractCanisterIdFromURL, getCurrentURL } from './functionsAndConstants/Utils';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const Router = (props) => {

    const [client, setClient] = useState(null);
    const dtc_idlFactory = dtcFiles.idlFactory;
    const managerCanister_idlFactory = managerCanisterFiles.idlFactory;

    const theme = createTheme({
        palette: {
          primary: {
            // light: will be calculated from palette.primary.main,
            main: '#0A0A0A',
            // dark: will be calculated from palette.primary.main,
            // contrastText: will be calculated to contrast with palette.primary.main
          },
          secondary: {
            main: '#343434',
          },
          // Provide every color token (light, main, dark, and contrastText) when using
          // custom colors for props in Material UI's components.
          // Then you will be able to use it like this: `<Button color="custom">`
          // (For TypeScript, you need to add module augmentation for the `custom` value)
          custom: {
            main: '#F7931A',
          },
          white: {
            main: '#FFFFFF'
          },
          // Used by `getContrastText()` to maximize the contrast between
          // the background and the text.
          contrastThreshold: 3,
          // Used by the functions below to shift a color's luminance by approximately
          // two indexes within its tonal palette.
          // E.g., shift from Red 500 to Red 300 or Red 700.
          tonalOffset: 0.2,
        },
      });
    

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
       <ThemeProvider theme={theme}>
            <Connect2ICProvider client={client}>
                <HashRouter>
                    <Routes>
                        <Route path={NAV_LINKS.dashboard} element={<HomePage />}/>
                        <Route path={NAV_LINKS.journal} element={<App />}/>
                        <Route path={NAV_LINKS.account} element={<AccountPage />}/>
                        <Route path={NAV_LINKS.wallet} element={<WalletApp />}/>
                        <Route path={NAV_LINKS.treasury} element={<Treasury/>}/>
                        <Route path={NAV_LINKS.groupJournal} element={<GroupJournal/>}/>
                    </Routes>
                </HashRouter>
            </Connect2ICProvider>
        </ThemeProvider>
    );
};

export default Router;