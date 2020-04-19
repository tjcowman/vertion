import {} from 'react-bootstrap'
import React from 'react';
import Axios from 'axios';



import {Card, ListGroup} from 'react-bootstrap';

import './infoPanel.css';

class GraphViewDisplay extends React.Component{
    
    render(){
        return(
            <div className="graphViewContainer border">
            
                {this.props.versionCardsO.cards.map((e,i)=>(
                    <div key={i} 
                    onClick={()=>(
                        this.props.handleClickVersionCard(i)
                    )}
                    className={e.isStale ? 
                        "  border border-warning graphViewElementBase staleGraphViewElement"
                        : i === this.props.activeVersionCard ? " border border-primary graphViewElementBase activeGraphViewElement": " border  graphViewElementBase"
                        
                    } >
                        <div className="border bg-light  gveHeader">
                        </div>
                        <div className=" text-secondary gveBody">
                        {i}
                        </div>
                    </div>
                ))}
            

            </div>
        );
    }
}

class InfoPanel extends React.Component {

    handleUpdate=(id)=>{

        if(this.props.versionCardsO.cards[id].isStale){
            let command = { 
                cmd: 'lsv',
                versions:  [...this.props.versionCardsO.cards[this.props.activeVersionCard].versions_s],//[...this.props.selectedVersions[id]]
                vertexLabels: [...this.props.versionCardsO.cards[this.props.activeVersionCard].labelsV_s],
                edgeLabels: [...this.props.versionCardsO.cards[this.props.activeVersionCard].labelsE_s],
            }
            console.log("command",command)
            
            Axios.post('http://'+this.props.backAddr, JSON.stringify(command)).then((response)=>{
                console.log("DR", response);
                
                //nodes : {label: , count: }
                let nodes = response.data.nodes.map((e) => ({
     
                    labels : this.props.elementNames.labelsV.bitsToNamesFlat(e.labels).join(", "),
                    count : e.count
                }));
                
                let edges =  response.data.edges.map((e) => ({
                    labels : this.props.elementNames.labelsE.bitsToNamesFlat(e.labels).join(", "),
                    count : e.count
                }));
                
                let stats = {nodes: nodes, edges: edges};
                this.props.handleUpdateStats(id, stats);

            });
       
            
        }
            
            
            
        this.props.handleClickVersionCard(id);
    }
    


    
    renderVertexCounts(){
        return(
            <Card>
                <Card.Body>
                
                <ListGroup>
                    {this.props.versionCardsO.cards[this.props.activeVersionCard].stats.nodes.map((e,i)=>(
                        < ListGroup.Item key={i}>{e.labels + " : " + e.count }</ListGroup.Item>
                    ))}
                </ListGroup>
                
        
                <ListGroup>
                    {this.props.versionCardsO.cards[this.props.activeVersionCard].stats.edges.map((e,i)=>(
                        <ListGroup.Item key={i}>{e.labels + " : " + e.count}</ListGroup.Item>
                    ))}
                </ListGroup>
     
                </Card.Body>
            </Card>
        );
    }
    
   
    render(){
        return(
            console.log("rendering main", this.props),
            <Card>
                <Card.Body>
                <Card>
                <Card.Header>Integrated Networks</Card.Header>
              
                
                    <GraphViewDisplay
                        versionCardsO={this.props.versionCardsO}
                        activeVersionCard={this.props.activeVersionCard}
                        handleClickVersionCard = {this.handleUpdate}

                    />
              
                </Card>
                </Card.Body>
                
                <Card.Body>
                    {this.renderVertexCounts()}
                </Card.Body>
            </Card>
           
             
        );
    }
} 

export {InfoPanel};
