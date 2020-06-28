import React from 'react';
import {Button, Card, Row, Col, ListGroup, ListGroupItem, Input} from 'react-bootstrap'
import Cytoscape from 'cytoscape';
import CytoscapeComponent from 'react-cytoscapejs';
import {CytoscapeCustom} from './cytoscapeCustom.js';

import fcose from 'cytoscape-fcose';



class CytoscapeIntegration extends React.Component{
    constructor(props){
        super(props);


        this.state={
            fnElements: [],
        }
        
    }
    
    handleUnion=()=>{
//         this.cy.removeData();
        
        let elements = [...this.props.elements1, ...this.props.elements2];
        
        this.setState({fnElements: elements});
    }
    
    
    handleIntersection=()=>{
//         this.cy.removeData();
        let elementMap1 = new Map();
        let elementMap2 = new Map();
        
        this.props.elements1.forEach((e,i) => {
            if(e.data.hasOwnProperty('source')){
                elementMap1.set(e.data.source+'-'+e.data.target, i);
                
            }
            else
               elementMap1.set(String(e.data.id), i);
        })
        
        this.props.elements2.forEach((e,i) => {
            if(e.data.hasOwnProperty('source')){
                elementMap2.set(e.data.source+'-'+e.data.target, i);
                
            }
            else
               elementMap2.set(String(e.data.id), i);
        })
        
        
//         console.log("EMAPS", elementMap1, elementMap2)
        
        let result = [...elementMap1.entries()].filter((e) => elementMap2.has(e[0]))

        this.setState({fnElements : result.map(e => this.props.elements1[e[1]])});


    }
    
//     handleNodeClick=(event)=>{
//         console.log("E", event.target._private);
//     }
// 
//     componentDidMount = () => {
//         this.cy.on('click', 'node', this.handleNodeClick);
//     }

    
    render(){
//         console.log("SSSSS", [...this.state.colorMapEdges.entries()].map((key,val) => key))
      
        return(
        
            <Card>
            <Card.Body>
                <Button onClick={this.handleIntersection}>Intersection</Button>
                <Button onClick={this.handleUnion}>Union</Button>
            
                <div className="plotNav">
                <CytoscapeCustom className="border"  cy={(cy) => {this.cy = cy}} elements={this.state.fnElements} style={ { width: '600px', height: '400px', marginBottom:'10px' } }/>
                </div>
                
            </Card.Body>
            </Card>
          
           
        );
    }
}

export{CytoscapeIntegration}; 
