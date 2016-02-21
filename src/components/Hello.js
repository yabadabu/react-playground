import React from 'react';
import TableData from './TableData';
import TextInput from './TextInput';
import Immutable from 'Immutable';

// Exxample of using facebook immutable js api

export default class Hello extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      db_data: Immutable.fromJS({
        items: [
          { name:"John",  age:35 }
        , { name:"Peter", age:33 }
        , { name:"Eva",   age:40 }
        , { name:"Maite", age:35 }
        , { name:"Laia",  age:8 }
        ],
        uniqueID: "InvoiceID",
        createDate: "now"
      }),
      deleted: false
    };

    console.log( "Hi");
//    console.log( this.state.set( 'deleted', true ).toJS() );
//    console.log( this.state.toJS() );
    //console.log( this.state.db_data.updateIn( [ 'items', 0, 'name'], ()=>"Pau" ).toJS() );

    // Iterate over all items
    this.state.db_data.forEach( (v,k) => { 
      console.log( "Field", k, v ) 
    });
  }

  handleDelete( field, line ) {
    if( line != null ) {
      console.log( "Deleting line" + line);
    }
  }

  handleChange( field, new_value, line, sub_field, sub_value ) {
    if( line != null ) {
      console.log( "Changing field of line", line )
      this.setState( {db_data: this.state.db_data.updateIn([field, line, sub_field], ()=>sub_value) } );
    } else {
      console.log( "Changing field", field, new_value )
      this.setState( {db_data: this.state.db_data.updateIn([field], ()=>new_value) } );
    }
    // Add one to the current age
  }

  render() {

    var entries = [];
    this.state.db_data.forEach( (v,field)=>{
      //console.log( "Rendering", field, typeof v);

      if( typeof v === 'object' ) {
        //console.log( "Rendering table", field);
        entries.push ( <TableData key={field} field={field} values={v}
                                  onChange={this.handleChange.bind(this)}
                                  onDelete={this.handleDelete.bind(this)}
                                  />)

      } else {
        //console.log( "Rendering field", field);
        entries.push ( <TextInput key={field} field={field} value={v}
                                  onChange={this.handleChange.bind(this)}
                                  />)
      }

    })
    
    //console.log( "@ Render: ", this.state, this.state.items.toJS());
    return <div>Items:
      {entries}
      <pre>{ JSON.stringify( this.state.db_data.toJS(), null, '  ' ) }</pre>
      </div>
  }
}
