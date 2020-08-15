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
//         this.cy = React.createRef();

         this.state={
            topk: 10,
            kAvailable: 0,
            kDisplayed: 0,
            minPathScore: 0,
             
            trees: new Map(), 
            sourceIds : [],
            
            selectedVersionIndex: "T",
            siteData: new Map(),
            integrationData: new Map(),
            
            
            nodeIds: new Set(),
            edgeIds: new Set(),
            
            
            pathFocused: undefined,
            
            displayElements: [],
            densePath : -1,
            displayDenseElements: [],
        }
        
    }
    
    //gets the ids of the input kinases
    getPathSourceIds(){
        return(this.state.sourceIds);

    }
    
    componentDidUpdate(prevProps, prevState){
        if(
            prevState.minPathScore !== this.state.minPathScore || 
            prevState.trees !== this.state.trees || 
            prevState.kDisplayed !== this.state.kDisplayed
           // (prevState.topk !== this.state.topk && this.state.topk <= this.state.kAvailable)
        ){
            console.log("pathSearchState", this.state)
            this.setState({
                displayElements: this.updateElements(),
//                 densePath : -1
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
                    this.edgeIdFromNodeIds( path.nodes[i],path.nodes[i+1])
//                     path.nodes[i] + '-' + path.nodes[i+1], 
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
    
    //Gets the 
    getElementsFromPath=(pathIndexes)=>{
        
        let pathElements= [...this.state.trees.values()].map((tree,i) => tree[pathIndexes[i]]).filter(e=>typeof e !== 'undefined');
        let ids = [];
        console.log("PE",pathElements)
        
        pathElements.forEach(path=>{
            path.nodes.forEach(node => {
                ids.push(String(node))
            })
        })

        let edges = [];
        pathElements.forEach((path)=>{
            for(let i=0; i<path.nodes.length-1; ++i ){
                let id = this.edgeIdFromNodeIds(path.nodes[i+1] , path.nodes[i]); 
                ids.push(id);
            }
        });
        
        return(ids);
    }

    //Computes the overlapping node and edge elements then formats the elements for display
    updateElements=()=>{
        let idK1 = this.computeElementIds(0);
        let idK2 = this.computeElementIds(1);
        
        let idMap = new Map();
        
        console.log(idK1, idK2)
        
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
        
        this.setState({integrationData:idMap});
        return  [...this.updateNodes(idMap), ...this.updateEdges(idMap)];
    }
    
    updateNodes=(integrationData)=>{
        //Get the unique nodeIds used
        let nodeIds = new Set();        
        this.filterNodeScore([0,1]).forEach((p)=>(
            p.nodes.forEach(id => nodeIds.add(String(id)))
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
                        origin: integrationData.get(id),
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
        //Update the responseTrees with the current state IMPORTANT: doesnt change the state yet
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
            });
        });

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
        this.handleResetMainView();
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
    
    //returns the elements for both paths
    pathIndexToElementList=(index)=>{
         let sourceIds = new Set(this.getPathSourceIds())
        let arrs = [...this.state.trees.entries()].map((tree, treeI)=>([tree[1][index[treeI]].nodes, tree[1][index[treeI]].edgeLabels]))
        let paths = [...this.state.trees.entries()].map((tree,treeI)=>(tree[1][index[treeI]])).flat()
        let nodes = [];
        
        [...new Set(arrs.map(p=> p[0]).flat())].forEach((id) => {
            nodes.push({
                data: {
                    id: String(id),
                    nodeType: this.props.labelsUsed.nameLookupNode(this.props.nodeData.getEntry(id).labels).toString(), 
                    label:  this.props.nodeData.getEntry(id).name, 
                    pLabel: this.props.nodeData.getEntry(id).pname === "" ? undefined : this.props.nodeData.getEntry(id).pname,
                    origin: this.state.integrationData.get(String(id)),
                    queryClass: sourceIds.has(String(id)) ? 'sourceKinase': 'undefined'
//                     queryClass: sourceIds.has(id) ? 'sourceKinase': 'undefined'
                    }
                });
                }
            );
        

        let edges = [];
         paths.forEach((path)=>{
            for(let i=0; i<path.nodes.length-1; ++i ){
                let id = this.edgeIdFromNodeIds(path.nodes[i+1] , path.nodes[i]); 
                edges.push({
                    data:{
                        id: id,
                        //NOTE: tracing the path backwards so source comes second
                        source: String(path.nodes[i+1]), 
                        target: String(path.nodes[i]), 
                        edgeType: this.props.labelsUsed.nameLookupEdge(path.edgeLabels[i]).toString(), 
                        origin: this.state.integrationData.get(id),
                    }
                    
                });
            }
        });
        
        
        return [...nodes, ...edges];
    }
    
    handleSubmitDensePath=(nodeId, fn)=>{

        let versionDef = this.props.versionCardsO.getVersionDefinition(this.state.selectedVersionIndex);
    
        versionDef = {...versionDef, 
            versions : [...versionDef.versions,
                this.props.versionsData.nameLookup.get("Protein-Harboring-Sites"),
                this.props.versionsData.nameLookup.get("Kinase-Substrate")
        ]}
        let aLab = this.props.labelsUsed.getUsedLabelSum(versionDef.versions);
        
        versionDef = {versions: versionDef.versions, vertexLabels: [...aLab.nodes], edgeLabels : [...aLab.edges]}
        console.log("VD",versionDef)
            //gets the nodes corresponding to the paths
            let pathNodes = [...this.state.trees.entries()].map((tree)=>tree[1][this.state.siteData.get(nodeId).pathIndex[tree[0]]].nodes );

            let command = {cmd:"dpth",
                ...versionDef, 
                pathNodes: pathNodes,
                mechRatio : 10
            };
            

        
            
            Axios.post('http://'+this.props.backAddr, JSON.stringify(command)).then((response)=>{
                console.log("densePathSearch response",response)
                const updateDenseElements=()=>{

                    let rootElements = this.pathIndexToElementList(this.state.siteData.get(nodeId).pathIndex)
                    
                    let nodes = [];
                    let edges = [];
                    
                    let paths = response.data.branches.flat();
                    
                        [...nodeIndexes].forEach((id) => {
                            nodes.push({
                                data: {
                                    id: String(id),
                                    nodeType: this.props.labelsUsed.nameLookupNode(this.props.nodeData.getEntry(id).labels).toString(), 
                                    label:  this.props.nodeData.getEntry(id).name, 
                                    pLabel: this.props.nodeData.getEntry(id).pname === "" ? undefined : this.props.nodeData.getEntry(id).pname,
                                  
                                    }
                                });
                                }
                            );

                    
//                         let edges = [];
                        paths.forEach((path)=>{
                            for(let i=0; i<path.nodes.length-1; ++i ){
                                let id = this.edgeIdFromNodeIds(path.nodes[i+1] , path.nodes[i]); 
                                edges.push({
                                    data:{
                                        id: id,
                                        //NOTE: tracing the path backwards so source comes second
                                        source: String(path.nodes[i+1]), 
                                        target: String(path.nodes[i]), 
                                        edgeType: this.props.labelsUsed.nameLookupEdge(path.edgeLabels[i]).toString(), 
                                    }
                                    
                                });
                            }
                        });
                        
                        let elements = new Map([...nodes, ...edges].map(e=> [e.data.id, e]));
                        rootElements.forEach(e=> elements.set(e.data.id,e));
                        
                        this.setState({displayDenseElements: [...elements.values()],
                            densePath: nodeId
                        }, fn)
                }
            let nodeIndexes = new Set(response.data.branches.flat().map(p => p.nodes).flat())
//             let nodeIndexes = response.data.map(edge => [edge.i1, edge.i2]).flat()
            this.props.handleNodeLookupIndex(nodeIndexes, updateDenseElements)
        });

    }
    
    

    handleResetMainView=()=>{
        console.log("Cy",this.cy)
        this.setState({densePath: -1})
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
                    versionsData={this.props.versionsData}
                    getResponse={this.getResponse}
                    labelsUsed={this.props.labelsUsed}
                    
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
     

                 </div>
                
                 <div style={{display:'inline-block', verticalAlign:'top', margin:'10px'}}>
                    <ResultDisplay
                        displayElements={this.state.densePath === -1 ? this.state.displayElements : this.state.displayDenseElements}
                        cy={(cy) => {this.cy = cy}}
                        ref={this.cy}
//                         displayDenseElements={this.state.displayDenseElements}
                        handleSubmitDensePath={this.handleSubmitDensePath}
                        handleResetMainView={this.handleResetMainView}
                        
                        getElementsFromPath={this.getElementsFromPath}
                    />
                </div>
                
            </Card.Body>
        );
    }
}

export {PathSearchComponent}
