import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Redirect } from 'react-router-dom';
import NotificationSystem from 'react-notification-system';
import { get } from 'lodash';

import Dashboard from '../Dashboard';
import { ModalManager } from '../Shared';

export class Main extends Component {

  componentWillReceiveProps(props) {
    this.processNotification(props);
  }

  processNotification(props) {
    let add = (n) => {
      switch (n._type) {
        case 'progress-start':
          this.refs.notificationSystem.addNotification({
            uid: 'progress-start' + get(n, 'uid'),
            dismissible: false,
            autoDismiss: false,
            position: 'br',
            title: get(n, 'title'),
            level: get(n, 'level'),
            message: get(n, 'message'),
            children: (
              <h3>Loading...</h3>
            )
          });
          break;
        case 'progress-end':
          this.refs.notificationSystem.removeNotification('progress-start' + get(n, 'uid'));
          this.refs.notificationSystem.addNotification({
            dismissible: true,
            autoDismiss: 5,
            position: 'br',
            title: get(n, 'title'),
            level: get(n, 'level'),
            message: get(n, 'message')
          })
          break;
        default:
          if (!this.props.notification || (this.props.notification && this.props.notification.uid !== n.uid)) {
            this.refs.notificationSystem.addNotification(n);
          }
      }
    }
    if (props.notification) {
      add(props.notification);
    }
  }

  render() {
    return (
      <Router basename={process.env.ROUTER_BASE_PATH}>
        <div>
          <NotificationSystem ref="notificationSystem" />
          <Route path='/' component={Dashboard} />
          <ModalManager />
        </div>
      </Router>
    );
  }
}
