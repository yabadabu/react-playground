import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, hashHistory } from 'react-router'

import App from './modules/App'
import About from './modules/About'
import Repos from './modules/Repos'
import CompProforma from './components/CompProforma'

// -------------------------------------------------
ReactDOM.render((
  <Router history={hashHistory}>
    <Route path="/" component={App}>
      <Route path="/repos/:userName/:reposName" component={Repos}/>
      <Route path="/repos/:userName" component={Repos}/>
      <Route path="/proformas" component={CompProforma}/>
      <Route path="/proformas/new" component={CompProforma}/>
      <Route path="/proformas/id/:db_id" component={CompProforma}/>
      <Route path="/about" component={About}/>
    </Route>
  </Router>
), document.getElementById('root'))