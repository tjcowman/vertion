import {} from 'react-bootstrap'
import React from 'react';
import Axios from 'axios';

import {SelectedElementDeck}  from './selectedElementDeck.js'

import {Button, Card, ListGroup} from 'react-bootstrap';

class InfoPanel extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            activeCard: 0,
            cardIds:[0,1],
            vertexCounts: [new Array(), new Array()],
            edgeCounts: [new Array(), new Array()],
        };
    }
    
    
        handleDescribeClick(){
        let command = { 
            cmd: 'lsv',
            versions: [...this.props.selectedVersions[0]],
            vertexLabels: [...this.props.selectedVertexLabels[0]],
            edgeLabels: [...this.props.selectedEdgeLabels[0]]
        }
         Axios.post('http://localhost:9060', JSON.stringify(command)).then((response)=>{
            console.log(response);
            
            let vertexCounts = response.data.nodes.map((e) => (
                this.props.vertexLabelNames.bitsToNames(e.labels) + " : " + e.counts
            ));
            let edgeCounts = response.data.edges.map((e) => (
                this.props.edgeLabelNames.bitsToNames(e.labels) + " : " + e.counts
            ));
            
            this.setState({vertexCounts: vertexCounts, edgeCounts: edgeCounts , });
        });
    }

    
    renderVertexCounts(){
        return(
            <>
            <ListGroup>
            {this.state.vertexCounts.map((e,i)=>(
                <ListGroup.Item>{this.props.vertexLabelNames.bitsToNames(e.labels) }</ListGroup.Item>
            ))}
            </ListGroup></>
        );
    }
    
   
    render(){
        return(
            <Card>
            <Card.Body>
            <Button onClick={(e)=>this.handleDescribeClick()} >test</Button>
            
            

            
            
            {this.renderVertexCounts()}
            </Card.Body>
            </Card>
           
             
        );
    }
} 

export {InfoPanel};
