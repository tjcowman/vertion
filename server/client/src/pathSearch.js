import React from 'react';
import {Button, Card, Row, Col, Tab, Tabs} from 'react-bootstrap'

import {PathSearchQueryComponent, PathQueryComponent2, CutoffManagerComponent, ResultDisplay} from './pathSearchQuery.js'
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
            topk: 10,
            minPathScore: 0,
             
            response : {mainTree: []},
            siteData: new Map(),
            
            displayElements: [],
        }
        
    }
    
    componentDidUpdate(prevProps, prevState){
        if(prevState.minPathScore != this.state.minPathScore){
            
            this.setState({
                displayElements: [...this.updateNodes()]
            });
//             console.log(this.updateNodes());   
        }
        
    }
    
    filterNodeScore(){
        return this.state.response.mainTree.filter(path => path.nodeScore >this.state.minPathScore);
    }
    
    updateNodes=()=>{
        //Get the unique nodeIds used
        let nodeIds = new Set();        
        this.filterNodeScore().slice(0,this.state.topk).forEach((p)=>(
            p.nodes.forEach(id => nodeIds.add(id))
        ))
        
        let nodes =  [...nodeIds].map(id =>({
              data: {
                id: id,
                nodeType: this.props.labelsUsed.nameLookupNode(this.props.nodeData.getEntry(id).labels).toString(), 
                label:  this.props.nodeData.getEntry(id).name, 
                pLabel: this.props.nodeData.getEntry(id).pname === "" ? undefined : this.props.nodeData.getEntry(id).pname,
              }
            })
        );
        
        //For the terminal nodes update their values
        nodes.forEach(n =>{
            let lookup = this.state.siteData.get(n.data.id);
            if(typeof(lookup) !== 'undefined'){
                n.pathTerm = 1;
                n.data.scoreNorm = lookup.scoreNorm;
                n.data.direction = lookup.direction;
            }

            if(n.data.nodeType === "Site"){
                n.data.label = n.data.label.substring(n.data.label.search(':')+1 );
            }
            
        });
        
        return nodes;
    }
    
    updateEdges=()=>{
        let edges = [];

        this.state.pathsPassing.map((arrI) => (this.state.pathTreeResponse[arrI])).slice(0,this.state.topk).forEach((p)=>{
            for(let i=0; i<p.nodes.length-1; ++i ){
                edges.push({
                    data:{
                        id: p.nodes[i] + '-' + p.nodes[i+1],
                        source: p.nodes[i], 
                        target: p.nodes[i+1], 
                        edgeType: this.props.labelsUsed.nameLookupEdge(p.edgeLabels[i]).toString() 
                    }
                    
                });
            }
        })
        let uniqueIndexes = new Map(edges.map((e,i) => [e.data.id, i]));
        
        return [...uniqueIndexes.values()].map(i => edges[i]);
    }
    
    
    handleSetState=(event)=>{
        let name = event.target.name;
        let value= Number(event.target.value);

        this.setState({
            [name]: value,
        })
 
    }
    
    //Gets the response data and ensures the nodeIndexes have been looked up before proceeding
    getResponse=(response)=>{
        
        let siteData =  new Map();
        
        //Computes some data for the node Indexes corresponding to terminal sites
        let maxScore =  Math.max(...response.mainTree.map(path => path.nodeScore));
        let targetMax = 100;
        
        response.mainTree.forEach(path =>{
            siteData.set(path.nodes[0], {
                direction: path.direction, 
                scoreNorm: path.nodeScore*(targetMax/maxScore) 
            });
        });
        
        this.props.handleNodeLookupIndex(response.mainTree.map((path) => path.nodes).flat(),
            ()=>{this.setState({response: response, siteData: siteData})}
        )
    }
    
    
    derivePathPlotScores=()=>{
        let terminalScores = { sparseFactor : 1, scores: this.state.response.mainTree.map((p,i) => (p.nodeScore) ).sort()};
            //sparsify the scores for plotting later
        if(terminalScores.scores.length > 199){
            let sparseFactor = Math.floor(terminalScores.scores.length/100);
                
            terminalScores = { sparseFactor : sparseFactor, scores: terminalScores.scores.filter((e, i) => {return i % sparseFactor === 0})};
        }
        return terminalScores;
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

    render2(){
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
    
    render(){
        {console.log("PS QUERYST", this.state)}
        return(
            <Card.Body style={{whiteSpace:'nowrap'}}>
                <div style={{margin:'10px'}}>
                <PathQueryComponent2 
                    backAddr={this.props.backAddr}
                    versionCards={this.props.versionCardsO}
                    getVersionDefinition={this.props.getVersionDefinition}
                    
                    getResponse={this.getResponse}
                />
                </div>
                
                <div style={{display:'inline-block', margin:'10px'}}>
                    <CutoffManagerComponent
                        terminalScores={this.derivePathPlotScores()}
                        handleSetState={this.handleSetState}
                        topk={this.state.topk}
                        minPathScore={this.minPathScore}
                    />
                 </div>
                
                 <div style={{display:'inline-block', verticalAlign:'top', margin:'10px'}}>
                    <ResultDisplay
                        displayElements={this.state.displayElements}
                    />
                </div>
                
            </Card.Body>
        );
    }
}

export {PathSearchComponent}
