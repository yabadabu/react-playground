import React from 'react';
import RowData from './RowData';

export default class TableData extends React.Component {
  
  // Only if the immutable has change we re-render
  shouldComponentUpdate(nextProps, nextState) {
    var render_it = this.props.values !== nextProps.values;
    if( render_it ) console.log( "Table ReRendering:", render_it );
    return true;
  }

  render() {
    // Array
    var flds = [];
    this.props.values.map( 
      (v,k) => {
        flds.push( <RowData key={k} field={this.props.field} line={k} values={v} 
                        onChange={this.props.onChange}
                        onDelete={this.props.onDelete}
                        />)
    })

    var add_button = (<button onClick={()=>{this.props.onAdd( this.props.field )}}>Add New</button>);

    return (<div><ul>
      {flds} 
      </ul>
      {add_button}
      </div>)
  }
}
