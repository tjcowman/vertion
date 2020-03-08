import React from 'react';


import {CardDeck, Card, ListGroup, ListGroupItem} from 'react-bootstrap'

import {SelectedElementDeck}  from './selectedElementDeck.js'


class SelectVersionsComponent extends React.Component{ 
    
    constructor(props){
        super(props);
        this.state={
        }
    }
    
    
    handleCardClick=(cardId)=>{
        this.props.handleClickVersionCard(cardId);
    }
         
         
    renderVersionNames(){
        return(
            <Card>
            <Card.Header>Versions</Card.Header>
                <Card.Body>
               
                    {[...this.props.versionTagDisplay].map((e,i)=>(
                        <div key={i}>
                        <div className="border versionDisplaySelect">
                            <b>{e[0]}</b>
                            <div>
                            {e[1].map((ee,ii) =>(
//                                    console.log(ee, ii),
                                    <button  key={ii}

                                     
                                        className={this.props.handleCheckToggle("versions_s",this.props.activeVersionCard,ee.index) ? "active btn btn-outline-secondary m-1 btn-sm vName " : "btn btn-outline-secondary m-1 btn-sm vName"}
                                        onClick={(event) =>
                                            this.props.handleToggle("versions_s", this.props.activeVersionCard, ee.index)
                                        }
                                    > 
                                    {ee.name} 
                                    </button>
                                
                            ))}
                            </div>
                            </div>
                        </div>
                    ))}
                
                </Card.Body>
            
            </Card>
        );
    }
         
    render(){
        return(
            <Card>
            <Card.Body>
                {this.renderVersionNames()}
            </Card.Body>
            
               
                <Card.Body>
               
                    <SelectedElementDeck activeCard={this.props.activeVersionCard}
                        versionCardsO={this.props.versionCardsO}
                        displayKeys={["versions_s"]}
                        partitionHeadings={[""]}
                        displayLookup={[this.props.versionData]}
                        
                        handleCardClick={this.handleCardClick} 
                        handleClickAddVersionCard={this.props.handleAddVersionCard}
                        handleClickRemoveVersionCard={this.props.handleRemoveVersionCard}
                    />
                </Card.Body>
                

            </Card>
            
           
        );
    }
}

export default SelectVersionsComponent;
//{this.state.names[e[1]]}
