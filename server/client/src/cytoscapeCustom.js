import React from 'react';
import {Button, Card, Row, Col} from 'react-bootstrap'
import Cytoscape from 'cytoscape';
import CytoscapeComponent from 'react-cytoscapejs';

import fcose from 'cytoscape-fcose';

let stylesheet = [

    {
        selector: 'edge',
        style: {
            'line-color' : 'mapData(labelType, 0, 8, red, blue)'
        }
    },
    {
        selector: 'node',
        style: {
            'label': 'data(label)'
        }
    }
]

class CytoscapeCustom extends React.Component{
    constructor(props){
        super(props);

        this.state={

        }
        
    }
    
    componentDidUpdate(prevProps){
        if(this.props.elements.length > 0 ) //make sure elements actually exist
             this.cy.layout({name:'fcose'}).run();
    }
    
    componentDidMount = () => {
        this.cy.on('click', 'node', this.props.handleNodeClick);
    }
    

    render(){
        console.log("lll", this)
      
        return(
            <>
           <CytoscapeComponent className="border"  cy={(cy) => {this.cy = cy}} elements={this.props.elements} stylesheet={ stylesheet } style={ { width: '400px', height: '400px' } }/>

           </>
           
        );
    }
}

export{CytoscapeCustom};
