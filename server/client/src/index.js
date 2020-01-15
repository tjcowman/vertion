import React from 'react';
import ReactDOM from 'react-dom'; 
import Axios from 'axios';


class QueryForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
        input: '',
        response: '',
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({input: event.target.value});
  }

  handleSubmit(event) {

    
    {/*Make the query*/}
    Axios.post('http://localhost:9057',"hi").then((response)=>{alert(response.data)});

    {/*Update the result box*/}
        event.preventDefault();
  }

  render() {
    return(
        <form onSubmit={this.handleSubmit}>
            <input type="text" input={this.state.value} onChange={(e) =>this.handleChange(e)} /> 
            <button onClick={(e) =>this.handleSubmit(e)} >Enter</button>
            <div><textarea className="responseArea" rows="4" cols="50" readonly /> </div>
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
        </>
        );
    }
    
}

ReactDOM.render(
<App />,
document.getElementById('root')
);
