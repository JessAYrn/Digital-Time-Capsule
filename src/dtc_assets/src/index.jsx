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




const store = configureStore();


ReactDOM.render(
<Provider store={store}>
    <HashRouter>
        <Routes>
            <Route path="/" element={<HomePage />}/>
            <Route path="/app" element={<App />}/>
            <Route path="/account" element={<AccountPage />}/>
            <Route path="/wallet" element={<WalletApp/>}/>
            <Route path="/nft" element={<NFTapp/>}/>
        </Routes>
    </HashRouter>
</Provider>
, document.getElementById('root'));