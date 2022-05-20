import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import {
  HashRouter,
  Routes,
  Route
} from "react-router-dom";
import HomePage from './HomePage';
import App from './App';
import AccountPage from "./AccountPage"
import configureStore from './configureStore';
import WalletApp from './Wallet';
import NFTapp from './NFTs';
import { NAV_LINKS } from './Constants';




const store = configureStore();


ReactDOM.render(
<Provider store={store}>
    <HashRouter>
        <Routes>
            <Route path={NAV_LINKS.dashboard} element={<HomePage />}/>
            <Route path={NAV_LINKS.journal} element={<App />}/>
            <Route path={NAV_LINKS.account} element={<AccountPage />}/>
            <Route path={NAV_LINKS.wallet} element={<WalletApp/>}/>
            <Route path={NAV_LINKS.nft} element={<NFTapp/>}/>
        </Routes>
    </HashRouter>
</Provider>
, document.getElementById('root'));