import React, {PropTypes} from 'react';
import _ from 'lodash';
import TextField from 'material-ui/lib/text-field';
import ActionSearch from 'material-ui/lib/svg-icons/action/home';
import ActionFindInPage from 'material-ui/lib/svg-icons/action/find-in-page';
import ActionInput from 'material-ui/lib/svg-icons/action/trending-up';

import RaisedButton from 'material-ui/lib/raised-button';

import CompFormText from './form/CompFormText.js';
import CompFormDate from './form/CompFormDate.js';
import CompFormAutoComplete from './form/CompFormAutoComplete.js';
import CompFormTable from './form/CompFormTable.js';
import CompFormSelect from './form/CompFormSelect.js';
import CompSearchDB from './CompSearchDB.js';
import CompComputeNextIDFromDB from './CompComputeNextIDFromDB.js';
 
import Dialog from 'material-ui/lib/dialog';
import CardActions from 'material-ui/lib/card/card-actions';

import * as layouts from '../store/db_layouts.js';

// -------------------------------------------------------------
// From a layout creates instances of form components
// all data changes are forwarded to the props
// -------------------------------------------------------------
export default class CompEditForm extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      modal_dlg_open: false
    , modal_dlg_field: null   // Which ctrl triggered the open dialog action
    };
  }

  // -------------------------------------------------------------
  handleTableChange( field, row_idx, row_field, new_value ) {
    // If someone sends us a e.target.value, get the value directly
    if( new_value && new_value.target && typeof new_value.target === "object" )
      new_value = new_value.target.value;
/*
    console.log( "at CompEditForm::handleTableChange" );
    console.log( "this", this );
    console.log( "field", field );             // details
    console.log( "row_idx", row_idx );           // Row index
    console.log( "row_field", row_field );         // REF
    console.log( "new_value", new_value );         // new value as string/number/null
    console.log( this.props.data );
*/
    //var new_data = this.props.data[field.field];
    //new_data[ row_idx ][ row_field.field ] = new_value;
    //console.log( new_data );
    //this.props.onChange( field, new_data ); 
    this.props.onChange( field, new_value, row_idx, row_field ); 
  }

  handleTableClick( field, row_idx, row_field ) {
    /*
    console.log( "at handleTableClick" );
    console.log( "this", this );
    console.log( "field", field );        // details
    console.log( "row_idx", row_idx );      // index in props
    console.log( "row_field", row_field );    // f.field = Delete
    console.log( this.props.data );
    */
    //var rows = this.props.data[field.field];
    //console.log( "About to delete row idx ", row_idx, " from ", rows);
    //rows.splice( row_idx, 1 );
    var row = this.props.data[ field.field][ row_idx ];
    row._deleted = true;
    //console.log( new_data );
    this.props.onChange( field, row, row_idx ); 
  }

  handleAddNewDetailOnTable( f ) {
    // Get access to the details layout
    const ext_layout = layouts.get( f.layout );
    var new_rec = layouts.getNewEmptyRegister( ext_layout );
    //console.log( "New rec is", new_rec, ext_layout );

    // Get access to the full 'details'
    var all_details = this.props.data[f.field];
    new_rec._is_new = true;
    //all_details.push( new_rec );
    //this.props.onChange( f, all_details); 
    //console.log( "Adding new item", f, new_rec );
    this.props.onChange( f, new_rec, all_details.length, null ); 
  }

  // ---------------------------------------------------------------- 
  handleOpenDlgLayout( f ) {
    this.setState({modal_dlg_open:true, modal_dlg_field:f});
  }

  // Cancelling the dialog
  handleCloseDlg() {
    this.setState({modal_dlg_open:false});
  }

  handleDlgChooseFromDB(f,row) {
    //console.log( "At handleDlgChooseFromDB", f, row, this.props );
    /*
    // Do a bulk update of all the fields at f.update_fields, wih the values
    // taken from row
    var changed = {};
    _.each( f.update_fields, (v,k)=>{
      //console.log( "Update ", v, " to ", k, row[k] );
      changed[v] = row[k];
    });
    //console.log( "Dlg closes and updates: ", changed, row, f.update_fields );
    this.props.onChange( Object.assign( {}, this.props.data, changed));
    */
    const my_layout = this.props.layout;
    _.each( f.update_fields, (v,k)=>{     // k,v are the field name in the query and the layout
      var f = layouts.getFieldByName( my_layout, v );
      //console.log( "Sending ", k, f, row[k]);
      this.props.onChange( f, row[k] );
    });
    this.handleCloseDlg();
  }

  // ---------------------------------------------------------------- 
  renderModalDialog() {
    const f = this.state.modal_dlg_field;
    if( !f )
      return;
    const layout = layouts.get( f.layout );

    var actions = (
      <CardActions >
        <RaisedButton label="Cancelar" onClick={this.handleCloseDlg.bind(this)}/>
      </CardActions>);

    const title = layout ? layout.title : "";
    return (
      <Dialog modal
        open={this.state.modal_dlg_open}
        title={title}
        actions={actions}
        autoDetectWindowHeight={false}
        autoScrollBodyContent
        >
        <CompEditForm 
          data={this.props.data} 
          onChooseFromDBSearch={this.handleDlgChooseFromDB.bind(this,f)}
          layout={layout}
          creating_new
          />
      </Dialog>
    );
  }

  // ---------------------------------------------------------------- 
  render() {
    const cfg = this.props.layout;
    const data = this.props.data;
    const onChange = this.props.onChange;

    var key = 1;
    let entries = [];
    for( let idx in cfg.fields ) {
      key++;
      const f = cfg.fields[ idx ];
      if( f.type === "separator" ) {
        entries.push( <div key={key}></div>);
        continue;
      } 

      // Skip those fields which only appear when creating a new record
      if( f.only_when_creating_new && !this.props.creating_new )
        continue;

      let obj = data.get( f.field );
      let value = obj;
      let str_value = value != undefined ? value.toString() : null;

      if( f.type === "text" ) {
        entries.push( 
          <CompFormText field={f} value={value} key={key} creating_new={this.props.creating_new} onChange={onChange}/>
        );

      } else if( f.type === "lut" ) {
/*        entries.push( 
          <CompFormAutoComplete field={f} value={str_value} key={key} onChange={onChange}/>
        );
*/
      } else if( f.type === "date" ) {
        entries.push(
          <CompFormDate field={f} value={value} key={key} onChange={onChange}/>
        );

      } else if( f.type === "select" ) {
        entries.push(
          <CompFormSelect field={f} value={str_value} key={key} onChange={onChange}/>
        );

      } else if( f.type === "db_search" ) {
        var layout_data = layouts.get( f.layout );    // search_cliente object
        entries.push(
          <CompSearchDB layout={layout_data} key={key} 
                        no_action_buttons 
                        no_headers 
                        onClickSearchResult={this.props.onChooseFromDBSearch}/>
        );

      } else if( f.type === "modal_dialog" ) {
        entries.push( (
        <ActionInput
            key={key}
            onClick={this.handleOpenDlgLayout.bind( this, f )}
          />) );

      } else if( f.type === "db_query_and_update" ) {
        entries.push( <CompComputeNextIDFromDB field={f} key={key} onDataFound={this.handleDlgChooseFromDB.bind(this, f)}/> );

      } else if( f.type === "computed" ) {
        var computed_value = f.formula( obj );
        entries.push(
          <TextField 
            className="form_input"
            hintText={f.hint}
            value={computed_value}
            disabled
            id={f.field}
            />
        );

      } else if( f.type === "array_table" ) {
        // Don't show the details if we are still creating the main record
        if( this.props.creating_new )
          continue;
        entries.push(
          <CompFormTable key={key}
                         field={f} 
                         value={value}
                         onRowClick={this.handleTableClick.bind(this,f)}
                         onRowChange={this.handleTableChange.bind(this,f)}
                         onClickNew={this.handleAddNewDetailOnTable.bind(this,f)}
                         creating_new={this.props.creating_new}
                         />
        );

      } else if( f.type === "action" ) {
        entries.push( (
        <ActionSearch 
            key={key}
            onClick={this.props.onClick.bind( f.field )}
          />) );
      }
    }

    key++;

    var dialog = this.renderModalDialog();
    return (<div key={key} className={this.props.layout.class_name}>{entries}{dialog}</div>);
  }
}

CompEditForm.propTypes = {
  data:     PropTypes.object.isRequired,
  layout:   PropTypes.object.isRequired,
  onClick:  PropTypes.func,
  onChange: PropTypes.func,
  onChooseFromDBSearch: PropTypes.func,
  creating_new: PropTypes.bool
};