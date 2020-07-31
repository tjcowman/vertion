import React from 'react';
import Axios from 'axios';
import {Button, Card, Row, Col, Tab, Tabs} from 'react-bootstrap'

import {PathQueryComponent,  CutoffManagerComponent, ResultDisplay, PathStats} from './pathSearchQuery.js'
import {CytoscapeCustom} from './cytoscapeCustom.js'
import {CytoscapeIntegration} from './cytoscapeIntegration.js'

import * as setLib from './setLib.js'

import './pathSearch.css'

import * as cstyle from './cytoStyles.js'

import './cytoscapeCustom.css'

import Cytoscape from 'cytoscape';
import CytoscapeComponent from 'react-cytoscapejs';
import fcose from 'cytoscape-fcose';

Cytoscape.use( fcose );



class PathSearchComponent extends React.Component{
    constructor(props){
        super(props);

         this.state={
            topk: 10,
            kAvailable: 0,
            kDisplayed: 0,
            minPathScore: 0,
             
            showPopout: false,
            trees: new Map(), 
            sourceIds : [],
//             pathLengthByCutoff : [[]],
            
            selectedVersionIndex: "T",
//             selectedVersionDefinition: this.props.versionCardsO.getVersionDefinition("T"), //Temp value fo testing normally []
            siteData: new Map(),
            
            
            nodeIds: new Set(),
            edgeIds: new Set(),
            displayElements: [],
            displayDenseElements: [],
        }
        
    }
    
    //gets the ids of the input kinases
    getPathSourceIds(){
        
        return(this.state.sourceIds);
        
        //return(trees)
    }
    
    componentDidUpdate(prevProps, prevState){
        

        if(
            prevState.minPathScore !== this.state.minPathScore || 
            prevState.trees !== this.state.trees || 
            prevState.kDisplayed !== this.state.kDisplayed
           // (prevState.topk !== this.state.topk && this.state.topk <= this.state.kAvailable)
        ){

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
        
        //gets the paths in each tree that surpass the selection
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
        this.setState({nodeIds: nodeIds});
        
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
//         console.log(sourceIds)
        nodes.forEach(n =>{
            let lookup = this.state.siteData.get(String(n.data.id));
            if(typeof(lookup) !== 'undefined'){
                n.pathTerm = 1;
                n.data.scoreNorm = lookup.scoreNorm;
                n.data.score = lookup.score;
                n.data.direction = lookup.direction;
                n.data.pathIndex = lookup.pathIndex
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
    
    edgeIdFromNodeIds=(i1,i2)=>{
        if(i1<i2)
            return i1+'-'+i2;
        else
            return i2+'-'+i1;
    }
    
    updateEdges=(integrationData)=>{
        let edges = [];
        let edgeIds = new Set();

        this.filterNodeScore([0,1]).forEach((path)=>{
            for(let i=0; i<path.nodes.length-1; ++i ){
                let id = this.edgeIdFromNodeIds(path.nodes[i+1] , path.nodes[i]); //path.nodes[i+1] + '-' + path.nodes[i];
                edgeIds.add(id);
                edges.push({
                    data:{
                        id: id,
                        //NOTE: tracing the path backwards so source comes second
                        source: path.nodes[i+1], 
                        target: path.nodes[i], 
                        edgeType: this.props.labelsUsed.nameLookupEdge(path.edgeLabels[i]).toString(), 
                        origin: integrationData.get(String(path.nodes[i] + '-' + path.nodes[i+1])),
                    }
                    
                });
            }
        });
        this.setState({edgeIds: edgeIds});
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
    
    handleSetMinPathScore=(score)=>{
        let value= Number(score);
        let newAvailable = Math.max(...[...this.state.trees.values()].map(tree=> tree.map(path => path.nodeScore).filter(score=>score > value).length));
            this.setState({
                kAvailable : newAvailable,
                minPathScore: value,
                kDisplayed: Math.min(newAvailable,this.state.topk)
            });
    }
    
    handleSetTopk=(k)=>{
        let value= Number(k);
        this.setState({
            topk: value,
            kDisplayed: Math.min(value, this.state.kAvailable)
        });
    }
    
    //Gets the response data and ensures the nodeIndexes have been looked up before proceeding
    getResponse=(responseTrees)=>{
        //Update the responseTrees with the current state IMPORTANT: doesnt change the state
       this.state.trees.forEach((k,v) => {
//            console.log("E",k,v)
            if(!responseTrees.has(v) )
                responseTrees.set(v, k);
            
        })

        let nodeIndexes = [...responseTrees.values()].map(tree=>tree.map(path => path.nodes)).flat(3);
        
        let siteData =  new Map();
        
        //Computes some data for the node Indexes corresponding to terminal sites
        let maxScore =  Math.max(...[...responseTrees.values()].map(tree=>tree.map(path => path.nodeScore)).flat());
        let minScore = 10;
        let targetMax = 100;
        
        let sourceIds = [];
        
        [...responseTrees.values()].forEach((tree,treeIndex) => {
            //Extract the valid source node ids
            if(tree.length>0)
                sourceIds.push(String(tree[0].nodes[tree[0].nodes.length-1]));
            
            tree.forEach((path,i) =>{
                siteData.set(String(path.nodes[0]), {
                    direction: path.direction, 
                    scoreNorm: Math.max(path.nodeScore*(targetMax/maxScore), minScore ),
                    score: path.nodeScore,
                    pathIndex: []
                });
                
            });
            
//             console.log(treeIndex,tree)
            
            
        });
        
        //Gets the path index for each site node in all trees
        [...responseTrees.entries()].forEach((tree) => {
//             console.log(treeIndex, tree)
            tree[1].forEach((path,i) =>{
                siteData.get(String(path.nodes[0])).pathIndex[tree[0]] = i;
//                 siteData.get(String(path.nodes[0])).pathIndex.push(i)
//                 siteData.get(String(path.nodes[0])).pathIndex.push(i+1)
                 
            });
        });
        
        
        console.log("HERE", siteData)
        
        
//         let pathLengthByCutoff = [...responseTrees.values()].map(tree => tree.map(path => ({score : path.nodeScore, length : path.totalWeight})).sort((l,r)=>{return l.score-r.score})) 
//         console.log("Wut",...[...responseTrees.values()].map(tree=> tree.map(path => path.nodeScore).filter(score=>score > this.state.minPathScore).length));
        
        let kAvailable = Math.max(...[...responseTrees.values()].map(tree=> tree.map(path => path.nodeScore).filter(score=>score > this.state.minPathScore).length));
        let kDisplayed = Math.min(kAvailable,this.state.topk);
        
        this.props.handleNodeLookupIndex(nodeIndexes,
            ()=>{this.setState({
                trees: responseTrees, 
                siteData: siteData, 
                sourceIds: sourceIds,
                kAvailable : kAvailable,
                kDisplayed : kDisplayed,
//                 pathLengthByCutoff : pathLengthByCutoff
            })}
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
    
    
    
//     updateDenseElements=()=>{
//         elements = []
//         
//         console.log("hi")
//         
//         this.setState({displayDenseElements: elements})
//     }
    
    handleSubmitDensePath=(nodeId, fn)=>{
        let versionDef = this.props.versionCardsO.getVersionDefinition(this.state.selectedVersionIndex);
  
        //gets the nodes corresponding to the paths
        let paths = [...this.state.trees.entries()].map((tree)=>tree[1][this.state.siteData.get(nodeId).pathIndex[tree[0]]].nodes );
        
        console.log(versionDef)
        let command = {cmd:"dpth",
             ...versionDef, 
            pathNodes: paths.flat()
            
        };
        

      
        
        Axios.post('http://'+this.props.backAddr, JSON.stringify(command)).then((response)=>{
        
            const updateDenseElements=()=>{
                
                let elements = []//this.state.displayElements
                
                let newNodeIds =  nodeIndexes; //response.data.map(edge)
                
                //takes the ids added by the dense path and addes them to the elements
//                 setLib.difference(new Set(newNodeIds),this.state.nodeIds )
                newNodeIds.forEach(id =>{
                   console.log(id)
                    elements.push(
                        {data: {
                            id: id,
                            dense: nodeId,
                            nodeType: this.props.labelsUsed.nameLookupNode(this.props.nodeData.getEntry(id).labels).toString(), 
                            label:  this.props.nodeData.getEntry(id).name, 
                            pLabel: this.props.nodeData.getEntry(id).pname === "" ? undefined : this.props.nodeData.getEntry(id).pname,
//                             origin: integrationData.get(String(id)),
                    }});
                      
                })
                
                
                //Now add the new edges
//                 let newEdgeIds = response.data.map(edge => edge.i1 +'-'+edge.i2);
                response.data.forEach(edge=>{
                    let id =  this.edgeIdFromNodeIds(edge.i1, edge.i2);//edge.i1 + '-'+edge.i2;
                     if(!this.state.edgeIds.has(id)){
                        elements.push(
                            {data:{
                                id: id,
                                dense: nodeId,
                                source: edge.i1, 
                                target: edge.i2,
                                edgeType: this.props.labelsUsed.nameLookupEdge(edge.l).toString(), 
                            
                        }});
                    }
                })
                
                
                
                
                this.setState({displayDenseElements: elements}, fn)
            }
            
            
//             console.log(response)
            
            let nodeIndexes = response.data.map(edge => [edge.i1, edge.i2]).flat()
            this.props.handleNodeLookupIndex(nodeIndexes, updateDenseElements)
        
    
        });
        
//         console.log([...this.state.trees].map((tree, treeId)=>tree[this.state.siteData.get(nodeId)[treeId] ].nodes ))
    }

    handleSelectVersion=(index)=>{
//         console.log(vdef)
        this.setState({selectedVersionIndex: index});
    }
    
    render(){
        {/*console.log("PS QUERYST", this.state)*/}
        return(
            //TODO: Remove the unecessary version card and such passing
            <Card.Body style={{whiteSpace:'nowrap'}}>
                <div style={{margin:'10px'}}>
                <PathQueryComponent 
                    backAddr={this.props.backAddr}
                    versionCards={this.props.versionCardsO}
                    versionCardPlainText={this.props.versionCardPlainText}
                    getVersionDefinition={this.props.getVersionDefinition}
                    
                    getResponse={this.getResponse}
                    
                    selectedVersionIndex ={this.state.selectedVersionIndex}
                    handleSelectVersion={this.handleSelectVersion}
                />
                </div>
                
                <div style={{display:'inline-block', margin:'10px'}}>
                    <CutoffManagerComponent
                        terminalScores={this.derivePathPlotScores()}
                        handleSetState={this.handleSetState}
                        handleSetMinPathScore={this.handleSetMinPathScore}
                        handleSetTopk={this.handleSetTopk}
                        topk={this.state.topk}
                        kAvailable={this.state.kAvailable}
                        minPathScore={this.minPathScore}
                    />
     
                    {/*this.getPopout()*/}
                    {/*<button onClick={() => this.setPopoutOpen(!this.state.showPopout)}>
                        toggle popout
                    </button>*/}
     
                 </div>
                
                 <div style={{display:'inline-block', verticalAlign:'top', margin:'10px'}}>
                    <ResultDisplay
                        displayElements={this.state.displayElements}
                        displayDenseElements={this.state.displayDenseElements}
                        handleSubmitDensePath={this.handleSubmitDensePath}
                    />
                </div>
                
                {/*
                <CytoscapeComponent className="border cyClass"  cy={(cy) => {this.cy = cy}} 
                    elements={this.state.displayDenseElements}  
                    style={ { width: '600px', height: '400px', marginBottom:'10px' } }
                />*/}
                
                {/*<div >
                    <CytoscapeCustom 
                        cstyle={{colors: {...cstyle.colors, integration :cstyle.color_integration}  , labels: cstyle.labels, sizes :cstyle.sizes}}
                        elements={this.state.displayDenseElements} 
                    />
                </div>*/}
                
            </Card.Body>
        );
    }
}

export {PathSearchComponent}
