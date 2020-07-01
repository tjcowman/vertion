import React from 'react';
import {Button, Card} from 'react-bootstrap'

// import Cytoscape from 'cytoscape';
// import CytoscapeComponent from 'react-cytoscapejs';

// import fcose from 'cytoscape-fcose';

import { YAxis, Line, Scatter, LineChart,ReferenceLine} from 'recharts';
import DefaultTooltipContent from 'recharts/lib/component/DefaultTooltipContent';

import Axios from 'axios';
import {CytoscapeCustom} from './cytoscapeCustom.js'
import {RolloverPanel, QuerySettingsBar} from './rolloverPanel.js'
import * as cstyle from './cytoStyles.js'

import './pathSearchQuery.css'


class Settings extends React.Component{
    render(){
        return(
            <>
                <Card style={{marginBottom: '10px'}}>
                    <Card.Header>Input</Card.Header>
                    <Card.Body>
                        Kinase
                        <input autoComplete="off" value={this.props.kinaseText} className="inputKinase form-control" name="kinaseText"  onChange={this.props.handleChange} ></input>
                        Sites
                        <textarea autoComplete="off" value={this.props.siteText} className="inputSites form-control" name="siteText"   onChange={this.props.handleChange} ></textarea>
                      {/*  <Button className="form-control" variant="primary" onClick={(e) =>this.handleSubmit(e)} >Submit</Button>*/}
                    </Card.Body>
                </Card>
                
                <Card>
                    <Card.Header>Settings</Card.Header>
                    <Card.Body>
                        Minimum Weight
                        <input className="form-control" value={this.props.minWeight} name="minWeight" onChange={this.props.handleChange}></input>
                    </Card.Body>
                </Card>
            </>
        );
    }
}


class PathSearchQueryComponent extends React.Component{
    constructor(props){
        super(props);

         this.state={
            versionIndex: undefined,
             
            kinaseText: "P00533",
            siteText: "Q15459	359	-1.3219\nQ15459	451	0.5352\nP28482	185	4.4463\nP28482	187	4.4195\nQ8N3F8	273	-0.3219",
            pathTreeResponse: [],
            terminalScores: { sparseFactor :0, scores: []}, //the computed score value for the provided input set (basically avgs of sites / protein)
            
            densePathResponse: [],

            minWeight: 0,
            
            
            topk: 0,
            minWeightDisplay: 0,
//             sitesMap:  new Set(),
            
            pathsPassing : [], //Retured paths that pass the specified cutoff of their log fold
            
            elementsDense: [],
            
            sinkData : new Map(),
        }
        
    }
    
 

     
    handleChange=(event)=>{
        let name = event.target.name;
        let value= event.target.value;

        this.setState({
            [name]: value,
        })

    }
    
    handleSliderChange=(event)=>{
        let name = event.target.name;
        let value= event.target.value;
        
        this.setState({
            [name]: value,
        }, this.handleUpdateElementsRendered())
    }

    handleMinWeightSlider=(event)=>{
        let pathsPassing = [];
       
        this.state.pathTreeResponse.map((p,i) => {if(p.nodeScore >= this.state.minWeightDisplay) pathsPassing.push(i) });
        let nextTop = Math.min(this.state.topk, pathsPassing.length);
        let prevTop = this.state.topk;

        
        this.setState({pathsPassing: pathsPassing, topk: nextTop}, ()=>{if(nextTop<prevTop)this.handleUpdateElementsRendered()} );
    }
    
    updateNodes=()=>{
        //Get the unique nodeIds used
        let nodeIds = new Set();        
        this.state.pathsPassing.map((arrI) => (this.state.pathTreeResponse[arrI])).slice(0,this.state.topk).forEach((p)=>(
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
            let lookup = this.state.sinkData.get(n.data.id);
//             console.log(lookup)
            if(typeof(lookup) !== 'undefined'){
                n.pathTerm = 1;
                n.data.scoreNorm = lookup.scoreNorm;
                n.data.direction = lookup.direction;
            }
            
//             console.log(n, n.nodeType)
            if(n.data.nodeType === "Site"){
                n.data.label = n.data.label.substring(n.data.label.search(':')+1 );
                //console.log("f" ,n.data.label.substring(n.data.label.search(':')+1 ))
//                 n.data.label = n.data.label.substring(n.data.label.search(':')+1 );
            }
            
        })
        
        return nodes;
    }
    
    updateEdges=()=>{
        let edges = [];
//         let 
        
        this.state.pathsPassing.map((arrI) => (this.state.pathTreeResponse[arrI])).slice(0,this.state.topk).forEach((p)=>{
            for(let i=0; i<p.nodes.length-1; ++i ){
                edges.push({
                    data:{
                        id: p.nodes[i] + '-' + p.nodes[i+1],
                        source: p.nodes[i], 
                        target: p.nodes[i+1], 
                        edgeType: this.props.labelsUsed.nameLookupEdge(p.edgeLabels[i]).toString() 
//                         color : 'black' 
                    }
                    
                });
            }
        })
        
//         console.log("E", edges)
        
        //get unique indexes by using source target as key
//         let uniqueIndexes = new Map(edges.map((e,i) => ([e.data.source + '-' +e.data.target, i])));
        let uniqueIndexes = new Map(edges.map((e,i) => [e.data.id, i]));
        
        return [...uniqueIndexes.values()].map(i => edges[i]);
        
//         console.log("FFF", uniqueIndexes)
        
//         return edges;
    }
    
    handleUpdateElementsRendered=()=>{        
        let nodes = this.updateNodes();
        
        
        let edges = this.updateEdges();

        this.props.handleUpdateElements([...nodes, ...edges], this.props.elementsName);
    }
    
    
    handleSubmit=()=>{
        
        //TODO: replace the current method with this 


        let versions = [1,20,21,22];// [...this.props.versionCardsO.cards[this.props.versionCardsO.activeCard].versions_s];

        
        let sites =  this.state.siteText.split("\n").map((r) => (r.split("\t")) ).map((e) => [e[0], Number(e[1]), Number(e[2])]);
        let sitesMap = {}; // 
        this.state.siteText.split("\n").map((r) => (r.split("\t")) ).forEach((es) => (sitesMap[es[0]] = [Number(es[1]), Number(es[2])]));
        
        this.setState({sitesMap: sitesMap});
        
//         console.log(sitesParsed)
        
        
        let command = {cmd:"pths", versions:versions, 
            vertexLabels: [0,1],// [...this.props.versionCardsO.cards[this.props.versionCardsO.activeCard].labelsV_s],
            edgeLabels:  [0,1,2,3], //[...this.props.versionCardsO.cards[this.props.versionCardsO.activeCard].labelsE_s],
            minWeight: Number(this.state.minWeight),
            kinase: this.state.kinaseText,
            sites: sites
        };
        
        if(typeof(this.state.versionIndex) !== 'undefined'){
            command = Object.assign(command, this.props.versionCardsO.getVersionDefinition(this.state.versionIndex));
        }
        
        console.log("CMSENT", command)
        
        Axios.post('http://'+this.props.backAddr, JSON.stringify(command)).then((response)=>{
            console.log("cmd",response.data);

            let sinkData = new Map();
            
            let terminalScores = { sparseFactor : 1, scores: response.data.map((p,i) => (p.nodeScore) ).sort()};
            //sparsify the scores for plotting later
            if(terminalScores.scores.length > 199){
                let sparseFactor = Math.floor(terminalScores.scores.length/100);
                
                terminalScores = { sparseFactor : sparseFactor, scores: terminalScores.scores.filter((e, i) => {return i % sparseFactor === 0})};
            }
            
            let maxScore =  Math.max(...response.data.map(p => p.nodeScore));
//             console.log("MS", maxScore, response.data.map(p => p.nodeScore))
            let targetMax = 100;
            
            response.data.forEach(p =>{
                sinkData.set(p.nodes[0], {
                    direction: p.direction, 
                    scoreNorm: p.nodeScore*(targetMax/maxScore) 
                });
            });
            
            //Compute normalized scores 
            
            
            this.props.handleNodeLookupIndex(response.data.map((p) => p.nodes).flat(), this.setState({pathTreeResponse: response.data, terminalScores: terminalScores, sinkData: sinkData}, this.handleMinWeightSlider) /*, formatResponse*/ );
        });
        
    }
    
    handleKinaseInput=(event)=>{
        this.setState({
            kinaseText : event.target.value
        })
    }
    handleSiteInput=(event)=>{
        this.setState({
            siteText : event.target.value
        })
    }
    
    handleEdgeClick=(event)=>{
        console.log(event.target._private.data)
    }
    
    handleNodeClick=(event)=>{
        console.log(event.target._private.data)
       /* 
        if(typeof event.target._private.data.pathTerm !== 'undefined' && event.target._private.data.pathTerm !== -1){
            let versions = [1,20,21,22];// [...this.props.versionCardsO.cards[this.props.versionCardsO.activeCard].versions_s];
            if(versions.length === 0)
            {
                this.props.handleLog("e", "no versions");
                this.setState({result:  {nodes:[{"row":null, "id":null, "value":null}], edges: [] } });
                return;
            }
            
            
            let command = {cmd:"dpth", versions:versions, 
                vertexLabels: [0,1],// [...this.props.versionCardsO.cards[this.props.versionCardsO.activeCard].labelsV_s],
                edgeLabels:  [0,1,2,3],//[...this.props.versionCardsO.cards[this.props.versionCardsO.activeCard].labelsE_s],
                nodes : this.state.pathTreeResponse[event.target._private.data.pathTerm].nodes
            };
            
            
            Axios.post('http://'+this.props.backAddr, JSON.stringify(command)).then((response)=>{
                console.log("dense", response)
                
                
                             
                let formatResponse=(nodeIndexSet)=>{
                   // console.log("ND", this.props.nodeData)
                    
                    let elementsDense = [...nodeIndexSet].map((id)=>(
                        {data: {
                            id: id,
                            label: this.props.nodeData.getEntry(id).name,
                            nodeType: this.props.labelsUsed.nameLookupNode(this.props.nodeData.getEntry(id).labels).toString(), 
                        } }
                    ))
                    
                    response.data.forEach((e,i)=>{
                        elementsDense.push({data:{
                            source: e.i1,
                            target: e.i2,
                            labelType: e.l,
//                             edgeType: this.props.labelsUsed.nameLookupEdge(e.edgeLabels[i]).toString(),
                        }});
                    })
                    
                    this.setState({
                        densePathResponse : response,
                        elementsDense : elementsDense
                    });
                    console.log(this.state)
                }
                
                let nodeIds = new Set();
                response.data.forEach((e) =>{
                    nodeIds.add(e.i1);
                    nodeIds.add(e.i2);
                })
                this.props.handleNodeLookupIndex([...nodeIds], function(){formatResponse(nodeIds)} );
            });
        }
            */
            
    }
    
    handleClickScore=(event)=>{
        console.log("HI", event, event.activePayload[0].value);
        
        this.setState({ minWeightDisplay: event.activePayload[0].value}, this.handleMinWeightSlider);
    }
    
    handleVersionChange=(event)=>{
        this.setState({versionIndex: event.value})
    }
    
    render(){  
            let numScores = this.state.terminalScores.scores.length;
            let scoreMax = this.state.terminalScores.scores[numScores-1];
           
        
        return (
           
            <>
            <Card.Body >
               
                    <QuerySettingsBar handleVersionChange={this.handleVersionChange} versionCards={this.props.versionCardsO} handleRun={this.handleSubmit} component={<Settings minWeight={this.state.minWeight} handleChange={this.handleChange} siteText={this.state.siteText} kinaseText={this.state.kinaseText}/>} />
                    
                
                            <div className="container">
                            <div style={{display:'inline-block', margin:'5px'/*, backgroundColor:'green'*/}}>
                                <Card >
                                    <Card.Body>
                                
                                        <div className="border" >
                                            <LineChart
                                                margin={{top:0,right:0,bottom:0, left:0}}
                                                width={200} height={100} data={this.state.terminalScores.scores.map((s, i) => ({rank: i*this.state.terminalScores.sparseFactor, score : s} ))}
                                            >
                                                <YAxis hide={true} type="number" domain={[0, 'dataMax']} />
                                                <Line type='monotone' dataKey="score" stroke='#8884d8' strokeWidth={3} />
                                                <ReferenceLine  y={this.state.minWeightDisplay}/>
                                            </LineChart>
                                        </div>
                                        
                                        <input type="range" name="minWeightDisplay" className="range-pathDisplayMinWeight" min="0" max={ numScores === 0 ? 0 : scoreMax}
                                                value={this.state.minWeightDisplay} 
                                                step={ isNaN(scoreMax) ? 0 : scoreMax/100} 
                                                id="customRange2"
                                                onChange={(e) => {this.handleChange(e)  }}
                                                onMouseUp={(e)=> {this.handleMinWeightSlider(e)}} >
                                        </input>
                                            
                                        <div>Score Cutoff = {Number(this.state.minWeightDisplay).toPrecision(5)}</div>
                                            
                                            
                                    </Card.Body>
                                </Card>
                                

                                <Card>
                                <Card.Body>
                                    
                                    <input type="range" name="topk" className="range-pathDisplayMinWeight" min="0" max={this.state.pathsPassing.length}
                                        value={this.state.topk} step="1" id="customRange"
                                        onChange={this.handleChange  }
                                        onMouseUp={this.handleUpdateElementsRendered} >
                                    </input>
                                    <div>Display Top {this.state.topk} of {this.state.pathsPassing.length}</div>
                                    </Card.Body>
                                </Card>
                            

                            </div>
                        
                        
                            <div className="plotNav">
                                <CytoscapeCustom 
                                    cstyle={{colors: cstyle.colors , labels: cstyle.labels, sizes :cstyle.sizes}}
                                    elements={this.props.elements} 
                                    handleNodeClick={this.handleNodeClick} 
                                    handleEdgeClick={this.handleEdgeClick}
                                />
                            </div>
                            
                            {/*
                            <CytoscapeCustom 
                                elements={this.state.elementsDense} 
                                                        
                                                        
                            />*/}
                            
                        </div>
                   
                </Card.Body>
                </>
        );
    }

}

export {PathSearchQueryComponent}

