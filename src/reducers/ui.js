import _ from 'lodash';

import {
  REHYDRATE,
  SHOW_NOTIFICATON,
  SHOW_MODAL,
  SHOW_FRAME,
  SHOW_PROGRESS,
  ADD_PACKAGE,
  ADD_PLATFORM,
  UPDATE_PLATFORM,
  REMOVE_PACKAGE,
  REMOVE_PLATFORM,
  UPDATE_PACKAGE,
  SET_PLATFORM_DATA
} from '../actions/types';

const modals = [];

const initialState = {
  showModal: false,
  currentModal: null,
  notification: null,
  showFrame: false,
  frameTitle: '',
  frameSrc: '',
  progressEnabled: false,
  progress: 0,
  platforms: {},
  platformData: {}
};

export const UIReducer = (state = initialState, action) => {
  let modal = {};
  switch (action.type) {
    case REHYDRATE:
      let incoming = action.payload.ui;
      return {
        ...initialState,
        platforms: incoming && incoming.platforms ? incoming.platforms : {},
        platformData: incoming && incoming.platformData ? incoming.platformData : {}
      };
    case SET_PLATFORM_DATA:
      let platformData = _.merge({}, state.platformData);
      _.set(platformData, `${action.platform}.${action.path}`, action.value);
      return {
        ...state,
        platformData
      }
    case ADD_PACKAGE:
      return {
        ...state, platforms: { ...state.platforms, [action.platform]: state.platforms[action.platform] ? [...state.platforms[action.platform], action.pkg] : [action.pkg] }
      }
    case REMOVE_PACKAGE:
      return {
        ...state, platforms: { ...state.platforms, [action.platform]: _.filter(state.platforms[action.platform], (v, i) => v.id != action.id) }
      }
    case UPDATE_PACKAGE:
      return {
        ...state, platforms: {
          ...state.platforms, [action.platform]: _.map(state.platforms[action.platform], (v, i) => {
            if (v.id === action.id) {
              return { ...v, ...action.pkg };
            }
            return v;
          })
        }
      }
    case ADD_PLATFORM:
      return {
        ...state, platforms: { ...state.platforms, [action.name]: [] }
      }
    case UPDATE_PLATFORM:
      return {
        ...state, platforms: { ..._.omit(state.platforms, action.platform), [action.name]: state.platforms[action.platform] }
      }
    case REMOVE_PLATFORM:
      return {
        ...state, platforms: { ..._.omit(state.platforms, action.platform) }
      }
    case SHOW_NOTIFICATON:
      return {
        ...state,
        notification: action.notification
      }
    case SHOW_FRAME:
      return {
        ...state,
        showFrame: action.show,
        frameTitle: action.title,
        frameSrc: action.url
      }
    case SHOW_PROGRESS:
      return {
        ...state,
        progressEnabled: action.show,
        progress: action.progress
      }
    case SHOW_MODAL:
      if (action.show) {
        modal.component = action.component;
        modal.props = action.props;
        modals.push(modal);
        return {
          ...state,
          showModal: action.show,
          currentModal: action.component,
          currentModalProps: action.props
        };
      }
      else {
        modals.pop();
        if (modals.length < 1)
          return {
            ...state,
            showModal: false
          };
        else
          return {
            ...state,
            currentModal: _.last(modals).component,
            currentModalProps: _.last(modals).props
          };
      }
    default:
      return state;
  }
}
