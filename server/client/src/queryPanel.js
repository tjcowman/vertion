import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Form,Col,Row,Tabs,Tab} from 'react-bootstrap';

import React from 'react';
// import ReactDOM from 'react-dom'; 
import Axios from 'axios';
 
import BootstrapTable from 'react-bootstrap-table-next';
import paginationFactory from 'react-bootstrap-table2-paginator';
import filterFactory, { textFilter } from 'react-bootstrap-table2-filter';
    
import MotifComponent from './motifComponent.js';


import CytoscapeComponent from 'react-cytoscapejs'

// class Demo extends React.Component {
//   
//   constructor(props){
//     super(props);
//     this.state={
//         w: 200,
//         h: 200,
//     }
//   }
//     
// 
//   componentDidMount = () => {
//     this.setState({
//       w: window.innerWidth,
//       h: window.innerHeight
//     })
//      this.setUpListeners()
//   }
//   
//   setUpListeners = () => {
//     this.cy.on('click', 'node', (event) => {
// //       console.log(event.target)
// //       console.log(this.state.elements)
// //       console.log(this.props.elements2)
//       this.cy.layout({ name: 'cose' }).run();
//     })
//   }
//   
// //   setElements = (nodes) => {
// //     this.setState({
// //         elements: [nodes,{}]
// //     })
// //   }
//   
//   render() {
// //     const layout = { name: 'cola' };
//     return(
//       <div>
//         <CytoscapeComponent
//             elements={this.props.elements}
// //             layout={layout}
//             style={{ width: this.state.w, height: this.state.h }}
//             cy={(cy) => {this.cy = cy}}
//         />
//       </div>
//     )
//     }
// }
// 
// 
// function cyformat_nodes(raw){
//     console.log(raw);
//     return raw.map( (e) => ({data: { id: e.id, label: e.name }, position: { x: 0, y: 0 } }));
// 
// }
// 
// function cyformat_edges(raw){
//     return raw.map((e) => ({ data: { source: e.id1, target: e.id2, label: e.labels}} ) );
// }

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


class QueryPanel extends React.Component {
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

  render() {
    return(
        <div>
            <div className="card">
                <div className="card-body"> 
                    <Row>
                       {/* <Col>Source<Form.Control name="source" value={this.state.source} onChange={(e) =>this.handleChange(e)} /></Col> */}

                        <Col>Locality = {this.state.alpha}<input type="range" name="alpha" className="custom-range" min=".05" max="1" value={this.state.alpha} step=".05" id="customRange1" onChange={(e) =>this.handleChange(e)} ></input></Col>

                        <Col>Convergence = 1x10<sup>-{this.state.epsilon}</sup><input type="range" name="epsilon" className="custom-range" min="1" max="10" value={this.state.epsilon} step="1" id="customRange1" onChange={(e) =>this.handleChange(e)} ></input></Col>
                        <Col>Top k<Form.Control   name="topk"  value={this.state.topk} onChange={(e) =>this.handleChange(e)} /></Col>
                    </Row>

                
                </div>
            </div>

            <Button className="form-control" variant="primary" onClick={(e) =>this.handleSubmit(e)} >Submit</Button>


            <div  style={{ marginTop: 20 }}>
            <Tabs defaultActiveKey="results-table" id="resultsFormat">
                <Tab eventKey="results-table" title="Table">
                    <BootstrapTable striped keyField='row' data={ this.state.result.nodes} columns={ getColumns()}  pagination={ paginationFactory()} filter={ filterFactory() }   />
                </Tab>
                <Tab eventKey="results-motif" title="Motifs">
                    <MotifComponent getSelectedVersions={this.props.getSelectedVersions} getLabels={this.props.getLabels}/>
                </Tab>
                <Tab eventKey="results-graph" title="Graph">
                    {/*   <Demo elements={cyformat_nodes(this.state.result.nodes).concat(cyformat_edges(this.state.result.edges)) } />*/}
                </Tab>
            </Tabs>
            </div>
       

        </div>

    );
  }
}


export default QueryPanel;
// , cyformat_edges(this.state.result.edges)
