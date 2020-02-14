import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, ButtonToolbar, Form,Col,Row} from 'react-bootstrap';

import React from 'react';
import ReactDOM from 'react-dom'; 
import Axios from 'axios';
 



class QueryPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
        version: 0,
        source: "[ ]",
        alpha: .15,
        epsilon: 1e-5,
        topk: 10,
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

    try{
        let version = this.props.getSelectedVersions();
        if(version.length != 1)
        {
            this.setState({result: "{error: No Version}"});
            return;
        }
            
        
        let command = {cmd:"rwr", version:Number(version), alpha:Number(this.state.alpha), epsilon:Number(this.state.epsilon), topk:Number(this.state.topk), source:JSON.parse(this.state.source)}; 
        console.log(JSON.stringify(command))
        console.log(JSON.parse(this.state.source))
    
      Axios.post('http://localhost:9060', JSON.stringify(command)).then((response)=>{this.setState({result: response.data})});
    }
    catch(err){
        
    }
 
    event.preventDefault();
  }

  render() {
    return(
        <Form className="card-body">
        <div className="card">
            <div className="card-body"> 
                <Row>
                  {/*  <Col>Version<Form.Control name="version" value={this.state.version} onChange={(e) =>this.handleChange(e)} /></Col>*/}
                    <Col>Source<Form.Control name="source" value={this.state.source} onChange={(e) =>this.handleChange(e)} /></Col>
                    <Col>Alpha <Form.Control  name="alpha"  value={this.state.alpha} onChange={(e) =>this.handleChange(e)} /> </Col>
                    <Col>Epsilon<Form.Control   name="epsilon"  value={this.state.epsilon} onChange={(e) =>this.handleChange(e)} /></Col>
                    <Col>Top k<Form.Control   name="topk"  value={this.state.topk} onChange={(e) =>this.handleChange(e)} /></Col>
                </Row>

               
            </div>
        </div>
        <textarea className="form-control" rows="4" value={JSON.stringify(this.state.result)} readOnly/>
        <Button className="form-control" variant="primary" onClick={(e) =>this.handleSubmit(e)} >Submit</Button>

        </Form>

    );
  }
}

export default QueryPanel;
