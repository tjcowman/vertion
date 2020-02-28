import React from 'react';

import {CardDeck, Card, ListGroup, ListGroupItem} from 'react-bootstrap'

import {SelectedElementDeck}  from './selectedElementDeck.js'


class SelectVersionsComponent extends React.Component{ 
    
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
            <div>
            
                <Card.Body>
                    <div className="card">
                        <Card.Header>Versions</Card.Header>
                        <div className=" card-body "> {
//                             console.log(this.props.getVersions()),
                            this.props.getVersions().versionNames.map((e,i)=>(
                            
                                <button  key={i}
                                value={e.name} 
                                name={i} 
                                className={this.props.isSelected(this.state.activeCard,i) ? "active btn btn-outline-secondary m-1 btn-sm vName " : "btn btn-outline-secondary m-1 btn-sm vName"}
                                onClick={(event) =>this.props.selectVersionToggle(this.state.activeCard,i)}> {e.name} 
                                </button>
                        ))}
                        </div>
                        
                    </div>
                    
                </Card.Body>
            
                <Card.Body>
                    <SelectedElementDeck activeCard={this.state.activeCard} 
                        cardIds={this.state.cardIds} 
                        handleCardClick={this.handleCardClick} 
                        elementIndexes={this.props.getSelectedVersions}
                        displayLookup={this.props.getVersions().versionNames}
                    />
                </Card.Body>
                

            </div>
            
           
        );
    }
}

export default SelectVersionsComponent;
//{this.state.names[e[1]]}
