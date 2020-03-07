import {} from 'react-bootstrap'
import React from 'react';
import Axios from 'axios';

import {SelectedElementDeck}  from './selectedElementDeck.js'

import {Button, Card, ListGroup} from 'react-bootstrap';

import './infoPanel.css';

class GraphViewDisplay extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            versionCardFocus: 0
        }
    }
    
    handleClickVersionCardFocus=(id)=>{
        this.setState({
            versionCardFocus : id
            
        });
    }
    
    render(){
        return(
            <div className="graphViewContainer">
                {this.props.versionCards.map((e,i)=>(
                    <div key={i} 
                    onClick={()=>(
                        this.handleClickVersionCardFocus(i),
                        this.props.handleDescribeClick(i)
                    )}
                    className={i==this.state.versionCardFocus ? "activeGraphViewElement": "graphViewElement"} ></div>
                ))}
            

            </div>
        );
    }
}

class InfoPanel extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            vertexCounts: [],
            edgeCounts: [],
        };
    }
    
    
        handleDescribeClick=(id)=>{
//         console.log(this)
            
        let command = { 
            cmd: 'lsv',
            versions: [...this.props.selectedVersions[id]],
            vertexLabels: [...this.props.selectedVertexLabels[id]],
            edgeLabels: [...this.props.selectedEdgeLabels[id]]
        }
         Axios.post('http://localhost:9060', JSON.stringify(command)).then((response)=>{
            console.log(response);
            
            let vertexCounts = response.data.nodes.map((e) => (
                this.props.vertexLabelNames.bitsToNames(e.labels) + " : " + e.count
            ));
            let edgeCounts = response.data.edges.map((e) => (
                this.props.edgeLabelNames.bitsToNames(e.labels) + " : " + e.count
            ));
            
            this.setState({vertexCounts: vertexCounts, edgeCounts: edgeCounts , });
        });
    }

    
    renderVertexCounts(){
        return(
            <Card>
                <Card.Body>
                
                <ListGroup>
                    {this.state.vertexCounts.map((e,i)=>(
                        < ListGroup.Item key={i}>{e}</ListGroup.Item>
                    ))}
                </ListGroup>
                
                
                <ListGroup>
                    {this.state.edgeCounts.map((e,i)=>(
                        <ListGroup.Item key={i}>{e}</ListGroup.Item>
                    ))}
                </ListGroup>
                
                </Card.Body>
            </Card>
        );
    }
    
   
    render(){
        return(
            console.log(this.state),
            <Card>
            <Card.Body>
            
            <GraphViewDisplay
                versionCards={this.props.versionCards}
                handleDescribeClick={this.handleDescribeClick}
            />

            
            
            {this.renderVertexCounts()}
            </Card.Body>
            </Card>
           
             
        );
    }
} 

export {InfoPanel};
