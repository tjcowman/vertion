import React from 'react';

import {CardDeck, Card, ListGroup, ListGroupItem} from 'react-bootstrap'

import './selectedElementDeck.css'

const  SelectedElementDeck = (props) =>{
    
     return(

                
           <div className="border deckContainer">
            {console.log("VSLD", props.versionCardsO)}   
                  {console.log("VSLD", props.versionCardsO.cards)}   
                  
                {props.versionCardsO.cards.map((cardO,cardI)=> (
                    
                    
                    
                        <div key={cardI} className= {props.activeCard===cardI ? "card cardC border-primary border-bold  " : "card cardC "} onClick={() => props.handleCardClick(cardI)}>
                        <Card.Header>Set {cardI}</Card.Header>
                        <Card.Body className="card-bodyC">

                            {props.displayKeys.map((dKey,partI) =>(
                                <div key={partI}>
                                    <ListGroupItem className="itemHead " >{props.partitionHeadings[partI]}</ListGroupItem>
                                    <ListGroup>
                                    {
                                        [...props.versionCardsO.cards[cardI][dKey]].map((ee,ii)=> (
                                   
                                            
                                            <ListGroupItem  key={ii} className="itemC" > {props.displayLookup[partI][ee].name} </ListGroupItem>
                                    ))}
                                    </ListGroup>
                                </div>
                            ))}
                        
                        </Card.Body>
                        </div>
                        
                  
                    
                ))}
                
              
                <div className="card cardC  cardBlank bg-light">
                    <div className="cardBlankAdd btn border" onClick={()=>props.handleClickAddVersionCard()}>
                        
                    </div>
                    
                    <div className="cardBlankRemove btn border" onClick={()=>props.handleClickRemoveVersionCard()}>
                        
                    </div>
                
                
                </div>


            </div>
           
        )
    
}
export{SelectedElementDeck};
