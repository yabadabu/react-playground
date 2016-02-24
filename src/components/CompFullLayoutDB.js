import React, {PropTypes} from 'react';
import _ from 'lodash';
import async from 'async';

import dbConn from '../store/db_connection.js';
import Immutable from 'Immutable';

import CompSearchDB from './CompSearchDB';
import CircularProgress from 'material-ui/lib/circular-progress';
import * as layouts from '../store/db_layouts.js';
import Snackbar from 'material-ui/lib/snackbar';
import Divider from 'material-ui/lib/divider';
import Dialog from 'material-ui/lib/dialog';

import IconButton from 'material-ui/lib/icon-button';
import ActionBuild from 'material-ui/lib/svg-icons/action/build';
import ActionSearch from 'material-ui/lib/svg-icons/action/search';
import ActionCopy from 'material-ui/lib/svg-icons/content/content-copy';
import ActionPaste from 'material-ui/lib/svg-icons/content/content-paste';
import ActionDelete from 'material-ui/lib/svg-icons/action/delete';
import ActionNew from 'material-ui/lib/svg-icons/action/open-in-new';
import ActionSave from 'material-ui/lib/svg-icons/content/save';
import ActionUndo from 'material-ui/lib/svg-icons/content/undo';

import CompEditForm from './CompEditForm';
import RaisedButton from 'material-ui/lib/raised-button';
import CardActions from 'material-ui/lib/card/card-actions';
import Perf from 'react/lib/ReactDefaultPerf';

// --------------------------------------------------------------------
// Comp to integrate searchs, editable layout, db access.
// --------------------------------------------------------------------
function getPropertiesOfAChangedFromB( a, b ) {
  //console.log( "getPropertiesOfAChangedFromB", a, b );
  if( !a )
    return {};
  if( !b )
    return a;
  var diffs = {};
  for( var k in a ) {
    /*
    console.log( "k=" + k 
               , "a.k " + (typeof a[k] ) + " "
               , a[k]
               , " vs "
               , "b.k " + (typeof b[k] ) + " " 
               , b[k]
               );
    */
    if( Array.isArray( a[k] ) ) {
      var array_diff = [];
      //console.log( "Comparing", a[k], b[k] );
      for( var q in a[k]) {
        array_diff[ q ] = getPropertiesOfAChangedFromB( a[k][q], b[k][q] );
        //console.log( "Comparing ", q, a[k][q], b[k][q], "yields", array_diff[q] );
      }
      diffs[k] = array_diff;
    } 
    else if( b[k] ) { 
      if( ( typeof a[k] == undefined ) || (!b[k] || !a[k]) || ( b[k].toString() !== a[k].toString()) ) {
        diffs[k] = a[k];
      }
    }
    else {
      if( a[k] )
        diffs[k] = a[k];
    }
  }
  return diffs;
}

// -----------------------------------------------------------------
export default class CompFullLayoutDB extends React.Component {
  
  constructor(props) {
    super(props);
    this.state = {
      db_id: null
    , db_data: null
    , db_orig_data: null
    , db_delta: null
    , db_changed_rec: false
    , db_creating_new: false
    , db_invalid_id: false
    , connected: dbConn.isConnected()
    , msg_visible: false
    , msg_text: "blah blah"
    , modal_dlg_open: false
    , search_state: null
    , trace: 0
    , layout: layouts.get( props.layout )
    };
    console.log( "Ctor Props", props );
  }

  componentDidMount() {
    console.log( "componentDidMount", this.props, this.state );
    dbConn.on('DB.connectionStatusChanged', this.onDBConnectionChange.bind(this) );
    this.componentWillReceiveProps( this.props );
  }

  componentWillUnmount() {
    dbConn.removeListener('DB.connectionStatusChanged', this.onDBConnectionChange );
  }

  componentWillReceiveProps(nextProps) {
    //console.log( "componentWillReceiveProps", nextProps.params.db_id, this.props.params.db_id, this.state.db_id, nextProps);
    if( nextProps.route.path.endsWith( "/new") ) {
      this.onNewRegister();
    } else {
      if( nextProps.params.db_id ) {
        if( nextProps.params.db_id != this.props.params.db_id 
            || 
           (!this.state.db_invalid_id) ) 
        {
          this.recoverDataFromId( nextProps.params.db_id );
        }
      }
      if( !nextProps.params.db_id ) {
        this.setState({db_id:null,db_data:null,db_invalid_id:true});
      }
    }
  }

  // Register to db connection/disconnections
  onDBConnectionChange( ) {
    this.setState({connected:dbConn.isConnected()});
    this.componentWillReceiveProps( this.props );
  }

  // e is the unique id of the selected row in the comp search results
  onClickSearchResult( new_id, search_state ) {
    this.setState({search_state:search_state});
    this.context.router.push( this.state.layout.urls.find_by_id + new_id );
  }

  // e is the unique id of the selected row in the comp search results
  recoverDataFromId( new_id ) {

    if( !new_id || !this.state.connected )
      return;

    //console.log( "Searching " + new_id );
    this.query_sent = new_id;

    //console.log( "onClickSearchResult" );
    this.setState({db_id:new_id, db_data:null, db_invalid_id:false});

    // Prepare the main query and the subqueries
    var db_all_results;
    var tasks = [];
    const layout = this.state.layout;

    tasks.push( (callback)=>{
      // Main query
      //console.log( "Retrieving main data for key " + new_id );
      var resolved_filter = layout.search.exact.filter.replace( /__FIELD__/, new_id );
      dbConn.DBSelect( layout.table
                     , ["*"]
                     , resolved_filter
                     , (data) => { 
        //console.log( "Main query recv");
        //console.log( data );
        //db_all_results = Object.assign({},db_all_results,data[0]); 
        db_all_results = data[0]; 
        if( !db_all_results ) {
          console.log( "Record not found", new_id );
          this.setState( {db_invalid_id:true} );
        }
        callback(); 
      });
    });

    // For subqueries if needed
    _.each( layout.fields, (f)=>{
      if( f.type === "array_table" ) {
        tasks.push( (callback)=>{
          if( !db_all_results )
            return callback(null);
          //console.log( "Retrieving data for field " + f.field );
          //console.log( layout );
          var ext_layout = layouts.get( f.layout );
          //console.log( "External layout" );
          //console.log( ext_layout );
          //console.log( "Local field to search is " + f.local );
          var searched_field = layouts.getFieldByName( layout, f.local );
          //console.log( "searched_field " );
          //console.log( searched_field );
          var searched_value = db_all_results[ searched_field.field ];
          //console.log( "searched_value " + searched_value );
          var resolved_filter = ext_layout.search.join.filter.replace( /__FIELD__/, searched_value );
          dbConn.DBSelect( ext_layout.table
                         , ["*"]
                         , resolved_filter
                         , (data) => { 
            //console.log( "Sub query for " + f.field + " recv");
            //console.log( data );
            db_all_results[ f.field ] = data;
            //console.log( db_all_results );
            callback(); 
          });
        });
      }
    });

    async.series( tasks, (err)=>{
      console.log( "All data collected", db_all_results );
      this.setState({
            db_data:Immutable.fromJS( db_all_results ),
            db_orig_data:Immutable.fromJS( db_all_results ),
            db_creating_new:false,
            db_changed_rec:false,
            db_delta:{},
            });
    });
  }

  // --------------------------------------------------------------
  onDataChange( field, new_value, row_idx, row_field ) {
    //console.log( "onDataChange", field, new_value );
    var f = field.field;

    let addr;
    if( row_idx != null ) {
      addr = [f, row_idx, row_field.field];
      //console.log( "Changing field of row", row_idx, new_value, addr )
    } else {
      addr = [f];
      //console.log( "Changing field", field.field, new_value )
    }

    var db_delta = this.state.db_delta;
    if( row_idx != null ) {
      if( !db_delta[ f ] )
        db_delta[ f ] = [];
      if( !db_delta[ f ][ row_idx ] )
        db_delta[ f ][ row_idx ] = {}
      db_delta[ f ][ row_idx ][ row_field.field ] = new_value;
    }
    else {
      db_delta[ f ] = new_value;
    }

    this.setState( {
      db_data: this.state.db_data.updateIn(addr, ()=>new_value),
      db_delta: db_delta,
      db_changed_rec: true,
    });

    /*
    // If someone sends us a e.target.value, get the value directly
    // Update the delta when the field is an array (details for example)
    if( is_array ) {
      if( !Array.isArray( new_db_delta[ field.field ]))
        new_db_delta[ field.field ] = [];
      for( var k=0; k<=row_idx; ++k ) {
        if( !new_db_delta[ field.field ][ k ] ) {
          new_db_delta[ field.field ][ k ] = {};
        }
      }
      // Updating just the price of a row
      if( row_field )
        new_db_delta[ field.field ][ row_idx ][ row_field.field ] = new_value;
      // or updating the full row (for example, when adding a new record)
      else
        new_db_delta[ field.field ][ row_idx ] = new_value;

    */
  }

  // --------------------------------------------------------------
  onClickUndo( e, dummy  ) {
    console.log( "Restoring...");
    if( this.state.db_creating_new )
      this.onClickSearchAgain();
    else {
      this.setState( {
        db_data: this.state.db_orig_data,
        db_delta: {},
        db_changed_rec: false,
      });
    }
  }

  // --------------------------------------------------------------
  deleteRecord( ) {
    /*
    const layout = this.state.layout;
    var filter = layout.key_field + "='"+ this.state.db_id + "'";
    console.log( "Deleting register ... " + filter);
    dbConn.DBDelete( layout.table
                   , filter
                   , ()=>{ 
      this.setState( {db_data:{}} ); // invalidates current data, so we can't return after deleting it
      this.onClickSearchAgain(); 
    });
    */
  }

  // --------------------------------------------------------------
  onClickSave( e, dummy ) {
    /*
    if( !this.state.db_changed_rec && !this.state.db_creating_new )
      return;
    console.log( "Saving...");
    const layout = this.state.layout;
    var changes = this.state.db_delta;
    console.log( changes );

    var handler = 
      (data)=>{
        console.log( "Save completed " + this.state.db_id);
        console.log( data );
        this.onClickSearchResult( this.state.db_id, this.state.search_state );
        this.setState({msg_visible:true, msg_text:"Registro grabado correctamente"});
       };

    if( this.state.db_creating_new ) {
      const new_id = changes[ layout.key_field ];
      console.log( "Adding new register to the db... " + new_id);
      this.setState({db_id:new_id});
      dbConn.DBInsert( layout.table
                     , changes
                     , handler );

    } else {
      // Not allowing changes in the key field
      var main_required = false;
      var tasks = [];
      var main_changes = {};
      _.each( changes, (v,k)=>{
        if( Array.isArray(v)) {
          // Updating details!
          //console.log( "Updating subtable " + k);
          var searched_field = layouts.getFieldByName( layout, k );   // All fields of 'details'
          var ext_layout     = layouts.get( searched_field.layout );  // Layout
          var ext_key_field  = ext_layout.key_field;
          // For each detail...
          _.each( v, (sub_changes,idx) =>{
            // Si el registro no tiene campos es que no ha habido diferencias
            // en el registro i-esimo
            if( sub_changes._is_new ) {
              
              delete sub_changes._is_new;           // Remove _is_new because it's not a field
              delete sub_changes[ext_key_field];    // Remove .ID as it's autoincremented

              // Remove computed fields
              const changes_to_save = _.reduce(sub_changes, (accum,v,k)=>{
                var field = layouts.getFieldByName( ext_layout, k );
                if( field.type !== "computed" )
                  accum[ k ] = v;
                return accum;
              }, {});

              // Add the link field. remote.IDProforma = main_table.IDProforma
              changes_to_save[ searched_field.remote ] = this.state.db_data[ searched_field.local ];

              tasks.push( (callback)=>{
                dbConn.DBInsert( ext_layout.table
                               , changes_to_save
                               , (data)=>{ callback(null); } 
                               );
              });

            } else {

              if( Object.keys( sub_changes ).length ) {
                //console.log( sub_changes );
                var ext_id = this.state.db_data[k][idx][ext_key_field];
                var filter = ext_layout.key_field + "="+ ext_id;
                //console.log( filter );
                tasks.push( (callback)=>{
                  if( sub_changes._deleted ) {
                    dbConn.DBDelete( ext_layout.table 
                                   , filter
                                   , (data)=>{ callback(null); } 
                                   );
                  } else {
                    dbConn.DBUpdate( ext_layout.table
                                   , sub_changes
                                   , filter
                                   , (data)=>{ callback(null); } 
                                   );
                  }
                });
              }
            }
          });
        } else {
          main_changes[ k ] = v;
          main_required = true;
        }
      });

      if( main_required ) {

        if( layout.ChangeDate )
          main_changes[ 'ChangeDate' ] = "now()";

        delete changes[ layout.key_field ];
        tasks.push( (cb)=>{ 
          console.log( "Updating main table");
          console.log( main_changes );
          dbConn.DBUpdate( layout.table
                         , main_changes
                         , layout.key_field + "='"+ this.state.db_id + "'"
                         , handler );
        });
      }
      async.series( tasks, (err)=> {
        console.log( "All updated!");
        console.log( err );
        if( !err )
          handler();
      });
    }
    */
  }
  // --------------------------------------------------------------
  onNewRegister( ) {
    console.log( "New register...");
    const new_db_data = layouts.getNewEmptyRegister( this.state.layout );
    this.setState({
            db_data:Immutable.fromJS( new_db_data ),
            db_orig_data:Immutable.fromJS( new_db_data ),
            db_creating_new:true,
            db_id:true,
            db_delta:{},
            });
  }

  onClickNew( ) {
    this.context.router.push( this.state.layout.urls.new )
  }

  // --------------------------------------------------------------
  onClickDelete( ) {
    ///this.setState({modal_dlg_open:true, modal_dlg_msg:"¿Borrar completamente el registro?"});
  }

  // --------------------------------------------------------------
  onClickCopy( ) {
    console.log( "Copying to clipboard...");
  }

  // --------------------------------------------------------------
  onClickPaste( ) {
    console.log( "Pasting from clipboard...");
  }

  // --------------------------------------------------------------
  onClickSearchAgain() {
    this.context.router.push( this.state.layout.urls.search );
  }

  onClickDevOptions() {
    let new_trace = this.state.trace + 1;
    if( new_trace > 2 )
      new_trace = 0;
    this.setState( {trace:new_trace} );
  }

  // --------------------------------------------------------------
  onClick( e, dummy ) {
    console.log( "On click..." + e );
  }

  // ------------------------------------------------------------------
  renderDisconnected() {
    const style = {
      margin: "auto",
      textAlign: "center"
    };
    return (<div style={style}>Trying to connect to the database...<CircularProgress mode="indeterminate" /></div>);
  }

  renderSearchForm() {
    var code = JSON.stringify( this.state.layout, null, '  ' );
    return (<CompSearchDB 
        layout={this.state.layout} 
        onClickNew={this.onClickNew.bind(this)}
        onClickSearchResult={this.onClickSearchResult.bind(this)}
        search_state={this.state.search_state}
        />);
    //return (<div>You are searching <pre>{code}</pre></div>);
  }

  // ---------------------------------------------------------------- 
  renderSearchButton( ) {
    return (<IconButton tooltip="Buscar de nuevo" onClick={this.onClickSearchAgain.bind(this)}><ActionSearch/></IconButton>);
  }

  // ---------------------------------------------------------------- 
  renderSaveButton() {
    const buttons_group_style = {float:"right"};
    var changed = this.state.db_changed_rec;
    var is_new = this.state.db_creating_new;

    //    <IconButton tooltip="Copiar Valores" onClick={this.onClickCopy.bind(this)}><ActionCopy/></IconButton>
    //    <IconButton tooltip="Pegar Valores" onClick={this.onClickPaste.bind(this)}><ActionPaste/></IconButton>
    return (
      <CardActions expandable style={buttons_group_style}>
        <IconButton tooltip="Dev" onClick={this.onClickDevOptions.bind(this)}><ActionBuild/></IconButton>
        <IconButton tooltip="Buscar de nuevo" onClick={this.onClickSearchAgain.bind(this)}><ActionSearch/></IconButton>
        <IconButton disabled={changed || is_new} tooltip="Nuevo Registro" onClick={this.onClickNew.bind(this)}><ActionNew/></IconButton>
        <IconButton disabled={!changed && !is_new} tooltip="Guardar Cambios" onClick={this.onClickSave.bind(this)}><ActionSave/></IconButton>
        <IconButton disabled={!changed && !is_new} tooltip="Deshacer Cambios" onClick={this.onClickUndo.bind(this)}><ActionUndo/></IconButton>
        <IconButton disabled={changed || is_new} tooltip="Borrar Registro" onClick={this.onClickDelete.bind(this)}><ActionDelete/></IconButton>
      </CardActions>);
  }

  renderForm() {
    return(
      <CompEditForm 
        data={this.state.db_data} 
        onChange={this.onDataChange.bind(this)} 
        onClick={this.onClick.bind(this)} 
        layout={this.state.layout}
        creating_new={this.state.db_creating_new}
        />);
  }

  renderSnackBar() {
    var handler = ()=>{this.setState({msg_visible: false});};
    return (
      <Snackbar
        open={this.state.msg_visible}
        message={this.state.msg_text}
        autoHideDuration={1000}
        onRequestClose={handler}/>);
  }

  renderModalDialog() {
    var handler_no = ()=>{
      this.setState({modal_dlg_open: false});
    };
    var handler_yes = ()=>{
      this.setState({modal_dlg_open: false});
      this.deleteRecord();
    };
    var actions = (
      <CardActions >
      <RaisedButton label="No" onClick={handler_no}/>
      <RaisedButton label="Yes" onClick={handler_yes}/>
      </CardActions>);
    return (<Dialog
          title={this.state.modal_dlg_msg}
          modal
          actions={actions}
          open={this.state.modal_dlg_open}
          />);   
  }

  // ------------------------------------------------------------------
  render() {

    //console.log( "CompFullLayoutDB::render", this.state.db_id, this.state.db_data, this.state.db_invalid_id )
    //console.log( this.state.db_data )
    //console.log( this.state.db_orig_data )

    if( !this.state.connected ) 
      return this.renderDisconnected();

    if( !this.state.db_id )
      return this.renderSearchForm();

    if( !this.state.db_data ) {
      var search = this.renderSearchButton();
      if( this.state.db_invalid_id )
        return (<div>{this.state.db_id} not found in the database</div>);
      return (<div>{search}Retrieving data from {this.state.db_id}</div>);
    }

    var dlg = this.renderModalDialog();
    var save = this.renderSaveButton();
    var msg = this.renderSnackBar();
    var form = this.renderForm();

    var trace_level = this.state.trace;
    var json = this.state.trace ? JSON.stringify( this.state, null, '  ' ) : "";
    if( trace_level == 1 ) {
     json = "Delta: " + JSON.stringify( this.state.db_delta, null, '  ' ) + "\n";
    } else if( trace_level == 2 ) {
     json = "State: " + JSON.stringify( this.state, null, '  ' ) + "\n";
    }

    //return (<div>Hello<pre>{json}</pre></div>);
    return (<div>{save}{form}<Divider />{msg}{dlg}<pre>{json}</pre></div>);
  }
}

CompFullLayoutDB.propTypes = {
  layout: PropTypes.string.isRequired
};

CompFullLayoutDB.contextTypes = {
  router: React.PropTypes.object
}