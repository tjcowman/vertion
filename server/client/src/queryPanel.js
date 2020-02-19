import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Form,Col,Row,Tabs,Tab} from 'react-bootstrap';

import React from 'react';
import ReactDOM from 'react-dom'; 
import Axios from 'axios';
 
import BootstrapTable from 'react-bootstrap-table-next';
import paginationFactory from 'react-bootstrap-table2-paginator';
import filterFactory, { textFilter } from 'react-bootstrap-table2-filter';
    


import CytoscapeComponent from 'react-cytoscapejs'

class Demo extends React.Component {
  
  state = {
    w: 100,
    h: 100,
    elements : [
{ data: { id: 'one', label: 'Node 1' }, position: { x: 0, y: 0 } },
{ data: { id: 'two', label: 'Node 2' }, position: { x: 100, y: 0 }},
{ data: { source: 'one', target: 'two', label: 'Edge from Node1 to Node2'}}
]
  }

  componentDidMount = () => {
    this.setState({
      w: window.innerWidth,
      h:window.innerHeight
    })
  }
  
  render() {
    return(
      <div>
        <CytoscapeComponent
            elements={this.state.elements}
            style={{ width: this.state.w, height: this.state.h }}
        />
      </div>
    )
}
}


function getColumns(){
    let col = [
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

    return col;
}

// NOTE: This is because the default size per page renderer seems to refresh the page on clicking it
const sizePerPageRenderer = ({
  options,
  currSizePerPage,
  onSizePerPageChange
}) => (
  <div className="btn-group" role="group">
    {
      options.map(option => (
        <button
          key={ option.text }
          type="button"
          onClick={ () => onSizePerPageChange(option.page) }
          className={ `btn ${currSizePerPage === `${option.page}` ? 'btn-secondary' : 'btn-selected'}` }
        >
          { option.text }
        </button>
      ))
    }
  </div>
);

const options = {
  sizePerPageRenderer
};

class QueryPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
        versions: [],
        source: "[ ]",
        alpha: .15,
        epsilon: 1e-5,
        topk: 10,
        result: [{"row":null, "id":null, "value":null}],
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


  labelBitsToArray(labelBits, labelsUsed){
    let indexes = [];
    for(let i=0; i<labelsUsed; ++i) {
        if (labelBits & 0x1)
            indexes.push(i);
    
    labelBits = labelBits >> 1;
    }
    return indexes;
  }
  
  convertLabelArrayToText(labelArray, labelNames){
    let names=[];
//     console.log(labelNames);
    for(let e in labelArray)
      names.push(labelNames[e]);
        
    return names;
      
  }
  
  handleSubmit(event) {

    try{
        let versions = this.props.getSelectedVersions();
        if(versions.length === 0)
        {
            this.setState({result:  [{"row":null, "id":null, "value":null}]});
            return;
        }
            
        
        let command = {cmd:"rwr", versions:versions, alpha:Number(this.state.alpha), epsilon:Number(this.state.epsilon), topk:Number(this.state.topk), source:JSON.parse(this.state.source)}; 
//         console.log(JSON.stringify(command))
//         console.log(JSON.parse(this.state.source))
    
        Axios.post('http://localhost:9060', JSON.stringify(command)).then((response)=>{
         
            response.data.weights.forEach((e,i) => {
                let labelBits = this.props.getVertexDataRow(e["id"])["labels"];
                let labelArray = this.labelBitsToArray(labelBits, this.props.getLabels()[0].names.length);
                //let externalURLPrexfix = this.get
                                
                e["row"]=i;  
//                   label=== 1 ? :
                   // this.props.getVertexDataRow(e["id"])["name"]  <a href="url">this.props.getVertexDataRow(e["id"])["name"]</a>,
                e["name"]=this.props.getVertexDataRow(e["id"])["name"];
        
                e["labels"] = this.convertLabelArrayToText(labelArray, this.props.getLabels()[0].names);//this.props.getVertexDataRow(e["id"])["labels"],
//                 e["labels"] = [];
                
//                 for(let li in labelArray)
//                 {
//                     this.props.getLabels()[0].url[labelArray[li]]  !== ""  ? 
//                         e["labels"].push(<a href={this.props.getLabels()[0].url[li] + e["name"]} target="_blank">{this.props.getLabels()[0].names[li]}</a>) :
//                         e["labels"].push(this.props.getLabels()[0].names[labelArray[li]]);
//                 }
               
            });
            
            
            
            this.setState({result: response.data.weights})
//           console.log(this.state.result);
        });
      
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
                        <Col>Source<Form.Control name="source" value={this.state.source} onChange={(e) =>this.handleChange(e)} /></Col>
                        <Col>Alpha <Form.Control  name="alpha"  value={this.state.alpha} onChange={(e) =>this.handleChange(e)} /> </Col>
                        <Col>Epsilon<Form.Control   name="epsilon"  value={this.state.epsilon} onChange={(e) =>this.handleChange(e)} /></Col>
                        <Col>Top k<Form.Control   name="topk"  value={this.state.topk} onChange={(e) =>this.handleChange(e)} /></Col>
                    </Row>

                
                </div>
            </div>

            <Button className="form-control" variant="primary" onClick={(e) =>this.handleSubmit(e)} >Submit</Button>


            <div  style={{ marginTop: 20 }}>
            <Tabs defaultActiveKey="results-table" id="resultsFormat">
                <Tab eventKey="results-table" title="Table">
                    <BootstrapTable striped condensed keyField='row' data={ this.state.result} columns={ getColumns()}  pagination={ paginationFactory(options)} filter={ filterFactory() }   />
                </Tab>
                <Tab eventKey="results-graph" title="Graph">
                    <Demo/>
                </Tab>
            </Tabs>
            </div>
       

        </Form>

    );
  }
}


export default QueryPanel;
