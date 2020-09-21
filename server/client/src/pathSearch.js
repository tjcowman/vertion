import React from 'react';
import Axios from 'axios';
import {Card} from 'react-bootstrap'
import { QuerySettingsBar} from './rolloverPanel.js'
import {  CutoffManagerComponent, ResultDisplay} from './pathSearchQuery.js'
//import {CytoscapeCustom} from './cytoscapeCustom.js'
//import {CytoscapeIntegration} from './cytoscapeIntegration.js'

//import * as setLib from './setLib.js'

import './pathSearch.css'

//import * as cstyle from './cytoStyles.js'

import './cytoscapeCustom.css'

import Cytoscape from 'cytoscape';
//import CytoscapeComponent from 'react-cytoscapejs';
import fcose from 'cytoscape-fcose';

Cytoscape.use( fcose );

class Settings extends React.Component{
    render(){
        return(
            <>
                <Card style={{display: 'inline-block', verticalAlign:'top', marginRight: '10px'/*marginBottom: '10px'*/}}>
                    <Card.Header>Input</Card.Header>

                    <Card.Body>

                        Kinase 1
                        <input autoComplete="off" value={this.props.kinaseText1} className="inputKinase form-control" name="kinaseText1"  onChange={this.props.handleChange} ></input>
                        Kinase 2
                        <input autoComplete="off" value={this.props.kinaseText2} className="inputKinase form-control" name="kinaseText2"  onChange={this.props.handleChange} ></input>
                        Sites
                        <textarea autoComplete="off" rows="5" value={this.props.siteText} className="inputSites form-control" name="siteText"   onChange={this.props.handleChangeSites} ></textarea>
                      {/*  <Button className="form-control" variant="primary" onClick={(e) =>this.handleSubmit(e)} >Submit</Button>*/}
                    </Card.Body>
                </Card>

                <div style={{display: 'inline-block',verticalAlign:'top'}}>
                    <Card >
                        <Card.Header>Settings</Card.Header>
                        <Card.Body>
                            PPI Weight Penalty
                            <input autoComplete="off"  className="form-control" type="number" value={this.props.mechRatio} name="mechRatio" onChange={(event)=>this.props.handleChangeRange(event,0,10000)}></input>
                            Co-Occurrence Weight Penalty
                            <input autoComplete="off"  className="form-control" type="number" value={this.props.coocRatio} name="coocRatio" onChange={(event)=>this.props.handleChangeRange(event,0,10000)}></input>
                            Top Log Fold Cutoff Fraction
                            <input autoComplete="off" className="form-control" type="number" step=".1" value={this.props.minWeight} name="minWeight" onChange={(event)=>this.props.handleChangeRange(event,0,1)}></input>

                        </Card.Body>
                    </Card>

                </div>
            </>
        );
    }
}

class PathSearchComponent extends React.Component{
    constructor(props){
        super(props);

         this.state={
            //arguments for the queries
            lastKinases: [],
            kinaseText1: "P00533",
            kinaseText2: "P15056",
            siteText: "Q15459	359	-1.3219\nQ15459	451	0.5352\nP28482	185	4.4463\nP28482	187	4.4195\nQ8N3F8	273	-0.3219",
            minWeight: 1,
            mechRatio: 10,
            coocRatio : 10,


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

    getArgs=()=>{
      return [this.state.lastKinases]
    }

    handleChange=(event)=>{
        let name = event.target.name;
        let value= event.target.value;

        this.setState({
            [name]: value,
        })
    }
    handleChangeRange=(event,min,max)=>{
        let name = event.target.name;
        let value= event.target.value;

        if(value < min)
            value = min;
        else if(value > max)
            value = max;

        this.setState({
            [name]: value,
            lastKinases : [] //need to reset kinases if the sites have changed
        })
    }

    handleChangeSites=(event)=>{
        let name = event.target.name;
        let value= event.target.value;

        this.setState({
            [name]: value,
            lastKinases : [] //need to reset kinases if the sites have changed
        })
    }

    kinaseArrayFormat=()=>{
        return [this.state.kinaseText1, this.state.kinaseText2];
    }

    parseKinase=()=>{
        return this.kinaseArrayFormat().filter((e,i) => this.state.lastKinases[i] !== e);

    }

    parseSites=()=>{
        let input = this.state.siteText.split("\n").map((r) => (r.match(/\S+/g)) ).filter(Boolean);
        if(input[0] === null)
            return [];

        if(input[0].length === 1){

        }else if(input[0].length ===2){
            input = input.filter(r => r.length ===2).map(r => [r[0], Number(r[1])]);
        }else{
            input = input.filter(r => r.length ===3).map(r => [r[0], Number(r[1]), Number(r[2])]);
        }
        if(input[0].length > 1)
            input = input.filter(r => {return r[r.length-1] !== 0});

        return input
    }


   queryVersionDense(){
     let versionDef = this.props.versionCardsO.getVersionDefinition(this.state.selectedVersionIndex);

     versionDef = {...versionDef,
         versions : [...versionDef.versions,
             this.props.versionsData.nameLookup.get("Protein-Harboring-Sites"),
             this.props.versionsData.nameLookup.get("Kinase-Substrate"),
        //     this.props.versionsData.nameLookup.get("Co-Occurrence"),
     ]}
     let aLab = this.props.labelsUsed.getUsedLabelSum(versionDef.versions);

     //versionDef = {versions: versionDef.versions, vertexLabels: [...aLab.nodes], edgeLabels : [...aLab.edges]};
     versionDef = {versions: versionDef.versions};
     return versionDef;
   }

  //Defines the neteork versions to use for network propagation
   queryVersionPropagation(){
     let versionDef = this.props.versionCardsO.getVersionDefinition(this.state.selectedVersionIndex);

     versionDef = {...versionDef,
         versions : [...versionDef.versions,
             this.props.versionsData.nameLookup.get("Protein-Harboring-Sites"),
             this.props.versionsData.nameLookup.get("Kinase-Substrate"),
             this.props.versionsData.nameLookup.get("Co-Occurrence"),
     ]}


     versionDef = {versionsProp: versionDef.versions};
     return versionDef;
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
            });
        }
    }

    computeUniqueNodes(treeIndex){
        return new Set(this.filterNodeScore([treeIndex]).map(path=>path.nodes).flat(2).map(i=>String(i)));
    }
    computeUniqueEdges(treeIndex){
        let ids=[];
        this.filterNodeScore([treeIndex]).forEach((path)=>{
            for(let i=0; i<path.nodes.length-1; ++i ){
                ids.push(
                    this.edgeIdFromNodeIds( path.nodes[i],path.nodes[i+1])
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

        pathElements.forEach(path=>{
            path.nodes.forEach(node => {
                ids.push(String(node))
            })
        })

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
            }else if(n.data.score > 0){
                n.data.queryClass = "sinkProtein";
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

    computeKinaseMask=()=>{
        let m = [];
        let A = this.kinaseArrayFormat();
        for(let i=0; i<A.length; ++i)
            if(A[i] !== this.state.lastKinases[i])
                m.push(i);

        return m;
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
                    pathIndex: [],
                    queryClass: "sinkProtein"
                });

            });

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

    pathsToElements=(paths)=>{
      let nodeIndexes = new Set(paths.map(p => p.nodes).flat());
        const elementFormatter=()=>{
        let nodes = [];
        let edges = [];
        let sourceIds = new Set(this.getPathSourceIds());

          [...nodeIndexes].forEach((id) => {
              let nodeType = this.props.labelsUsed.nameLookupNode(this.props.nodeData.getEntry(id).labels).toString();
              let label =  this.props.nodeData.getEntry(id).name;
              nodes.push({
                  data: {
                      id: String(id),
                      nodeType: nodeType,
                      label:  nodeType === "Site" ? label.substr(label.search(':')+1, label.length) :label,
                      pLabel: this.props.nodeData.getEntry(id).pname === "" ? undefined : this.props.nodeData.getEntry(id).pname,
                      origin: this.state.integrationData.get(String(id)),
                      queryClass: sourceIds.has(String(id)) ? 'sourceKinase':
                        this.state.siteData.has(String(id)) ? "sinkProtein":
                        'undefined'
                      }
                  });
                  }
              );

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
                          origin: this.state.integrationData.get(String(id)),
                      }

                  });
              }
          });
          let elements = new Map([...nodes, ...edges].map(e=> [e.data.id, e]));

          this.setState({displayDenseElements: [...elements.values()]})

        }
        this.props.handleNodeLookupIndex(nodeIndexes, elementFormatter);

    }

    handleSubmit=()=>{
        //Get the user specified version definition information and the other relevant for the query
        let versionDef = this.props.versionCardsO.getVersionDefinition(this.state.selectedVersionIndex);
        versionDef = {...versionDef,
            versions : [...versionDef.versions,
                this.props.versionsData.nameLookup.get("Kinase-Substrate-NS")
        ]}

        let aLab = this.props.labelsUsed.getUsedLabelSum(versionDef.versions);

        versionDef = {versions: versionDef.versions}

        let command = {cmd:"pths",
             ...versionDef,
            weightFraction: Number(this.state.minWeight),
            kinase: this.parseKinase(),
            mechRatio: Number(this.state.mechRatio),
            coocRatio: Number(this.state.coocRatio),
            sites: this.parseSites(),


        };

        let mask=this.computeKinaseMask();
        //Determine whether to query kinase or not
        //TODO: This is confusing, need special case to reQuery both kinases if any of the other parmaeters hve changed
        if(command.kinase.length> 0 || this.state.staleQuery)
            Axios.post('http://'+this.props.backAddr, JSON.stringify(command)).then((response)=>{

                this.setState({staleQuery: false});
            //    console.log("pathSearchResponse", response);
              //  console.log("pathSearchComponenetProps", this.props);
                this.setState({lastKinases : this.kinaseArrayFormat()});

                let responseeTrees = new Map(response.data.trees.map((tree,i) => ([mask[i], tree])));
                this.getResponse(responseeTrees);
            });

    }

    handleSubmit_siteEstimation=( pathIds, fn)=>{
        let versionDef = this.queryVersionDense();
        let versionDefProp = this.queryVersionPropagation();

        let treesAr = [...this.state.trees.entries()].map(e => e[1]); //gets an array of each tree (1 or 2)
        let paths = treesAr.map((tree,i) => tree[pathIds[i]]);//gets the path corresponding to each value in nodeIds
        let pathNodes = paths.map(path=>path.nodes)
        console.log("PN", pathNodes, this.props);

        let command = {
            cmd:"sitee",
            ...versionDef,
            ...versionDefProp,
            pathNodes: pathNodes.flat(),
            sources: pathNodes.map(p=> p[p.length-1]),
            sink: [pathNodes[0][0]],
            mechRatio : Number(this.state.mechRatio),
            coocRatio: Number(this.state.coocRatio),
        };

        Axios.post('http://'+this.props.backAddr, JSON.stringify(command)).then((response)=>{

          console.log("CCC", response)
          this.pathsToElements(response.data.trees.flat());

          this.setState({densePath: pathIds[0]});

        });
    }


     handleSubmit_crossPaths=( pathIds, fn)=>{
        let versionDef = this.queryVersionDense();
        let versionDefProp = this.queryVersionPropagation();

        let treesAr = [...this.state.trees.entries()].map(e => e[1]); //gets an array of each tree (1 or 2)
        let paths = treesAr.map((tree,i) => tree[pathIds[i]]);//gets the path corresponding to each value in nodeIds
        let pathNodes = paths.map(path=>path.nodes)

        console.log("PN", pathNodes, this.props);

        let command = {
            cmd:"crossp",
            ...versionDef,
            ...versionDefProp,
           // pathNodes: pathNodes.flat(),
            path1 : pathNodes[0],
            path2 : pathNodes[1],
            sources: pathNodes.map(p=> p[p.length-1]),
            sink: pathNodes[0][0],
            mechRatio: Number(this.state.mechRatio),
            coocRatio: Number(this.state.coocRatio),
        };

        Axios.post('http://'+this.props.backAddr, JSON.stringify(command)).then((response)=>{
            this.pathsToElements(response.data);

            this.setState({densePath: pathIds[0]});
        })
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

        return(


            //TODO: Remove the unecessary version card and such passing
            <Card.Body style={{whiteSpace:'nowrap' }}>

            <div style={{margin:'10px'}}>
            <QuerySettingsBar
                handleVersionChange={this.handleVersionChange}
                versionCards={this.props.versionCardsO}
                handleRun={this.handleSubmit}
                component={<Settings
                    minWeight={this.state.minWeight}
                    handleChange={this.handleChange}
                    handleChangeRange={this.handleChangeRange}
                    handleChangeSites={this.handleChangeSites}
                    siteText={this.state.siteText}
                    kinaseText1={this.state.kinaseText1}
                    kinaseText2={this.state.kinaseText2}
                    mechRatio={this.state.mechRatio}
                    coocRatio={this.state.coocRatio}
                />}
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
                        handleSubmit_siteEstimation={this.handleSubmit_siteEstimation}
                        handleSubmit_crossPaths={this.handleSubmit_crossPaths}
                        handleResetMainView={this.handleResetMainView}

                        getElementsFromPath={this.getElementsFromPath}
                        subPath = {this.state.densePath} //mark if one of the non main trees is being displayed (TODO: don't just hijack the old densePath state)
                    />
                </div>

            </Card.Body>
        );
    }
}

export {PathSearchComponent}
