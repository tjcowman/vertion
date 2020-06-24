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


import './pathSearchQuery.css'


class Settings extends React.Component{
    render(){
        return(
            <>
                <Card style={{marginBottom: '10px'}}>
                    <Card.Header>Input</Card.Header>
                    <Card.Body>
                        Kinase
                        <input value={this.props.kinaseText} className="inputKinase form-control" name="kinaseText"  onChange={this.props.handleChange} ></input>
                        Sites
                        <textarea value={this.props.siteText} className="inputSites form-control" name="siteText"   onChange={this.props.handleChange} ></textarea>
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
            kinaseText: "P00533",
            siteText: "Q15459	359	-1.3219\nQ15459	451	0.5352\nP28482	185	4.4463\nP28482	187	4.4195\nQ8N3F8	273	-0.3219",
            pathTreeResponse: [],
            terminalScores: { sparseFactor :0, scores: []}, //the computed score value for the provided input set (basically avgs of sites / protein)
            
            densePathResponse: [],

            minWeight: 0,
            
            
            topk: 0,
            minWeightDisplay: 0,
            sitesMap:  new Set(),
            
            pathsPassing : [], //Retured paths that pass the specified cutoff of their log fold
            
            elementsDense: []
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
    
    handleUpdateElementsRendered=()=>{        
        let elements = this.state.pathsPassing.map((arrI) => (this.state.pathTreeResponse[arrI])).slice(0,this.state.topk).map((p)=>(
            
            p.nodes.map((id, count) => (
                {data: {
                    id: id, 
                    nodeType: this.props.labelsUsed.nameLookupNode(this.props.nodeData.getEntry(id).labels).toString(), 
//                     origin: this.props.elementsName,
                    color:'black', 
                    label: this.props.nodeData.getEntry(id).name, 
                    pLabel: this.props.nodeData.getEntry(id).pname === "" ? undefined : this.props.nodeData.getEntry(id).pname,
                    pathTerm: -1,
                    terminalScore : p.nodeScore,
                }, 
                position:{x:0, y:0} 
                }
            ))
            
        ))
        
        //makes the terminal nodes with their pathNumber and flattens to array of node elements
        elements.forEach((pp, pi)=> (pp[0].data.pathTerm =pi, pp[0].data.nodeScore = 10*pp[0].data.terminalScore ));
        
        elements = elements.flat();//.flat()

        //Pushes the edge elements to the array
         this.state.pathsPassing.map((arrI) => (this.state.pathTreeResponse[arrI])).slice(0,this.state.topk).forEach((p)=>{
            for(let i=0; i<p.nodes.length-1; ++i ){
                elements.push({data:{source: p.nodes[i], target: p.nodes[i+1], /*origin: this.props.elementsName,*/ edgeType: this.props.labelsUsed.nameLookupEdge(p.edgeLabels[i]).toString(), color : 'black' }});
            }
        })

        elements.forEach((e) => {
            if( e.data.label in this.state.sitesMap){
                e.data.direction = (this.state.sitesMap[e.data.label] > 0 ? 'up' : 'down');
                e.data.scored = 1;
            }
            else{
                e.data.scored = 0;

            }
        });

        
        this.props.handleUpdateElements(elements, this.props.elementsName);

    }
    
    
    handleSubmit=()=>{
        
        //TODO: replace the current method with this 
        console.log(this.props.getVersionDefinition())
        
        let versions = [1,20,21,22];// [...this.props.versionCardsO.cards[this.props.versionCardsO.activeCard].versions_s];
        if(versions.length === 0)
        {
            this.props.handleLog("e", "no versions");
            this.setState({result:  {nodes:[{"row":null, "id":null, "value":null}], edges: [] } });
            return;
        }
        
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
        console.log("CMSENT", command)
        
        Axios.post('http://'+this.props.backAddr, JSON.stringify(command)).then((response)=>{
            console.log("cmd",response.data);

            let terminalScores = { sparseFactor : 1, scores: response.data.map((p,i) => (p.nodeScore) ).sort()};
            //sparsify the scores for plotting later
            if(terminalScores.scores.length > 199){
                let sparseFactor = Math.floor(terminalScores.scores.length/100);
                
                terminalScores = { sparseFactor : sparseFactor, scores: terminalScores.scores.filter((e, i) => {return i % sparseFactor === 0})};
            }
//         
            
            
            this.props.handleNodeLookupIndex(response.data.map((p) => p.nodes).flat(), this.setState({pathTreeResponse: response.data, terminalScores: terminalScores}, this.handleMinWeightSlider) /*, formatResponse*/ );
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
        
//         if(typeof event.target._private.data.pathTerm !== 'undefined' && event.target._private.data.pathTerm !== -1){
//             let versions = [1,20,21,22];// [...this.props.versionCardsO.cards[this.props.versionCardsO.activeCard].versions_s];
//             if(versions.length === 0)
//             {
//                 this.props.handleLog("e", "no versions");
//                 this.setState({result:  {nodes:[{"row":null, "id":null, "value":null}], edges: [] } });
//                 return;
//             }
//             
//             
//             let command = {cmd:"dpth", versions:versions, 
//                 vertexLabels: [0,1],// [...this.props.versionCardsO.cards[this.props.versionCardsO.activeCard].labelsV_s],
//                 edgeLabels:  [0,1,2,3],//[...this.props.versionCardsO.cards[this.props.versionCardsO.activeCard].labelsE_s],
//                 nodes : this.state.pathTreeResponse[event.target._private.data.pathTerm].nodes
//             };
//             
//             
//             Axios.post('http://'+this.props.backAddr, JSON.stringify(command)).then((response)=>{
//                 console.log("dense", response)
//                 
//                 
//                              
//                 let formatResponse=(nodeIndexSet)=>{
//                    // console.log("ND", this.props.nodeData)
//                     
//                     let elementsDense = [...nodeIndexSet].map((id)=>(
//                         {data: {id: id, label: this.props.nodeData.getEntry(id).name} }
//                     ))
//                     
//                     response.data.forEach((e)=>{
//                         elementsDense.push({data:{source: e.i1, target: e.i2, labelType: e.l }});
//                     })
//                     
//                     this.setState({
//                         densePathResponse : response,
//                         elementsDense : elementsDense
//                     });
//                     console.log(this.state)
//                 }
//                 
//                 let nodeIds = new Set();
//                 response.data.forEach((e) =>{
//                     nodeIds.add(e.i1);
//                     nodeIds.add(e.i2);
//                 })
//                 this.props.handleNodeLookupIndex([...nodeIds], function(){formatResponse(nodeIds)} );
//             });
//         }
            
            
    }
    
    handleClickScore=(event)=>{
        console.log("HI", event, event.activePayload[0].value);
        
        this.setState({ minWeightDisplay: event.activePayload[0].value}, this.handleMinWeightSlider);
    }
    
    
    
    render(){  
            let numScores = this.state.terminalScores.scores.length;
            let scoreMax = this.state.terminalScores.scores[numScores-1];
           
        
        return (
           
            <>
            <Card.Body >
               
                    <QuerySettingsBar versionCards={this.props.versionCardsO} handleRun={this.handleSubmit} component={<Settings minWeight={this.state.minWeight} handleChange={this.handleChange} siteText={this.state.siteText} kinaseText={this.state.kinaseText}/>} />
                    
                
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
                                                step={ /*numScores < 100 ? scoreMax/numScores:*/ scoreMax/100} 
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
                                                        elements={this.props.elements} 
                                                        handleNodeClick={this.handleNodeClick} 
                                                        handleEdgeClick={this.handleEdgeClick}
                                                    />
                        </div>
                        </div>
                   
                </Card.Body>
                </>
        );
    }

}

export {PathSearchQueryComponent}

