import { createStore, applyMiddleware, compose } from 'redux'
import { routerMiddleware } from 'react-router-redux'
import thunk from 'redux-thunk'
import { persistStore, autoRehydrate } from 'redux-persist';
import rootReducer from './reducers'

const enhancers = []
const middleware = [
  thunk
]

if (process.env.NODE_ENV === 'development') {
  const devToolsExtension = window.devToolsExtension

  if (typeof devToolsExtension === 'function') {
    enhancers.push(devToolsExtension())
  }
}

const composedEnhancers = compose(
  autoRehydrate(),
  applyMiddleware(...middleware),
  ...enhancers,
)

export const store = createStore(
  rootReducer,
  composedEnhancers
)

export const storage = persistStore(store);

export default store