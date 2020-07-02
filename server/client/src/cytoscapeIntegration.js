import React from 'react';
import {Button, Card, Row, Col, ListGroup, ListGroupItem, Input} from 'react-bootstrap'
import Cytoscape from 'cytoscape';
import CytoscapeComponent from 'react-cytoscapejs';
import {CytoscapeCustom} from './cytoscapeCustom.js';

import * as cstyle from './cytoStyles.js'
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
        
        let idMap = new Map();
        
        this.props.elements1.forEach(e => {
            idMap.set(e.data.id, e);
            idMap.get(e.data.id).data.origin = 'l';
        });
        
        this.props.elements2.forEach(e => {
            if(idMap.has(e.data.id)){
                idMap.get(e.data.id).data.origin = 'b';
            }else{
                idMap.set(e.data.id, e);
                idMap.get(e.data.id).data.origin = 'r';
            }
        });
        console.log(idMap)
/*        let elements = [...this.props.elements1.map(e => [0,e]),
                        ...this.props.elements2.map(e => [1,e])];
        
        elements.sort((l,r) => l[1].data.id.localeCompare(r[1].data.id));
        
        for(let i=0; i< elements.length; ++i){
            if(elements[i][1].data.id === elements[i+1][1].data.id){
                fnElements.add()
            }
                
        }
               */         
//         console.log("f",idMap.values())
                        
        this.setState({fnElements: [...idMap.values()]});
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
    
    handleNodeClick=(event)=>{
        console.log("E", event.target._private.data);
    }
    handleEdgeClick=(event)=>{
        console.log("E", event.target._private.data);
    }
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
                <CytoscapeCustom className="border"  cy={(cy) => {this.cy = cy}} 
                    elements={this.state.fnElements} 
                    style={ { width: '600px', height: '400px', marginBottom:'10px' } }
                    cstyle={{colors: {...cstyle.colors, union :cstyle.color_union} , labels: cstyle.labels, sizes :cstyle.sizes}}
                    handleNodeClick={this.handleNodeClick} 
                    handleEdgeClick={this.handleEdgeClick}
                />
                </div>
                
            </Card.Body>
            </Card>
          
           
        );
    }
}

export{CytoscapeIntegration}; 
