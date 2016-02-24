import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';

import TextField from 'material-ui/lib/text-field';
import Perf from 'react/lib/ReactDefaultPerf';

// -----------------------------------------------------------------
export default class CompFormText extends React.Component {

  componentDidMount() {
    // Check if any search field wants the focus.
    // Requires 'ref={..} when instantiating the field'
    var f = this.props.field;
    if( this.props.creating_new && f.focus_on_mount ) {
      this.refs[ f.field ].focus();
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return nextProps.value !== this.props.value;
  }

  handleChange( e ) {
    var f = this.props.field;
    var v = e.target.value;
    if( f.type === "number" || f.format === "currency") {
      v = v.replace( ",", ".");
    }
    this.props.onChange( f, v );
  }

  render() {
    //console.log( "TextRendering");
    const props = this.props;
    const f     = props.field;
    const label = props.inside_table ? "" : (f.title ? f.title : f.field);
    const disabled = f.read_only && !props.creating_new;
    let value = props.value;
    let style = f.style;
    let inputStyle = f.inputStyle;
    if( !inputStyle ) inputStyle = {};
    if( !style ) style = {};
    if( f.type === "number" || f.format === "currency") {
      inputStyle["textAlign"] = "right";
      style["width"] = null;
      if( Number( value ) === value && f.format == "currency" )
        value = value.toFixed(2);// value = value.toLocaleString( );
    }
    var errorText = null;
    if( !f.can_be_null && props.value === null )
      errorText = "Campo requerido.";
    return (
      <TextField 
        className="form_input"
        hintText={f.hint}
        floatingLabelText={label}
        value={value}
        style={style}
        inputStyle={inputStyle}
        fullWidth={f.fullWidth}
        multiLine={f.multiLine}
        id={f.field}
        disabled={disabled}
        errorText={errorText}
        onChange={this.handleChange.bind(this)}
        ref={f.field}
        />
    );
  }
}

CompFormText.propTypes = {
  field: PropTypes.object.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
    ]),
  inside_table: PropTypes.bool,
  creating_new: PropTypes.bool,
  onChange: PropTypes.func.isRequired
};

export default CompFormText;