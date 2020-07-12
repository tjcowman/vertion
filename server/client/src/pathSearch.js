import React from 'react';
import {Button, Card, Row, Col, Tab, Tabs} from 'react-bootstrap'

import {PathQueryComponent,  CutoffManagerComponent, ResultDisplay} from './pathSearchQuery.js'
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
             
//             response : {trees: [[]]}, // {kinase: #, tree: []}
            trees: new Map(), 
            
            siteData: new Map(),
            
            displayElements: [],
        }
        
    }
    
    componentDidUpdate(prevProps, prevState){
        if(prevState.minPathScore != this.state.minPathScore){
            
            this.setState({
                displayElements: [...this.updateNodes(), ...this.updateEdges()]
            });
        }
    }
    
    filterNodeScore(treeIndex){
//         if(response.trees.length<treeIndex)
//             console.log()
        
        return this.getTree(treeIndex).filter(path => path.nodeScore >this.state.minPathScore);
    }
    
    
    getTree(kinaseIndex){
        if(this.state.trees.has(kinaseIndex))
            return this.state.trees.get(kinaseIndex);
        else
            return [];
    }
    
    updateNodes=()=>{
        //Get the unique nodeIds used
        let nodeIds = new Set();        
        this.filterNodeScore(0).slice(0,this.state.topk).forEach((p)=>(
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

        this.filterNodeScore(0).slice(0,this.state.topk).forEach((path)=>{
            for(let i=0; i<path.nodes.length-1; ++i ){
                edges.push({
                    data:{
                        id: path.nodes[i] + '-' + path.nodes[i+1],
                        source: path.nodes[i], 
                        target: path.nodes[i+1], 
                        edgeType: this.props.labelsUsed.nameLookupEdge(path.edgeLabels[i]).toString() 
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
    getResponse=(responseTrees)=>{
        
        //Update the responseTrees with the current state IMPORTANT: doesnt change the state
        this.state.trees.forEach(t=> {
            
            if(!responseTrees.has(t[0]))
                responseTrees.set(t[0], t[1]);
            
        })
        
         console.log(responseTrees)
        let nodeIndexes = [...responseTrees.values()].map(tree=>tree.map(path => path.nodes)).flat(3);
        
        let siteData =  new Map();
        
        //Computes some data for the node Indexes corresponding to terminal sites
        let maxScore =  Math.max([...responseTrees.values()].map(tree=>tree.map(path => path.nodeScore).flat()));
        let targetMax = 100;
        
        [...responseTrees.values()].forEach(tree => tree.forEach(path =>{
            siteData.set(path.nodes[0], {
                direction: path.direction, 
                scoreNorm: path.nodeScore*(targetMax/maxScore) 
            });
        }));
        
        
//        
        
//         console.log(response);
//         this.setState((prevState)=>({trees: new Map([...prevState.trees, ...response]) }),);
        
//         console.log(response);
//         
// //         response = {this.state.response}
//         
//         let siteData =  new Map();
//         
//         //Computes some data for the node Indexes corresponding to terminal sites
//         let maxScore =  Math.max(...response.trees.map(tree=>tree.map(path => path.nodeScore).flat()));
//         let targetMax = 100;
//         
//         response.trees.forEach(tree => tree.forEach(path =>{
//             siteData.set(path.nodes[0], {
//                 direction: path.direction, 
//                 scoreNorm: path.nodeScore*(targetMax/maxScore) 
//             });
//         }));
//         let nodeIndexes = response.trees.map(tree=>tree.map(path => path.nodes)).flat(3);
// //         console.log(response.trees, nodeIndexes)
//         this.props.handleNodeLookupIndex(nodeIndexes,
//             ()=>{this.setState({response: response, siteData: siteData})}
//         );
        
        this.props.handleNodeLookupIndex(nodeIndexes,
            ()=>{this.setState({trees: responseTrees, siteData: siteData})}
        );
    }
    
    //Only needs to use the first treeIndex as the site sets are shared
    derivePathPlotScores=()=>{
        let terminalScores = { sparseFactor : 1, scores: this.getTree(0).map((p,i) => (p.nodeScore) ).sort()};
            //sparsify the scores for plotting later
        if(terminalScores.scores.length > 199){
            let sparseFactor = Math.floor(terminalScores.scores.length/100);
                
            terminalScores = { sparseFactor : sparseFactor, scores: terminalScores.scores.filter((e, i) => {return i % sparseFactor === 0})};
        }
        return terminalScores;
    }
    
//     handleUpdateElements=(elements, stateName)=>{
//      
//         this.setState(prevState=>({
//             [stateName]: elements
//         }));
//     }
//     
//     handleComputeIntegrationData=(dependentFunction)=>{
//         let idMap = new Map();
//         
//         this.state.elements1.forEach(e => {
//             idMap.set(String(e.data.id), 'l');
//         });
//         
//         this.state.elements2.forEach(e => {
//             if(idMap.has(String(e.data.id))){
//                 idMap.set(String(e.data.id), 'b');
//             }else{
//                 idMap.set(String(e.data.id), 'r');
//             }
//         });
//         console.log(idMap)
// 
//         this.setState(prevState=>({
//             elements1 : this.state.elements1.map((e) => ({data:{...e.data, origin: idMap.get(String(e.data.id))}})),
//             elements2 : this.state.elements2.map((e) => ({data:{...e.data, origin: idMap.get(String(e.data.id))}}))
//         }), dependentFunction)
//                    
//     }

    render(){
        {console.log("PS QUERYST", this.state)}
        return(
            <Card.Body style={{whiteSpace:'nowrap'}}>
                <div style={{margin:'10px'}}>
                <PathQueryComponent 
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
