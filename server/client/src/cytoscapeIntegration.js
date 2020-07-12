import React from 'react';
import {Button, Card, Row, Col, ListGroup, ListGroupItem, Input} from 'react-bootstrap'
import Cytoscape from 'cytoscape';
import CytoscapeComponent from 'react-cytoscapejs';
import {CytoscapeCustom} from './cytoscapeCustom.js';

import * as cstyle from './cytoStyles.js'
import fcose from 'cytoscape-fcose';

import './cytoscapeIntegration.css'

class CytoscapeIntegration extends React.Component{
    constructor(props){
        super(props);


        this.state={
            staleElements : true,
            fnElements: [],
        }
        
    }
    
    componentDidUpdate(prevProps, prevState){
        console.log(this.state.staleElements)
        if(prevProps.elements1 !== this.props.elements1 || prevProps.elements2 !== this.props.elements2)
            this.setState({staleElements : true});
    }
    
    //Computes the integration data then after the element props have been update, sets its own state then sets the staleElements to false
    handleUnion=()=>{
        if(this.state.staleElements){
            this.props.handleComputeIntegrationData(()=>{
                this.setState({fnElements : [
                    ...this.props.elements1.filter(e => e.data.origin === 'b' || e.data.origin === 'l'),
                    ...this.props.elements2.filter(e => e.data.origin === 'r')
                ]}, () => this.setState({staleElements : false}))
            });
        }else{
             this.setState({fnElements : [
                    ...this.props.elements1.filter(e => e.data.origin === 'b' || e.data.origin === 'l'),
                    ...this.props.elements2.filter(e => e.data.origin === 'r')
                ]})
        }
    }
    
    
    handleIntersection=()=>{
        if(this.state.staleElements){
            this.props.handleComputeIntegrationData(()=>
                
                this.setState({fnElements : [
                    ...this.props.elements1.filter(e => e.data.origin === 'b'),
                ]}, () => this.setState({staleElements : false}))
            );
            
           
        }else{
                this.setState({fnElements : [
                    ...this.props.elements1.filter(e => e.data.origin === 'b'),
                ]})
        }

    }

    
    render(){
//         console.log("SSSSS", [...this.state.colorMapEdges.entries()].map((key,val) => key))
      
        return(
        
        <>
                <div style={{whiteSpace: 'nowrap'}}>
                
                    <Card style={{display:'inline-block', margin:'5px', width:'200px'}}>
                        <Card.Body>
                            <div><Button className="integrationButton" onClick={this.handleIntersection}>Intersection</Button></div>
                            <div><Button className="integrationButton" onClick={this.handleUnion}>Union</Button></div>
                        </Card.Body>
                    </Card>
                
                    <div className="plotNav" style={{display:'inline-block', margin:'5px'}}>
                        <CytoscapeCustom className="border"  cy={(cy) => {this.cy = cy}} 
                            elements={this.state.fnElements} 
                            style={ { width: '600px', height: '400px', marginBottom:'10px' } }
                            cstyle={{colors: {...cstyle.colors, integration :cstyle.color_integration} , labels: cstyle.labels, sizes :cstyle.sizes}}
                            handleNodeClick={this.handleNodeClick} 
                            handleEdgeClick={this.handleEdgeClick}
                        />
                    </div>
                </div>
        </>
          
           
        );
    }
}

export{CytoscapeIntegration}; 
