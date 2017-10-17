import React, { Component, PropTypes } from 'react';
import { Route, Redirect, NavLink } from 'react-router-dom';
import { Checkbox, Popup, List, Icon, Button, Input } from 'semantic-ui-react';
import { Subject } from 'rxjs';
import { get, map } from 'lodash';
import { connect } from 'react-redux';
import $ from 'jquery/dist/jquery';

import {
  showModal, showFrame, showNotification
} from '../../actions';

import CreatePackage from '../Modals/CreatePackage';

class Header extends Component {
  state = {
    search: '',
    visibleMenu: '',
    showMenu: false
  }

  menu = {
    
  }

  componentDidMount() {
    this.searchStream = new Subject();
    this.searchStream.debounceTime(500).subscribe(this.doSearch.bind(this));
    this.menuTimeout = undefined;
    $(this.refs.menucontent).on('mouseleave', () => {
      this.menuTimeout = setTimeout(() => {
        this.hideMenu();
      }, 500);
    });
    $(this.refs.menucontent).on('mouseenter', () => {
      clearTimeout(this.menuTimeout);
    });
  }

  doSearch(text) {
    if (this.refs.search) this.refs.search.inputRef.value = text;
    this.setState({ search: text }, () => {
      this.props.onSearch && this.props.onSearch(text);
    });
  }

  search(text) {
    this.searchStream.next(text);
  }

  hideMenu() {
    $(this.refs.menucontent).fadeOut();
    $(this.refs.menucontentBg).hide();
  }

  toggleMenuContent(item, target) {
    this.setState({ visibleMenu: item, showMenu: this.state.item != item }, () => {
      if (this.state.showMenu) {
        $(this.refs.menucontent).css({
          top: 46,
          left: $(target).offset().left - ($(this.refs.menucontent).width() - $(target).width() * 2.5)
        });
        $(this.refs.menucontentBg).show();
        $(this.refs.menucontent).fadeIn();
      } else {
        this.hideMenu();
      }
    });
  }

  render() {
    return (
      <div style={styles.container}>
        <div style={styles.leftmenu}>
          <Button inverted icon='sidebar' onClick={() => this.props.sidebar && this.props.sidebar()}></Button>
        </div>
        <div style={styles.rightmenu}>
          {
            <Button inverted circular icon='plus' onClick={(e) => {
              this.props.showModal(true, <CreatePackage onDismiss={() => this.props.showModal(false)} />, { size: 'small', title: 'Add New Package' });
            }}>
            </Button>
          }
          <ul ref='menucontent' className='menu' style={styles.menucontent}>
            {
              map(get(this.menu, this.state.visibleMenu), (item, i) => {
                if (item.render) {
                  return (
                    <li key={i} style={{ padding: 10 }}>
                      {item.render()}
                    </li>
                  )
                }
                return (
                  <li key={i} style={styles.menucontentItem}>
                    <a href="javascript:void(0)" onClick={get(item, 'action')}>
                      <Icon name={get(item, 'icon')} link />&nbsp;&nbsp;{get(item, 'title')}
                    </a>
                  </li>
                );
              })
            }
          </ul>
          <div ref='menucontentBg' style={{ display: 'none' }} className='transparent-overlay'></div>
        </div>
      </div>
    );
  }
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    backgroundColor: 'rgb(0, 191, 254)',
    // borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
    boxShadow: '0px -1px 10px rgba(0,0,0,.4)',
  },
  leftmenu: {
    padding: 10,
  },
  rightmenu: {
    flex: 1,
    padding: 10,
    textAlign: 'right'
  },
  search: {
    margin: '0px 10px'
  },
  menucontent: {
    display: 'none',
    position: 'fixed',
    backgroundColor: 'white',
    listStyle: 'none',
    padding: 0,
    zIndex: 99999,
    width: 250,
    boxShadow: '0px 5px 10px rgba(0,0,0,.1)',
  },
  menucontentItem: {
    borderTop: '1px solid rgba(0,0,0,.1)',
    // color: 'white',
    display: 'flex',
    alignItems: 'center',
    fontSize: 18
  }
};

const mapStateToProps = (state) => {
  return {
    
  }
}

export const VisibleHeader = connect(mapStateToProps, {
  showModal, showFrame, showNotification
})(Header);
