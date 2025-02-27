import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import configureStore from './configureStore';
import App from './App';

const store = configureStore();

ReactDOM.render(
<Provider store={store}>
    <App />
</Provider>
, document.getElementById('root'));