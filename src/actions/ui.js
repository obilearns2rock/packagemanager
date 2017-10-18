import {
  SHOW_NOTIFICATON,
  SHOW_MODAL,
  SHOW_FRAME,
  SHOW_PROGRESS,
  ADD_PACKAGE,
  ADD_PLATFORM,
  REMOVE_PACKAGE,
  UPDATE_PACKAGE,
  REMOVE_PLATFORM,
  UPDATE_PLATFORM,
  SET_PLATFORM_DATA
} from './types';

export function showNotification(title, message, level, data) {
  return {
    type: SHOW_NOTIFICATON,
    notification: {
      uid: new Date().getTime(),
      title, message, level,
      ...data
    }
  }
}

export function showProgress(show, percentage) {
  return {
    type: SHOW_PROGRESS,
    show,
    progress: percentage
  }
}

export function showModal(show, component, props) {
  return {
    type: SHOW_MODAL,
    show,
    component,
    props
  };
}

export function showFrame(show, title, url) {
  console.log(show, title, url)
  return {
    type: SHOW_FRAME,
    show,
    title,
    url
  }
}

export function addPackage(platform, pkg) {
  return {
    type: ADD_PACKAGE,
    platform,
    pkg
  }
}

export function removePackage(platform, id) {
  return {
    type: REMOVE_PACKAGE,
    platform,
    id
  }
}

export function updatePackage(platform, id, pkg) {
  return {
    type: UPDATE_PACKAGE,
    platform,
    id,
    pkg
  }
}

export function removePlatform(platform) {
  return {
    type: REMOVE_PLATFORM,
    platform
  }
}

export function updatePlatform(platform, name) {
  return {
    type: UPDATE_PLATFORM,
    platform,
    name
  }
}

export function addPlatform(name) {
  return {
    type: ADD_PLATFORM,
    name
  }
}

export function setPlatformData(platform, path, value) {
  return {
    type: SET_PLATFORM_DATA,
    platform,
    path,
    value
  }
}
