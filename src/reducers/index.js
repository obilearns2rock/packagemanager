import { combineReducers } from 'redux';
import { UIReducer } from './ui';

const reducers = combineReducers({
  ui: UIReducer
});

export default reducers;
