import React from 'react';
import {Card} from 'react-bootstrap'

import {SelectedElementDeck} from './selectedElementDeck.js'

class SelectLabelsComponent extends React.Component{

    constructor(props){
        super(props);
//         this.state={
//            labelsToDisplay : (this.props.labelsUsed.getUsedLabelSum([...this.props.versionCardsO.getSelectedVersions()] ))
//         }
    }
    
    
//     handleCardClick=(cardId)=>{
//         this.props.handleClickVersionCard(cardId);
// 
//     }
    
    render(){
//          let toDisplay = this.props.labelsUsed.getUsedLabelSum([...this.props.versionCardsO.getSelectedVersions()] ),
//         console.log("THIS", this)
        return(
            <Card>
                <Card.Body>
                    <div className="card">
                        <Card.Header>Vertex Labels</Card.Header>
                        <div className=" card-body "> {
//                            console.log("lbls", this.props.versionCardsO.cards[this.props.versionCardsO.activeCard]),
//                             this.props.elementNames.labelsV.names.map((e,i)=>(
                            this.props.elementNames.labelsV.names.filter((e,i) => this.props.versionCardsO.cards[this.props.versionCardsO.activeCard].displayLabels.nodes.has(i) ).map((e,i)=>(
                            
                                <button  key={i}
                                    value={e.name} 
                                    name={i} 
                                    className={this.props.handleCheckToggle("labelsV_s",this.props.versionCardsO.activeCard, i) ? "active btn btn-outline-secondary m-1 btn-sm vName " : "btn btn-outline-secondary m-1 btn-sm vName"}
                                    onClick={(event) =>
//                                         this.props.toggleSelectVersion(this.state.activeCard,i)
                                            this.props.handleToggle("labelsV_s",this.props.versionCardsO.activeCard,i)
                                        
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

//                             this.props.elementNames.labelsE.names.map((e,i)=>(
                            this.props.elementNames.labelsV.names.filter((e,i) => this.props.versionCardsO.cards[this.props.versionCardsO.activeCard].displayLabels.edges.has(i) ).map((e,i)=>(
                                <button  key={i}
                                    value={e.name} 
                                    name={i} 
                                    className={this.props.handleCheckToggle("labelsE_s",this.props.versionCardsO.activeCard, i) ? "active btn btn-outline-secondary m-1 btn-sm vName " : "btn btn-outline-secondary m-1 btn-sm vName"}
                                    onClick={(event) =>
//                                         this.props.toggleSelectVersion(this.state.activeCard,i)
                                         this.props.handleToggle("labelsE_s",this.props.versionCardsO.activeCard,i)
                                    }
                                > 
                                {e.name} 
                                </button>
                        ))}
                        </div>
                        
                    </div>
                    
                </Card.Body>
            
            
                <Card.Body>

                    <SelectedElementDeck activeCard={this.props.versionCardsO.activeCard} 
                        displayKeys={["labelsV_s","labelsE_s"]}
                        versionCardsO={this.props.versionCardsO}
                        partitionHeadings={["Vertex", "Edge"]}
                        displayLookup={[this.props.elementNames.labelsV.names, this.props.elementNames.labelsE.names]}
               
                        versionCardHandlers = {this.props.versionCardHandlers}
                    />
                
                 </Card.Body>
            
            </Card>

        );
    }
    
}

export {SelectLabelsComponent};
