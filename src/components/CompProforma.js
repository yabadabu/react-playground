import React, {PropTypes} from 'react';
import CompFullLayoutDB from './CompFullLayoutDB';

export default class CompProforma extends React.Component {
  // --------------------------------------------------------------------
  // Do the render in case we must
  render() {
    return (<CompFullLayoutDB {...this.props} layout="proforma"/>);
  }
}


