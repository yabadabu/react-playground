import React from 'react';
import TableData from './TableData';
import TextInput from './form/CompFormText';
import Immutable from 'Immutable';

// https://facebook.github.io/immutable-js/docs/#/Map/forEach
// https://github.com/facebook/immutable-js/wiki/Immutable-as-React-state
// http://www.sitepoint.com/how-to-build-a-todo-app-using-react-redux-and-immutable-js/
// http://jlongster.com/Using-Immutable-Data-Structures-in-JavaScript

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
      let new_val = {name:null, age:null};
      this.setState( {db_data: this.state.db_data.updateIn(["_deleted"], ()=>true) } );
    }
  }

  // Adding a new item
  handleAdd( field ) {
    console.log( "Adding a new item");
    let new_val = {name:null, age:null};
    this.setState( {db_data: this.state.db_data.update(field, list=>list.push( Immutable.fromJS(new_val) )) } );
  }

  handleChange( field, new_value, line, sub_field ) {
    let addr;
    if( line != null ) {
      addr = [field, line, sub_field];
      console.log( "Changing field of line", line, new_value, addr )
    } else {
      addr = [field];
      console.log( "Changing field", field, new_value )
    }
    this.setState( {db_data: this.state.db_data.updateIn(addr, ()=>new_value) } );
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
                                  onAdd={this.handleAdd.bind(this)}
                                  />)

      } else {
        //console.log( "Rendering field", field);
        entries.push ( <div key={field} ><TextInput field={field} value={v}
                                  onChange={this.handleChange.bind(this)}
                                  /></div>)
      }

    })
    
    //console.log( "@ Render: ", this.state, this.state.items.toJS());
    return <div>Items:
      {entries}
      <pre>{ JSON.stringify( this.state.db_data.toJS(), null, '  ' ) }</pre>
      </div>
  }
}
