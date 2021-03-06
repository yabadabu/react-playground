import React from 'react';
import NavLink from './NavLink'

export default class App extends React.Component {
  render() {
    return (
      <div>

        <h1>React Router Tutorial</h1>

        <ul role="nav">
          <li><NavLink to="/about">About</NavLink></li>
          <li><NavLink to="/proformas">Proformas Section</NavLink></li>
          <li><NavLink to="/proformas/new">Nueva Proforma</NavLink></li>
          <li><NavLink to="/proformas/id/16-0005-N">Proforma 16-0005-N</NavLink></li>
          <li><NavLink to="/repos/john">All repos of john</NavLink></li>
          <li><NavLink to="/repos/john/34322">Repos of john id 34322</NavLink></li>
        </ul>

        {/* Render children components based on router*/}
        {this.props.children}

      </div>
    )
  }
}
