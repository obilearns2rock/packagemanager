import { concat, get } from 'lodash';
import React, { Component, PropTypes } from 'react';
import { Link, Redirect, Route } from 'react-router-dom';
import { Subject } from 'rxjs';
import $ from 'jquery/dist/jquery';

import { Sidebar, Header } from '../Shared';
import PackageView from './packageView';
import Stats from './stats';
import { searchStream } from '../../setup';
import { ON_SEARCH_QUERY, ON_SEARCH_RESULT, ON_SEARCH_START } from '../../actions';

const responsiveWidth = 992;
const sidebarWidth = 260;

export class Dashboard extends Component {
  initializedLeftMenu = false;
  state = {
    searching: 0,
    section: 'create',
    mode: window.innerWidth >= responsiveWidth ? 'desktop' : 'mobile',
    search: '',
    code: '',
    startId: new Date().getTime(),
    menuOpen: window.innerWidth >= responsiveWidth
  }

  componentDidMount() {
    if (window.innerWidth < responsiveWidth) {
      this.hideLeftMenu();
    }
    this.event = () => {
      let initial = this.state.menuOpen;
      this.setState({ menuOpen: window.innerWidth >= responsiveWidth ? true : false, mode: window.innerWidth >= responsiveWidth ? 'desktop' : 'mobile' }, () => {
        if (initial != this.state.menuOpen) {
          if (this.state.menuOpen) this.showLeftMenu();
          else this.hideLeftMenu();
        }
      });
    };
    window.addEventListener('resize', this.event);
    this.initializedLeftMenu = true;
    this.searchSub = searchStream.subscribe(this.onSearchAction.bind(this));
  }

  componentWillReceiveProps(props) {
    if (props.userReady && !this.refreshed) {
      this.refreshed = true;
      this.props.refreshUser();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.event);
    this.searchSub.unsubscribe();
  }

  logout() {
    this.props.logout();
  }

  doSearch(text) {
    this.setState({ search: text }, () => {
      searchStream.next({
        type: ON_SEARCH_QUERY,
        data: text
      });
    });
  }

  onSearchAction(action) {
    switch (action.type) {
      case ON_SEARCH_START:
        this.setState({ searching: this.state.searching + 1 });
        break;
      case ON_SEARCH_RESULT:
        this.setState({ searching: this.state.searching - 1 });
        break;
    }
  }

  showLeftMenu() {
    if (window.innerWidth >= responsiveWidth || !this.initializedLeftMenu) {
      $(this.refs.main).animate({
        width: $('body').width() - sidebarWidth
      }, {
          duration: 'fast',
          complete: () => { $(this.refs.main).css({ width: `calc(100% - ${sidebarWidth}px)` }) }
        });
      $(this.refs.sidebar).fadeIn();
    } else {
      $(this.refs.main).animate({
        left: sidebarWidth
      }, {
          duration: 'fast'
        });
      $(this.refs.sidebar).fadeIn();
    }
  }

  hideLeftMenu() {
    if (window.innerWidth >= responsiveWidth || !this.initializedLeftMenu) {
      $(this.refs.sidebar).fadeOut('fast');
      $(this.refs.main).animate({
        width: '100vw'
      });
    } else {
      $(this.refs.sidebar).fadeOut('fast');
      $(this.refs.main).animate({
        left: 0,
        width: '100vw'
      });
    }
  }

  toggleLeftMenu() {
    if (this.state.menuOpen) {
      this.setState({ menuOpen: false }, () => {
        this.hideLeftMenu();
      });
    } else {
      this.setState({ menuOpen: true }, () => {
        this.showLeftMenu();
      })
    }
  }

  render() {
    const { creating, updating, progressEnabled, progress, user, startTour } = this.props;
    const { section } = this.state;
    return (
      <div style={styles.container}>
        <div ref='sidebar' style={styles.sidebar}>
          <Route path='/' children={(match) => (
            <Sidebar
              match={match}
              onNavClick={(v) => {
                this.state.mode == 'mobile' && this.toggleLeftMenu();
              }}
            />
          )} />
        </div>
        <div ref='main' style={styles.main}>
          <Route path='/' children={(match) => (
            <Header
              match={match}
              onMenuClick={(v) => this.setState({ startId: new Date().getTime() })}
              mode={this.state.mode}
              sidebar={() => this.toggleLeftMenu()}
              onSearch={(text) => this.doSearch(text)}
              searching={this.state.searching > 0}
            />
          )} />
          <div style={styles.content}>
            <Route path='/' exact component={Stats} />
            <Route path='/dashboard' exact component={Stats} />
            <Route path='/dashboard/:id' exact component={PackageView} />
          </div>
        </div>
      </div>
    );
  }
}

const styles = {
  container: {
    position: 'relative',
    height: '100vh',
    top: 0,
    overflow: 'hidden'
  },
  sidebar: {
    overflow: 'auto',
    maxHeight: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: sidebarWidth,
    display: 'block',
    zIndex: 1,
    color: '#fff',
    fontWeight: 200,
    backgroundSize: 'cover',
    backgroundPosition: 'center center',
    boxShadow: '0.5px 0px 10px rgba(0,0,0,.1)',
  },
  main: {
    maxHeight: '100%',
    height: '100%',
    // background: 'rgba(203, 203, 210, 0.15)',
    background: 'rgba(0, 0, 0, 0.02)',
    position: 'relative',
    zIndex: 2,
    float: 'right',
    width: `calc(100% - ${sidebarWidth}px)`,
    minHeight: '100%'
  },
  content: {
    height: '93vh',
    overflowY: 'auto',
    overflowX: 'hidden'
  }
}
