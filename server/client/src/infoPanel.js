import {} from 'react-bootstrap'
import React from 'react';
import Axios from 'axios';

import {SelectedElementDeck}  from './selectedElementDeck.js'

import {Button, Card, ListGroup} from 'react-bootstrap';

import './infoPanel.css';

class GraphViewDisplay extends React.Component{
    constructor(props){
        super(props);
//         this.state = {
//             versionCardFocus: 0
//         }
    }
    
    handleClickVersionCardFocus=(id)=>{
        if(this.props.staleCards[id]){
            this.props.handleDescribeClick(id);
            this.props.markCardFresh(id);
        }
        
        this.setState({
            versionCardFocus : id
            
        });
    }
    
    render(){
        return(
            <div className="graphViewContainer">
            {console.log(this.props)},
                {this.props.versionCards.map((e,i)=>(
                    <div key={i} 
                    onClick={()=>(
                        this.handleClickVersionCardFocus(i)
                    )}
                    className={i==this.props.activeVersionCard ? "activeGraphViewElement": "graphViewElement"} ></div>
                ))}
            

            </div>
        );
    }
}

class InfoPanel extends React.Component {
    constructor(props) {
        super(props);
        //This should probably be elevated too
        this.state = {
            vertexCounts: [[]],
            edgeCounts: [[]],
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
            
            let vertexCountsU = response.data.nodes.map((e) => (
                this.props.vertexLabelNames.bitsToNames(e.labels) + " : " + e.count
            ));
            let edgeCountsU = response.data.edges.map((e) => (
                this.props.edgeLabelNames.bitsToNames(e.labels) + " : " + e.count
            ));
            
            let vertexCounts = [...this.state.vertexCounts];
            vertexCounts[id] = vertexCountsU;
            let edgeCounts = [...this.state.edgeCounts];
            edgeCounts[id] = edgeCountsU;
            
            this.setState({vertexCounts: vertexCounts, edgeCounts: edgeCounts , });
        });
    }

    
    renderVertexCounts(){
        return(
            <Card>
                <Card.Body>
                {/*
                <ListGroup>
                    {this.state.vertexCounts[this.props.activeVersionCard].map((e,i)=>(
                        < ListGroup.Item key={i}>{e}</ListGroup.Item>
                    ))}
                </ListGroup>
                
                
                <ListGroup>
                    {this.state.edgeCounts[this.props.activeVersionCard].map((e,i)=>(
                        <ListGroup.Item key={i}>{e}</ListGroup.Item>
                    ))}
                </ListGroup>
                */}
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
                staleCards = {this.props.staleCards}
                versionCards={this.props.versionCards}
                 activeVersionCard={this.props.activeVersionCard}
                 handleClickVersionCard = {this.props.handleClickVersionCard}
                handleDescribeClick={this.handleDescribeClick}
                markCardFresh={this.props.markCardFresh}
            />

            
            
            {this.renderVertexCounts()}
            </Card.Body>
            </Card>
           
             
        );
    }
} 

export {InfoPanel};
