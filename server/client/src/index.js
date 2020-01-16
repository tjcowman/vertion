import React from 'react';
import ReactDOM from 'react-dom'; 
import Axios from 'axios';

import './index.css';

var cmd_get_version_list = {cmd: "ls"};

// function makeRequest(input) {
//      return Axios.post('http://localhost:9060',input).then((response)=> {return response.data});
// }


class VersionList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            names: [],
        };
        Axios.post('http://localhost:9060', JSON.stringify(cmd_get_version_list)).then((response)=>{this.setState({names: response.data})});
    }
    
    render(){
        return(
             <div><textarea className="responseArea" value={JSON.stringify(this.state.names)} rows="4" cols="50" readOnly />  </div>
        );
    }
}

class QueryForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
        version: 0,
        alpha: .15,
        epsilon: .1,
        result: "",
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    let name = event.target.name;
    let value= event.target.value;
      
    this.setState({
        [name]: value,
    }/*, () => alert(this.state.version)*/)
 
  }


  handleSubmit(event) {

    let command = {cmd:"rwr", version:Number(this.state.version), alpha:Number(this.state.alpha), epsilon:Number(this.state.epsilon)}; 
//     alert(JSON.stringify(command))
    
     Axios.post('http://localhost:9060', JSON.stringify(command)).then((response)=>{this.setState({result: response.data})});
    event.preventDefault();
  }

  render() {
    return(
        <form>
            Version <input  className="rwr" name="version" size="20" value={this.state.version} onChange={(e) =>this.handleChange(e)} />
            Alpha <input  className="rwr" name="alpha"  value={this.state.alpha} onChange={(e) =>this.handleChange(e)} />
            Epsilon <input  className="rwr" name="epsilon"  value={this.state.epsilon} onChange={(e) =>this.handleChange(e)} />
            <button onClick={(e) =>this.handleSubmit(e)} >Enter</button>
            <div><textarea className="responseArea" rows="4" cols="50" readOnly value={JSON.stringify(this.state.result)} /> </div>
        </form>

    );
  }
}

class App extends React.Component {
    constructor(props){
        super(props);
        this.state={
        }
    }
    
    
    render(){
        return(
        <>
     
        <QueryForm />
        <VersionList/>
        </>
        );
    }
    
}

ReactDOM.render(
<App />,
document.getElementById('root')
);
