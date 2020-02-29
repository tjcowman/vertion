import React from 'react';
import {CardDeck, Card, ListGroup, ListGroupItem} from 'react-bootstrap'

import {SelectedElementDeck} from './selectedElementDeck.js'

class SelectLabelsComponent extends React.Component{

    constructor(props){
        super(props);
        this.state={
            activeCard :0,
            cardIds: [0,1]
        }
    }
    
    
    handleCardClick=(cardId)=>{
        this.setState({activeCard: cardId});
        console.log(this.state.activeCard)
    }
    
    render(){
        return(
            <Card>
                <Card.Body>
                    <div className="card">
                        <Card.Header>Vertex Labels</Card.Header>
                        <div className=" card-body "> {

                            this.props.vertexLabels.map((e,i)=>(
                            
                                <button  key={i}
                                    value={e.name} 
                                    name={i} 
                                    className={this.props.selectedVertexLabels[this.state.activeCard].has(i) ? "active btn btn-outline-secondary m-1 btn-sm vName " : "btn btn-outline-secondary m-1 btn-sm vName"}
                                    onClick={(event) =>
//                                         this.props.toggleSelectVersion(this.state.activeCard,i)
                                            this.props.handleToggle("labelsV_s",this.state.activeCard,i)
                                        
                                    }
                                > 
                                {e.name} 
                                </button>
                        ))}
                        </div>
                        
                    </div>
                    
                </Card.Body>
                <Card.Body>
                    <div className="card">
                        <Card.Header>Edge Labels</Card.Header>
                        <div className=" card-body "> {

                            this.props.edgeLabels.map((e,i)=>(
                            
                                <button  key={i}
                                    value={e.name} 
                                    name={i} 
                                    className={this.props.selectedEdgeLabels[this.state.activeCard].has(i) ? "active btn btn-outline-secondary m-1 btn-sm vName " : "btn btn-outline-secondary m-1 btn-sm vName"}
                                    onClick={(event) =>
//                                         this.props.toggleSelectVersion(this.state.activeCard,i)
                                         this.props.handleToggle("labelsE_s",this.state.activeCard,i)
                                    }
                                > 
                                {e.name} 
                                </button>
                        ))}
                        </div>
                        
                    </div>
                    
                </Card.Body>
            
            
                <Card.Body>

                    <SelectedElementDeck activeCard={this.state.activeCard} 
                    partitionHeadings={["Vertex", "Edge"]}
                        cardIds={this.state.cardIds} 
                        handleCardClick={this.handleCardClick}
                        elementIndexes={[this.props.selectedVertexLabels,this.props.selectedEdgeLabels]}
                        displayLookup={[this.props.vertexLabels, this.props.edgeLabels]}
                        
                    />
                
                 </Card.Body>
            
            </Card>

        );
    }
    
}

export {SelectLabelsComponent};
