import React from 'react'

export default class Repos extends React.Component {

  handleSubmit(event) {
    event.preventDefault()
    const userName = event.target.elements[0].value
    const repo = event.target.elements[1].value
    const path = `/repos/${userName}/${repo}`
    console.log(path)
    this.context.router.push(path)
  }

  render() {
    var msg;
    if( this.props.params.reposName ) {
      msg = (<div>Repos of user {this.props.params.userName} named {this.props.params.reposName}</div>);

    } else {
      msg = (
      <form onSubmit={this.handleSubmit.bind(this)}>
        <input type="text" placeholder="userName"/> / {' '}
        <input type="text" placeholder="repo"/>{' '}
        <button type="submit">Go</button>
      </form>
      );
    }

    return (<div>{msg}</div>);
  }
}

Repos.contextTypes = {
  router: React.PropTypes.object
}

