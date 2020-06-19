import React from 'react';
import {Button, Card, Row, Col, Tab, Tabs} from 'react-bootstrap'

import {PathSearchQueryComponent} from './pathSearchQuery.js'

import './pathSearch.css'

import Cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';
Cytoscape.use( fcose );



class PathSearchComponent extends React.Component{
    constructor(props){
        super(props);

         this.state={
            elements1 : [],
            elements2 : []
        }
        
    }
    
    handleUpdateElements=(elements, stateName)=>{
     
        this.setState({[stateName]: elements});
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
                        
                        elements={this.state.elements1}
                        handleUpdateElements={this.handleUpdateElements}
                    />
                </Tab>
                
            </Tabs>
            </Card.Body>
        );
        
    }
}

export {PathSearchComponent}
