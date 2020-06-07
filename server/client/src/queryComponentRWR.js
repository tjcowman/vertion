import React from 'react';

import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Form,Col,Row, Card, Alert} from 'react-bootstrap';


// import ReactDOM from 'react-dom';
import Axios from 'axios';

import BootstrapTable from 'react-bootstrap-table-next';
import paginationFactory from 'react-bootstrap-table2-paginator';
import filterFactory, { textFilter } from 'react-bootstrap-table2-filter';

import {RolloverPanel} from './rolloverPanel.js'


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
            
            console.log("hi"),
            <Card>
                <Card.Header>Settings</Card.Header>
                <Card.Body>
                    
                       Locality = {this.props.alpha}
                            <input type="range" name="alpha" className="custom-range" min=".05" max="1"
                                value={this.props.alpha} step=".05" id="customRange1"
                                onChange={(e) =>this.props.handleChange(e)} >
                            </input>
                        

                        Convergence = 1x10<sup>-{this.props.epsilon}</sup>
                            <input type="range" name="epsilon" className="custom-range" min="1" max="10"
                                value={this.props.epsilon} step="1" id="customRange1"
                                onChange={(e) =>this.props.handleChange(e)} >
                            </input>
                        

                        Top k
                            <Form.Control name="topk"
                                value={this.props.topk}
                                onChange={(e) =>this.props.handleChange(e)}
                            />
                        

                    
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
        let versions = [...this.props.versionCardsO.cards[this.props.versionCardsO.activeCard].versions_s];

        if(versions.length === 0)
        {
            this.props.handleLog("e", "no versions");
            this.setState({result:  {nodes:[{"row":null, "id":null, "value":null}], edges: [] } });
            return;
        }

        let epsilon = (1/(Math.pow(10,this.state.epsilon)));
        let selectedNodes = [];

       this.props.versionCardsO.cards[this.props.versionCardsO.activeCard].nodes_s.forEach((v1,v2) => (selectedNodes.push({i:v1, v:1})));

//         console.log("SN", selectedNodes);

        let command = {cmd:"rwr2", versions:versions, alpha:Number(this.state.alpha), epsilon:Number(epsilon),
            topk:Number(this.state.topk), source:selectedNodes, mode:"el",
            vertexLabels:  [...this.props.versionCardsO.cards[this.props.versionCardsO.activeCard].labelsV_s],
            edgeLabels:  [...this.props.versionCardsO.cards[this.props.versionCardsO.activeCard].labelsE_s]
        };
//         console.log("cmd", command)


        Axios.post('http://'+this.props.backAddr, JSON.stringify(command)).then((response)=>{
        //    console.log("cmd",response.data)

            let ids = response.data.nodes.map((e) => e.id);


            let formatResponse = () =>{
               let result = response.data.nodes.map((e,i) => ({
                    row : i,
                    value : e.value,
                    name: this.props.nodeData.getEntry(e.id).name,
                    labels: this.props.nodeData.getEntry(e.id).labelsText

                }))

              console.log(result)
                this.setState({ result:  {nodes:result, edges: response.data.edges } })

            }

            this.props.handleNodeLookupIndex(ids, formatResponse);

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
        <>
        
            <div>
      
            <Button className="form-control" variant="primary" onClick={(e) =>this.handleSubmit(e)} >Submit</Button>
            <Card.Body>
                {this.renderResults()}
            </Card.Body>
            </div>
            
            
            <RolloverPanel component= { <SettingsRWR handleChange={this.handleChange} alpha={this.state.alpha} epsilon={this.state.epsilon} topk={this.state.topk}/>}/>
            


        </>

    );
  }
}

export  {SettingsRWR, QueryComponentRWR};
