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
             
            trees: new Map(), 
            sourceIds : [],
            
            
            siteData: new Map(),
            
            displayElements: [],
        }
        
    }
    
    //gets the ids of the input kinases
    getPathSourceIds(){
        
        return(this.state.sourceIds);
        
        //return(trees)
    }
    
    componentDidUpdate(prevProps, prevState){
         if(prevState.minPathScore !== this.state.minPathScore || prevState.trees !== this.state.trees){

            this.setState({
                displayElements: this.updateElements()
            });
        }
    }
    
    computeUniqueNodes(treeIndex){
//         console.log(this.getTree(treeIndex))
        return new Set(this.filterNodeScore([treeIndex]).map(path=>path.nodes).flat(2).map(i=>String(i)));
//         return 1;
    }
    computeUniqueEdges(treeIndex){
        let ids=[];
        this.filterNodeScore([treeIndex]).forEach((path)=>{
            for(let i=0; i<path.nodes.length-1; ++i ){
                ids.push(
                    path.nodes[i] + '-' + path.nodes[i+1], 
                );
            }
        })
        
        return new Set(ids);
    }
    
    computeElementIds(treeIndex){
        let ids = new Set([...this.computeUniqueNodes(treeIndex), ...this.computeUniqueEdges(treeIndex)]);
        return ids;
    }
    
    //Returns the paths from the chosen trees
    filterNodeScore(treeIndexes){
        //Define the sort order for paths
            const pathOrder = (l,r)=>{
                return l.totalWeight - r.totalWeight;
            }
        
        //gets the pathas in each tree that surpass the selection
        let bigE = treeIndexes.map(i => this.getTree(i).filter(path => path.nodeScore >= this.state.minPathScore) );
        let topk = bigE.map(tree =>
            tree.slice().sort(pathOrder).slice(0, this.state.topk)
        )
        return topk.flat()
    }
    
    
    getTree(kinaseIndex){
        if(this.state.trees.has(kinaseIndex))
            return this.state.trees.get(kinaseIndex);
        else
            return [];
    }
    
    //Computes the overlapping node and edge elements then formats the elements for display
    updateElements=()=>{
        let idK1 = this.computeElementIds(0);
        let idK2 = this.computeElementIds(1);
        
        let idMap = new Map();
        
        idK1.forEach(e => {
            idMap.set(e, 'l');
        });
        
        idK2.forEach(e => {
            if(idMap.has(e)){
                idMap.set(e, 'b');
            }else{
                idMap.set(e, 'r');
            }
        });
        return  [...this.updateNodes(idMap), ...this.updateEdges(idMap)];
    }
    
    updateNodes=(integrationData)=>{
        //Get the unique nodeIds used
        let nodeIds = new Set();        
        this.filterNodeScore([0,1]).forEach((p)=>(
            p.nodes.forEach(id => nodeIds.add(id))
        ))
        
        
//         console.log(sourceIds);
        
        let nodes =  [...nodeIds].map(id =>({
              data: {
                id: id,
                nodeType: this.props.labelsUsed.nameLookupNode(this.props.nodeData.getEntry(id).labels).toString(), 
                label:  this.props.nodeData.getEntry(id).name, 
                pLabel: this.props.nodeData.getEntry(id).pname === "" ? undefined : this.props.nodeData.getEntry(id).pname,
                origin: integrationData.get(String(id)),
              }
            })
        );
        
        //For the terminal nodes update their values
        let sourceIds = new Set(this.getPathSourceIds());
        console.log(sourceIds)
        nodes.forEach(n =>{
            let lookup = this.state.siteData.get(String(n.data.id));
            if(typeof(lookup) !== 'undefined'){
                n.pathTerm = 1;
                n.data.scoreNorm = lookup.scoreNorm;
                n.data.direction = lookup.direction;
            }
            
//             console.log(n.data.id)
            if(sourceIds.has(String(n.data.id))){
                n.data.queryClass = "sourceKinase";
            }
            
            //Strip the protein uniprot from the sites
            if(n.data.nodeType === "Site"){
                n.data.label = n.data.label.substring(n.data.label.search(':')+1 );
            }
            
        });
        
        return nodes;
    }
    
    updateEdges=(integrationData)=>{
        let edges = [];

        this.filterNodeScore([0,1]).forEach((path)=>{
            for(let i=0; i<path.nodes.length-1; ++i ){
                edges.push({
                    data:{
                        id: path.nodes[i] + '-' + path.nodes[i+1],
                        source: path.nodes[i], 
                        target: path.nodes[i+1], 
                        edgeType: this.props.labelsUsed.nameLookupEdge(path.edgeLabels[i]).toString(), 
                         origin: integrationData.get(String(path.nodes[i] + '-' + path.nodes[i+1])),
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
       this.state.trees.forEach((k,v) => {
           console.log("E",k,v)
            if(!responseTrees.has(v) )
                responseTrees.set(v, k);
            
        })

        let nodeIndexes = [...responseTrees.values()].map(tree=>tree.map(path => path.nodes)).flat(3);
        
        let siteData =  new Map();
        
        //Computes some data for the node Indexes corresponding to terminal sites
        let maxScore =  Math.max(...[...responseTrees.values()].map(tree=>tree.map(path => path.nodeScore)).flat());
        let targetMax = 100;
        
        let sourceIds = [];
        
        [...responseTrees.values()].forEach(tree => {
            //Extract the valid source node ids
            if(tree.length>0)
                sourceIds.push(String(tree[0].nodes[tree[0].nodes.length-1]));
            
            tree.forEach(path =>{
                siteData.set(String(path.nodes[0]), {
                    direction: path.direction, 
                    scoreNorm: path.nodeScore*(targetMax/maxScore) 
                });
            });
        });
        
        this.props.handleNodeLookupIndex(nodeIndexes,
            ()=>{this.setState({trees: responseTrees, siteData: siteData, sourceIds: sourceIds})}
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
