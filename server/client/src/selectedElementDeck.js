import React from 'react';

import {CardDeck, Card, ListGroup, ListGroupItem} from 'react-bootstrap'

import './selectedElementDeck.css'

const  SelectedElementDeck = (props) =>{
    
     return(

                
           <div className="border deckContainer">
                     
                {props.cardIds.map((e,i)=> (
                    
                    
                    
                        <div key={i} className= {props.activeCard===e ? "card cardC border-primary border-bold  " : "card cardC "} onClick={() => props.handleCardClick(e)}>
                        <Card.Header>Set {e}</Card.Header>
                        <Card.Body className="card-bodyC">

                            {props.partitionHeadings.map((partition,partI) =>(
                                <div key={partI}>
                                    <b>{partition}</b>
                                    <ListGroup>
                                    {
                                        [...props.elementIndexes[partI][e]].map((ee,ii)=> (
                                        <ListGroupItem  key={ii} className="itemC" > {props.displayLookup[partI][ee].name} </ListGroupItem>
                                    ))}
                                    </ListGroup>
                                </div>
                            ))}
                        
                        </Card.Body>
                        </div>
                        
                  
                    
                ))}
                
              
                <div className="card cardC cardBlank bg-light"
                    onClick={()=>props.handleClickAddVersionCard()}
                ></div>

                
                
                {/*props.showDiff ? 
                    <Card>
                        <Card.Header>Difference</Card.Header>
                        <Card.Body className="versionSelectCard">
                            <ListGroup>
                            {                                
                                getSelectedDifference().map((ee,ii)=> (
                                    <ListGroupItem  key={ii} className="itemC" >{props.displayLookup[ee.id].name}</ListGroupItem>
                                ))
                            }                                    
                            </ListGroup>
                        </Card.Body>
                    </Card>
                    
                    : ""
                */}
                    
                 </div>
           
        )
    
}
//     constructor(props){
//         super(props)
//         
//         let showDiff = false 
//     }
//     
//     
  const   getSelectedDifference=()=>{
        console.log([...this.props.elementIndexes(0)])
        let l1 = [...this.props.elementIndexes(0)].filter((e)=>(!this.props.elementIndexes(1).has(e)));
        let l2 = [...this.props.elementIndexes(1)].filter((e)=>(!this.props.elementIndexes(0).has(e)));
        let c = [];
        l1.forEach((e)=>{c.push({v:0, id:e})})
        l2.forEach((e)=>{c.push({v:1, id:e})})
        
        return c
    }
//     
//     render(){
//         return(
//              <CardDeck >
//                      
//                 {this.props.cardIds.map((e,i)=> (
//                     
//                     <div key={i} className= {this.props.activeCard===e ? "card border-primary border-bold " : "card "} onClick={() => this.props.handleCardClick(e)}>
//                     <Card.Header>Set {e}</Card.Header>
//                     <Card.Body className="versionSelectCard">
//                     
//                     {console.log("EI", this.props.elementIndexes)}
//                         <ListGroup>
//                         {
//                             [...this.props.elementIndexes[e]].map((ee,ii)=> (
//                             <ListGroupItem  key={ii} className="versionSelectItem">{this.props.displayLookup[ee].name}</ListGroupItem>
//                         ))}
//                         
//                         </ListGroup>
//                     
//                     
//                     </Card.Body>
//                     </div>
//                 ))}
//                     
//                     
//                 {this.props.showDiff ? 
//                     <Card>
//                         <Card.Header>Difference</Card.Header>
//                         <Card.Body className="versionSelectCard">
//                             <ListGroup>
//                             {                                
//                                 this.getSelectedDifference().map((ee,ii)=> (
//                                     <ListGroupItem  key={ii} className="versionSelectItem" >{this.props.displayLookup[ee.id].name}</ListGroupItem>
//                                 ))
//                             }                                    
//                             </ListGroup>
//                         </Card.Body>
//                     </Card>
//                     
//                     : ""
//                 }
//                     
//                  
//             </CardDeck>
//         );
//     }
// }

export{SelectedElementDeck};
