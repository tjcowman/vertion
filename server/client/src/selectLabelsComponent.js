import React from 'react';

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
            console.log(this.props),
//             {/*
            <SelectedElementDeck activeCard={this.state.activeCard} 
                cardIds={this.state.cardIds} 
                handleCardClick={this.handleCardClick}
                elementIndexes={this.props.selectedVertexLabels}
                displayLookup={this.props.vertexLabels}
                
            />
//             */}
        );
    }
    
}

export {SelectLabelsComponent};
