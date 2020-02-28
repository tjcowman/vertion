import React from 'react';

import {SelectedElementDeck} from './selectedElementDeck.js'

class SelectLabelsComponent extends React.Component{

    constructor(props){
        super(props)
        this.state={
            activeCard :0,
            cardIds: [0,1],

        }
    }
    
    render(){
        return(
            {/*
            <SelectedElementDeck activeCard={this.state.activeCard} 
                cardIds={this.state.cardIds} 
                handleCardClick={this.handleCardClick}
                elementIndexes={this.props.vertexLabels}
                displayLookup={this.props.selectedVertexLabels}
                
            /> */}
        );
    }
    
}

export {SelectLabelsComponent};
