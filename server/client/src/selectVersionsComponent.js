import React from 'react';

import {Button, ButtonGroup, CardGroup, CardDeck, Card} from 'react-bootstrap'

class SelectVersionsComponent extends React.Component{ 
    
    constructor(props){
        super(props);
        this.state={
            activeCard :0
        }
    }
    
    
    handleCardClick = (cardId) => {
        this.setState({activeCard: cardId});
        console.log(this.state.activeCard)
    }
    
    render(){
        return(
            <div>
     
            
                
                
                    <CardDeck className= "m-2">
                    <div className= {this.state.activeCard==0 ? "card border-primary border-bold" : "card"} onClick={() => this.handleCardClick(0)}>
                         <Card.Header>Set 0</Card.Header>
                         <Card.Body>
                        temp1
                        </Card.Body>
                    </div>
                    <div className={this.state.activeCard==1 ? "card border-primary border-bold" : "card"} onClick={() => this.handleCardClick(1)}>
                        <Card.Header>Set 1</Card.Header>
                        <Card.Body>
                        temp2
                         </Card.Body>
                    </div>
                    <div className={this.state.activeCard==2 ? "card border-primary border-bold" : "card"} onClick={() => this.handleCardClick(2)}>
                        <Card.Header>Set 2</Card.Header>
                        <Card.Body>
                        temp2
                         </Card.Body>
                    </div>
                    </CardDeck>
                      
                      
                    <div className="card m-2">
                        <Card.Header>Versions</Card.Header>
                        <div className=" card-body "> {
//                             console.log(this.props.getVersions()),
                            this.props.getVersions().versionNames.map((e,i)=>(
                            
                                <button  key={i}
                                value={e.name} 
                                name={i} 
                                className={this.props.isSelected(0,i) ? "active btn btn-outline-secondary m-1 btn-sm vName " : "btn btn-outline-secondary m-1 btn-sm vName"}
                                onClick={(event) =>this.props.selectVersionToggle(0,i)}> {e.name} 
                                </button>
                        ))}
                        </div>
                    </div>
                    
                    
                </div>
            
           
        );
    }
}

export default SelectVersionsComponent;
//{this.state.names[e[1]]}
