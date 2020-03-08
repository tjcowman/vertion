import React from 'react';
import {CardDeck, Card, ListGroup, ListGroupItem} from 'react-bootstrap'

import {SelectedElementDeck} from './selectedElementDeck.js'

class SelectLabelsComponent extends React.Component{

    constructor(props){
        super(props);
        this.state={

        }
    }
    
    
    handleCardClick=(cardId)=>{
        this.props.handleClickVersionCard(cardId);

    }
    
    render(){
//         console.log("THIS", this)
        return(
            <Card>
                <Card.Body>
                    <div className="card">
                        <Card.Header>Vertex Labels</Card.Header>
                        <div className=" card-body "> {

                            this.props.elementNames.labelsV.names.map((e,i)=>(
                            
                                <button  key={i}
                                    value={e.name} 
                                    name={i} 
                                    className={this.props.handleCheckToggle("labelsV_s",this.props.activeVersionCard, i) ? "active btn btn-outline-secondary m-1 btn-sm vName " : "btn btn-outline-secondary m-1 btn-sm vName"}
                                    onClick={(event) =>
//                                         this.props.toggleSelectVersion(this.state.activeCard,i)
                                            this.props.handleToggle("labelsV_s",this.props.activeVersionCard,i)
                                        
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

                            this.props.elementNames.labelsE.names.map((e,i)=>(
                            
                                <button  key={i}
                                    value={e.name} 
                                    name={i} 
                                    className={this.props.handleCheckToggle("labelsE_s",this.props.activeVersionCard, i) ? "active btn btn-outline-secondary m-1 btn-sm vName " : "btn btn-outline-secondary m-1 btn-sm vName"}
                                    onClick={(event) =>
//                                         this.props.toggleSelectVersion(this.state.activeCard,i)
                                         this.props.handleToggle("labelsE_s",this.props.activeVersionCard,i)
                                    }
                                > 
                                {e.name} 
                                </button>
                        ))}
                        </div>
                        
                    </div>
                    
                </Card.Body>
            
            
                <Card.Body>

                    <SelectedElementDeck activeCard={this.props.activeVersionCard} 
                        displayKeys={["labelsV_s","labelsE_s"]}
                        versionCardsO={this.props.versionCardsO}
                        partitionHeadings={["Vertex", "Edge"]}
                        displayLookup={[this.props.elementNames.labelsV.names, this.props.elementNames.labelsE.names]}
               
                        handleCardClick={this.handleCardClick}
                        handleClickAddVersionCard={this.props.handleAddVersionCard}
                        handleClickRemoveVersionCard={this.props.handleRemoveVersionCard}
                    />
                
                 </Card.Body>
            
            </Card>

        );
    }
    
}

export {SelectLabelsComponent};
