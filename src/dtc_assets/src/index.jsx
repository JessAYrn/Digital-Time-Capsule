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
import configureStore from './configureStore';




const store = configureStore();


ReactDOM.render(
<Provider store={store}>
    <HashRouter>
        <Routes>
            <Route path="/" element={<HomePage />}/>
            <Route path="/app" element={<App />}/>
        </Routes>
    </HashRouter>
</Provider>
, document.getElementById('root'));