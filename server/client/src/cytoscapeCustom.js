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
           'label': 'data(label)',
      }
      
    },
    {
        selector: 'node[normScore]',
        style: {
            'width' : 'data(normScore)',
            'height' : 'data(normScore)',
            }
        
    },
    {
        selector: "node[scored = 0 ]",
            style: {
                'background-color' : 'white',
                'border-color' : 'black',
                'border-width' : '2'
            }
    },
    {
        selector: "node[scored = 1 ]",
            style: {
                'background-color' : 'blue',
                'border-color' : 'black',
                'border-width' : '2'
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
        if(this.props.elements.length > 0  && this.props.elements !== prevProps.elements){ //make sure elements actually exist
             this.cy.layout({name:'fcose'}).run();
             console.log("lll", this.cy._private)
        }
    }
    
    componentDidMount = () => {
        this.cy.on('click', 'node', this.props.handleNodeClick);
    }
    

    render(){
        
      
        return(
            <>
           <CytoscapeComponent className="border"  cy={(cy) => {this.cy = cy}} elements={this.props.elements} stylesheet={ stylesheet } style={ { width: '400px', height: '400px' } }/>

           </>
           
        );
    }
}

export{CytoscapeCustom};
