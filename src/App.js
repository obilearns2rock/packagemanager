import React, { Component } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Route, Redirect } from 'react-router-dom';

import store, { history } from './store'
import Main from './components/Main';

class App extends Component {
  render() {
    return (
      <Provider store={store}>
        <Router>
          <Main />
        </Router>
      </Provider>
    );
  }
}

export default App;
