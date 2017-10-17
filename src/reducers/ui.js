import _ from 'lodash';

import {
  REHYDRATE,
  SHOW_NOTIFICATON,
  SHOW_MODAL,
  SHOW_FRAME,
  SHOW_PROGRESS,
  ADD_PACKAGE,
  ADD_PLATFORM,
  REMOVE_PACKAGE,
  UPDATE_PACKAGE
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
  platforms: {}
};

export const UIReducer = (state = initialState, action) => {
  let modal = {};
  switch (action.type) {
    case REHYDRATE:
      let incoming = action.payload.ui;
      return { ...initialState, platforms: incoming ? incoming.platforms : {} };
    case ADD_PACKAGE:
      return {
        ...state, platforms: { ...state.platforms, [action.platform]: state.platforms[action.platform] ? [...state.platforms[action.platform], action.pkg] : [action.pkg] }
      }
    case REMOVE_PACKAGE:
      return {
        ...state, platforms: { ...state.platforms, [action.platform]: _.filter(state.platforms[action.platform], (v, i) => i != action.index) }
      }
    case UPDATE_PACKAGE:
      return {
        ...state, platforms: {
          ...state.platforms, [action.platform]: _.map(state.platforms[action.platform], (v, i) => {
            if (i === action.index) {
              return action.pkg;
            }
            return v;
          })
        }
      }
    case ADD_PLATFORM:
      return {
        ...state, platforms: { ...state.platforms, [action.name]: [] }
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