import { applyMiddleware, compose, createStore } from 'redux';
import thunkMiddleware from 'redux-thunk';

import monitorReducersEnhancer from "./enhancers/monitorReducer";
import loggerMiddleware from './middleware/logger';
import rootReducer from './reducers/rootReducer';

export default function configureStore(preloadedState) {

  const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION__COMPOSE__ || compose;

  const middlewares = [loggerMiddleware, thunkMiddleware];
  const middlewareEnhancer = applyMiddleware(...middlewares);

  const enhancers = [middlewareEnhancer, monitorReducersEnhancer];
  const composedEnhancers = composeEnhancers(
      ...enhancers, 
      window.__REDUX_DEVTOOLS_EXTENSION__ ? window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__() : f => f
    );

  const store = createStore(rootReducer, preloadedState, composedEnhancers);

  return store;
}