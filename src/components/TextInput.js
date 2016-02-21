import React from 'react';

export default class TextInput extends React.Component {
  
  // Only if the immutable has change we re-render
  shouldComponentUpdate(nextProps, nextState) {
    var render_it = this.props.values !== nextProps.values;
    if( render_it ) console.log( "ReRendering:", render_it );
    return true;
  }

  handleChange( e ) {
    var new_value = e.target.value;
    this.props.onChange( this.props.field, new_value );
  }

  render() {
    var k = this.props.field;
    var v = this.props.value;
    return( <span key={k} >{k}: <input value={v} onChange={ this.handleChange.bind( this )}></input></span> );
  }
}
