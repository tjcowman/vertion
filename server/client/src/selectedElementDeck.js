import React, {useState} from 'react';

import {Card, ListGroup, ListGroupItem} from 'react-bootstrap'

import './selectedElementDeck.css'




const  SelectedElementDeck = (props) =>{
    
    const [renameVisible, toggle] = useState(null);
    
//     {console.log("RN",renameVisible, props.versionCardsO.cards)}
   
    const handleRename=(event, cardI)=>{
        
        event.preventDefault();
//         console.log(event.target[0].value);
        props.handleChangeVersionCardName(cardI, event.target[0].value);
        toggle(null);
    }
    
    
     return(
         
                
           <div className="border deckContainer"> 
                  
                {props.versionCardsO.cards.map((cardO,cardI)=> (
                    
                    
                    
                        <div key={cardI} className= {props.activeCard===cardI ? "card cardC border-primary border-bold  " : "card cardC "} onClick={() => props.versionCardHandlers.click(cardI)}>
                        <Card.Header style={{height:'50px'}}>
                            <div style={{position:'relative'}}>
                                <form onSubmit={ (event) =>handleRename(event, cardI) } > 
                                    <input autoComplete="off"  type="text"  onClick={()=>toggle(cardI)} onBlur={()=>toggle(null)} style={renameVisible === cardI ? {} : {opacity:'0'}} className="renameInput"></input>
                                </form>
                                <div   className="nameText">{cardO.name}</div>
                            </div>
                        </Card.Header>
                        
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
                    <div className="cardBlankAdd btn border" onClick={()=>props.versionCardHandlers.add()}>
                        
                    </div>
                    
                    <div className="cardBlankRemove btn border" onClick={()=>props.versionCardHandlers.remove()}>
                        
                    </div>
                
                
                </div>


            </div>
           
        )
    
}
export{SelectedElementDeck};
