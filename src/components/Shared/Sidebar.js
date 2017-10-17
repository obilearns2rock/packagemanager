import React, { Component, PropTypes } from 'react';
import { Route, Redirect, NavLink } from 'react-router-dom';
import { Image, Icon } from 'semantic-ui-react';
import { connect } from 'react-redux';
import { get, map, keys } from 'lodash';

import {
  showModal, showFrame, showNotification
} from '../../actions';

class Sidebar extends Component {
  componentDidMount() {
    console.log(this.props.match);
  }

  getCurrentPath() {
    return this.props.match.location.pathname;
  }

  isCurrentPath(path) {
    return path == this.getCurrentPath();
  }

  onNavClick(name) {
    this.props.onNavClick && this.props.onNavClick(name);
  }

  render() {
    return (
      <div className='leftmenu' style={styles.container}>
        <div style={styles.wrapper}>
          <center style={styles.logoContainer}>
            Package Manager
          </center>
          <div>
            <ul className="nav">
              <li className={this.isCurrentPath('/dashboard') ? 'active' : ''}>
                <NavLink to="/dashboard" onClick={() => this.onNavClick('Dashboard')}>
                  <Icon name='pie chart' />
                  <span>Dashboard</span>
                </NavLink>
              </li>
              {
                map(this.props.platforms, (x) => (
                  <li key={x} className={this.isCurrentPath(`/dashboard/${x}`) ? 'active' : ''}>
                    <NavLink to={`/dashboard/${x}`} onClick={() => this.onNavClick(x)}>
                      <Icon name='grid layout' />
                      <span>{x}</span>
                    </NavLink>
                  </li>
                ))
              }
            </ul>
          </div>
        </div>
        <div style={styles.background}></div>
      </div>
    )
  }
}

const styles = {
  container: {
    width: 260,
  },
  logoContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: 60,
    borderBottom: '1px solid rgba(0,0,0,.05)',
    background: 'gray',
    fontSize: 18
  },
  wrapper: {
    position: 'relative',
    maxHeight: 'none',
    minHeight: '100%',
    overflow: 'hidden',
    width: 260,
    zIndex: 4
  },
  background: {
    position: 'absolute',
    zIndex: 1,
    height: '100%',
    width: '100%',
    display: 'block',
    top: 0,
    left: 0,
    backgroundSize: 'cover',
    backgroundPosition: 'center center',
  },
  avatar: {
    width: 100,
    height: 100,
    // border: '5px solid gainsboro',
    marginTop: 20,
    boxShadow: '0px 0px 5px rgba(0,0,0,.26)'
  },
  avatarContainer: {
    borderBottom: '1px solid rgba(0,0,0,.05)',
    marginBottom: 10
  },
  username: {
    color: 'gray',
    padding: 10,
    textTransform: 'uppercase'
  }
}

const mapStateToProps = (state) => {
  return {
    platforms: keys(state.ui.platforms)
  }
}

export const VisibleSidebar = connect(mapStateToProps, {
  showModal, showFrame, showNotification
})(Sidebar);
