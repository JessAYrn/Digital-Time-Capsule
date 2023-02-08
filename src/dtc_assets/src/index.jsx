import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import configureStore from './configureStore';
import Router from './Router';

const store = configureStore();

ReactDOM.render(
<Provider store={store}>
    <Router />
</Provider>
, document.getElementById('root'));