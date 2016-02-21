import React from 'react';
import TextInput from './TextInput';

export default class RowData extends React.Component {
  
  // Only if the immutable has change we re-render
  shouldComponentUpdate(nextProps, nextState) {
    var render_it = this.props.values !== nextProps.values;
    if( render_it ) console.log( "Row ReRendering:", render_it );
    return true;
  }

  handleChange( k, new_value ) {
    console.log( "Row change", k, new_value );
    console.log( k, new_value );
    this.props.onChange( this.props.field, new_value, this.props.line, k );
  }

  render() {
    var del_button = (<button onClick={()=>{this.props.onDelete( this.props.field, this.props.line )}}>Delete</button>);

    // Array
    var flds = [];
    this.props.values.forEach( (v,k)=> { 
      flds.push( 
        <TextInput key={k} field={k} value={v} onChange={this.handleChange.bind( this )}/>
      )
    });

    return (<li>
      {flds} 
      {del_button}
      </li>)
  }
}
