import React from 'react';

import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Form,Col,Row, Card} from 'react-bootstrap';


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

class SettingsRWR extends React.Component{

    render(){
        return (
            <Card>
                <Card.Header>Settings</Card.Header>
                <Card.Body> 
                    <Row>
                        <Col>Locality = {this.props.alpha}
                            <input type="range" name="alpha" className="custom-range" min=".05" max="1" 
                                value={this.props.alpha} step=".05" id="customRange1" 
                                onChange={(e) =>this.props.handleChange(e)} >
                            </input>
                        </Col>
                        
                        <Col>Convergence = 1x10<sup>-{this.props.epsilon}</sup>
                            <input type="range" name="epsilon" className="custom-range" min="1" max="10" 
                                value={this.props.epsilon} step="1" id="customRange1" 
                                onChange={(e) =>this.props.handleChange(e)} >
                            </input>
                        </Col>
                            
                        <Col>Top k
                            <Form.Control name="topk" 
                                value={this.props.topk} 
                                onChange={(e) =>this.props.handleChange(e)} 
                            />
                        </Col>
                            
                    </Row>
                </Card.Body>

            </Card>
            
        );
    }
  
}

class QueryComponentRWR extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            alpha: .15,
            epsilon: 5,
            topk: 10,
            result: {nodes:[{"row":null, "id":null, "value":null}], edges: [] },
        };

    }

  handleChange=(event)=>{
    let name = event.target.name;
    let value= event.target.value;
      
    this.setState({
        [name]: value,
    })
 
  }

  handleSubmit=(event)=>{

    try{
        let versions = [...this.props.selectedVersions[0]];
        console.log("VR", versions)
        if(versions.length === 0)
        {
             this.setState({result:  {nodes:[{"row":null, "id":null, "value":null}], edges: [] } });
             return;
        }
        //let command = {cmd:"rwr", versions:versions, alpha:Number(this.state.alpha), epsilon:Number(this.state.epsilon), topk:Number(this.state.topk), source:JSON.parse(this.state.source), mode:nl};
        
        let epsilon = (1/(Math.pow(10,this.state.epsilon)));
        let selectedNodes = [];
         console.log("ep", epsilon)
        this.props.selectedNodes[0].forEach((v1,v2) => (selectedNodes.push({i:v1, v:1})));
         console.log("SN", selectedNodes);

//         let command = {cmd:"rwr", versions:versions, alpha:Number(this.state.alpha), epsilon:Number(epsilon), topk:Number(this.state.topk), source:selectedNodes, mode:"el"};
        let command = {cmd:"rwr2", versions:versions, alpha:Number(this.state.alpha), epsilon:Number(epsilon), 
            topk:Number(this.state.topk), source:selectedNodes, mode:"el",
            vertexLabels: [...this.props.selectedVertexLabels[0]],
            edgeLabels: [...this.props.selectedEdgeLabels[0]]
        }; 
//         console.log("cmd", command)
        
        
        Axios.post('http://localhost:9060', JSON.stringify(command)).then((response)=>{
//          console.log("cmd",response)
         
            response.data.nodes.forEach((e,i) => {
                let labelBits = this.props.getVertexDataRow(e["id"])["labels"];
                                
                e["row"]=i;  

                e["name"]=this.props.getVertexDataRow(e["id"])["name"];

                e["labels"] = this.props.getLabels()[0].bitsToNames(labelBits);

            });
            
            
            
            this.setState({result: response.data})
           console.log(this.state.result);
        });
      
    }
    catch(err){
        
    }
 
     event.preventDefault();
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
                <SettingsRWR handleChange={this.handleChange} alpha={this.state.alpha} epsilon={this.state.epsilon} topk={this.state.topk}/>
                <Button className="form-control" variant="primary" onClick={(e) =>this.handleSubmit(e)} >Submit</Button>
            </Card.Body>
                
            <Card.Body>
                {this.renderResults()}
             </Card.Body>

        
        </Card>

    );
  }
} 

export  {SettingsRWR, QueryComponentRWR};
