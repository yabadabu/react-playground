import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, hashHistory } from 'react-router'

import App from './modules/App'
import About from './modules/About'
import Repos from './modules/Repos'
import Hello from './components/Hello'

// -------------------------------------------------
ReactDOM.render((
  <Router history={hashHistory}>
    <Route path="/" component={App}>
      <Route path="/repos/:userName/:reposName" component={Repos}/>
      <Route path="/repos/:userName" component={Repos}/>
      <Route path="/hello" component={Hello}/>
      <Route path="/about" component={About}/>
    </Route>
  </Router>
), document.getElementById('root'))