import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";
import HomePage from './HomePage';
import App from './App';
import configureStore from './configureStore';




const store = configureStore();


ReactDOM.render(
<Provider store={store}>
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<HomePage />}/>
            <Route path="/app" element={<App />}/>
        </Routes>
    </BrowserRouter>
</Provider>
, document.getElementById('root'));