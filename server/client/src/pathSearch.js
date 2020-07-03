import React from 'react';
import {Button, Card, Row, Col, Tab, Tabs} from 'react-bootstrap'

import {PathSearchQueryComponent} from './pathSearchQuery.js'
import {CytoscapeCustom} from './cytoscapeCustom.js'
import {CytoscapeIntegration} from './cytoscapeIntegration.js'


import './pathSearch.css'


import Cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';
Cytoscape.use( fcose );



class PathSearchComponent extends React.Component{
    constructor(props){
        super(props);

         this.state={
            elements1 : [],
            elements2 : [],
//             elementsqfn : []
        }
        
    }
    
    handleUpdateElements=(elements, stateName)=>{
     
        this.setState(prevState=>({
            [stateName]: elements
        }));
        
//         console.log("TEST",this.cy)
    }
    
    handleComputeIntegrationData=(dependentFunction)=>{
        let idMap = new Map();
        
        this.state.elements1.forEach(e => {
            idMap.set(String(e.data.id), 'l');
        });
        
        this.state.elements2.forEach(e => {
            if(idMap.has(String(e.data.id))){
                idMap.set(String(e.data.id), 'b');
            }else{
                idMap.set(String(e.data.id), 'r');
            }
        });
        console.log(idMap)

        this.setState(prevState=>({
            elements1 : this.state.elements1.map((e) => ({data:{...e.data, origin: idMap.get(String(e.data.id))}})),
            elements2 : this.state.elements2.map((e) => ({data:{...e.data, origin: idMap.get(String(e.data.id))}}))
        }), dependentFunction)
                   
//         let newElements = [...idMap.values()].map(e => ({data:{...e[0].data, origin: e[1]}} ));
    }

    render(){
        return(
            <Card.Body>
            <Tabs>
                <Tab eventKey="q1" title="Kinase 1">
                    <PathSearchQueryComponent 
                        backAddr={this.props.backAddr}
                        getVersionDefinition={this.props.getVersionDefinition}
                        handleNodeLookupIndex={this.props.handleNodeLookupIndex}
                        nodeData = {this.props.nodeData}
                        versionCardsO={this.props.versionCardsO}
                        handleLog={this.handleLog}
                        labelsUsed = {this.props.labelsUsed}
                        
                        elementsName="elements1"
                        elements={this.state.elements1}
                        handleUpdateElements={this.handleUpdateElements}
                    />
                </Tab>
                <Tab eventKey="q2" title="Kinase 2">
                    <PathSearchQueryComponent
                        backAddr={this.props.backAddr}
                        getVersionDefinition={this.props.getVersionDefinition}
                        handleNodeLookupIndex={this.props.handleNodeLookupIndex}
                        nodeData = {this.props.nodeData}
                        versionCardsO={this.props.versionCardsO}
                        handleLog={this.handleLog}
                        labelsUsed = {this.props.labelsUsed}
                        
                        elementsName="elements2"
                        elements={this.state.elements2}
                        handleUpdateElements={this.handleUpdateElements}
                    />
                </Tab>
                
                <Tab eventKey="qfn" title="Integration">
                   
                        <Card.Body>
                        <CytoscapeIntegration 
                            elements1={this.state.elements1} 
                            elements2={this.state.elements2}
                            handleComputeIntegrationData={this.handleComputeIntegrationData}
                        />
                        </Card.Body>
                </Tab>
                
            </Tabs>
            </Card.Body>
        );
        
    }
}

export {PathSearchComponent}
