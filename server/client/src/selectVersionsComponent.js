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
                            //this.props.getVersions().versionNames.map((e,i)=>(
                            this.props.versionData.map((e,i)=>(
//                             console.log("wut", e,i),
                                <button  key={i}
                                    value={e.name} 
                                    name={i} 
                                    className={this.props.handleCheckToggle("versions_s",this.state.activeCard,i) ? "active btn btn-outline-secondary m-1 btn-sm vName " : "btn btn-outline-secondary m-1 btn-sm vName"}
                                    onClick={(event) =>
//                                         this.props.toggleSelectVersion(this.state.activeCard,i)
                                        this.props.handleToggle("versions_s", this.state.activeCard, i)
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
                        cardIds={this.state.cardIds} 
                        partitionHeadings={[""]}
                        handleCardClick={this.handleCardClick} 
                        elementIndexes={[this.props.selectedVersions]}
                        displayLookup={[this.props.versionData]}
                    />
                </Card.Body>
                

            </div>
            
           
        );
    }
}

export default SelectVersionsComponent;
//{this.state.names[e[1]]}
