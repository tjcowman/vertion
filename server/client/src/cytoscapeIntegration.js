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
    
    
    handleIntersection=()=>{
//         this.cy.startBatch();
        
//                  console.log(this.props.elements1, this.props.elements2)
        
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
        
//         console.log("RESULT", result);
//         console.log("E1",this.props.elements1)
        
//         console.log("TEST", result.map(e => this.props.elements1[e[1]]));
        
        this.setState({fnElements : result.map(e => this.props.elements1[e[1]])});
        
//         this.cy.add(result.map(e => this.props.elements1[e[1]]));
        
//         console.log("test",[...elementMap1.entries()])
        
//         console.log("res", result);
        
        //calculate intersection
//         console.log(this.props.elements1, this.props.elements2)
//         
//         let tmp1 = this.props.elements1.sort((lhs, rhs)=>{
// //             console.log(lhs.data)
//             if(lhs.data.hasOwnProperty('id'))
//             {
//                 return lhs.data.id < rhs.data.id;
//             }
//             else if(lhs.data.source !== rhs.data.source)
//             {
//                 return lhs.data.source < rhs.data.source;
//             }
//             else
//             {
//                 return lhs.data.target < rhs.data.target;
//             }
//         })
//         
//         console.log(tmp1);
//         
//         let n1 = this.props.elements1.slice() 
//         let e1 =
        
//         this.cy.add(this.props.elements1)
//         this.cy.add(this.props.elements2)
//         
//         let e1 = this.cy.elements('[origin = "elements1"]');
//         let e2 = this.cy.elements('[origin = "elements2"]');
//         
//         console.log(e1, e2, this.cy.add(e1.intersection(e2)))
//         
//         this.cy.remove(this.cy.elements());
//         this.cy.add(e1.intersection(e2));
//         
//         this.cy.endBatch();
        

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
            
                <CytoscapeCustom className="border"  cy={(cy) => {this.cy = cy}} elements={this.state.fnElements} style={ { width: '600px', height: '400px', marginBottom:'10px' } }/>
           
                
            </Card.Body>
            </Card>
          
           
        );
    }
}

export{CytoscapeIntegration}; 
