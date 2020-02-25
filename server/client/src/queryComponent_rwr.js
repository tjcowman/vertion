import React from 'react';

import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Form,Col,Row,Tabs,Tab, Card, TabPane} from 'react-bootstrap';


// import ReactDOM from 'react-dom'; 
import Axios from 'axios';
 
import BootstrapTable from 'react-bootstrap-table-next';
import paginationFactory from 'react-bootstrap-table2-paginator';
import filterFactory, { textFilter } from 'react-bootstrap-table2-filter';
    

function getColumns(){
    return [
        {
            dataField: "name",
            text: "name",
            filter: textFilter()
        },
        {
            dataField: "labels",
            text: "labels",
            filter: textFilter()
        },
        {
            dataField: "value",
            text: "value"
        }
    
    ]   

}

class QueryComponent_rwr extends React.Component{
constructor(props) {
    super(props);
    this.state = {
        versions: [],
        source: "[ ]",
        alpha: .15,
        epsilon: 5,
        topk: 10,
        result: {nodes:[{"row":null, "id":null, "value":null}], edges: [] },
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
        let versions = this.props.getSelectedVersions();
        console.log("IF", versions)
        console.log("VersionLength", versions.length)
        if(versions.length === 0)
        {
             this.setState({result:  {nodes:[{"row":null, "id":null, "value":null}], edges: [] } });
             return;
        }
        //let command = {cmd:"rwr", versions:versions, alpha:Number(this.state.alpha), epsilon:Number(this.state.epsilon), topk:Number(this.state.topk), source:JSON.parse(this.state.source), mode:nl};
        
        let epsilon = (1/(Math.pow(10,this.state.epsilon)));
        let selectedNodes = [];
        this.props.getSelectedNodes().forEach((v1,v2) => (selectedNodes.push({i:v1, v:1})));
//         console.log("SN", selectedNodes);
//         console.log(epsilon)
        //let command = {cmd:"rwr", versions:versions, alpha:Number(this.state.alpha), epsilon:Number(epsilon), topk:Number(this.state.topk), source:JSON.parse(this.state.source), mode:"el"};
        let command = {cmd:"rwr", versions:versions, alpha:Number(this.state.alpha), epsilon:Number(epsilon), topk:Number(this.state.topk), source:selectedNodes, mode:"el"}; 

        Axios.post('http://localhost:9060', JSON.stringify(command)).then((response)=>{
         console.log(response)
         
            response.data.nodes.forEach((e,i) => {
                let labelBits = this.props.getVertexDataRow(e["id"])["labels"];
                //let externalURLPrexfix = this.get
                                
                e["row"]=i;  

                e["name"]=this.props.getVertexDataRow(e["id"])["name"];

                e["labels"] = this.props.getLabels()[0].bitsToNames(labelBits);

            });
            
            
            
            this.setState({result: response.data})
//           console.log(this.state.result);
        });
      
    }
    catch(err){
        
    }
 
//     event.preventDefault();
  }
  
  renderSettings(){
      return (

        
            <Card>
                <Card.Header>Settings</Card.Header>
                <Card.Body> 
                    <Row>
                        <Col>Locality = {this.state.alpha}<input type="range" name="alpha" className="custom-range" min=".05" max="1" value={this.state.alpha} step=".05" id="customRange1" onChange={(e) =>this.handleChange(e)} ></input></Col>
                        <Col>Convergence = 1x10<sup>-{this.state.epsilon}</sup><input type="range" name="epsilon" className="custom-range" min="1" max="10" value={this.state.epsilon} step="1" id="customRange1" onChange={(e) =>this.handleChange(e)} ></input></Col>
                        <Col>Top k<Form.Control   name="topk"  value={this.state.topk} onChange={(e) =>this.handleChange(e)} /></Col>
                    </Row>
                </Card.Body>
                
                <Card.Body>
                    <Button className="form-control" variant="primary" onClick={(e) =>this.handleSubmit(e)} >Submit</Button>
                </Card.Body>
            </Card>
            

      );
  }
  
  renderResults(){
      return(

          <Card>
          <Card.Header>Results</Card.Header>
          <Card.Body>
          
  
                <BootstrapTable striped keyField='row' data={ this.state.result.nodes} columns={ getColumns()}  pagination={ paginationFactory()} filter={ filterFactory() }   />
           
                    
     
        </Card.Body>
        </Card>
      );
  }

  render() {
    return(
        <Card>
            <Card.Body>
            {this.renderSettings()}
            </Card.Body>
                
            <Card.Body>
            {this.renderResults()}
             </Card.Body>

        
        </Card>

    );
  }
} 

export default QueryComponent_rwr;
