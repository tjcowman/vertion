import React from 'react';
import {Button, Card, Row, Col} from 'react-bootstrap'

import Cytoscape from 'cytoscape';
import CytoscapeComponent from 'react-cytoscapejs';

import fcose from 'cytoscape-fcose';



import Axios from 'axios';

import {CytoscapeCustom} from './cytoscapeCustom.js'
import {RolloverPanel} from './rolloverPanel.js'
import './pathSearch.css'

Cytoscape.use( fcose );


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
                        <Button className="form-control" variant="primary" onClick={(e) =>this.props.handleSubmit(e)} >Submit</Button>
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

const ggcol=(n)=>{
    let hues = [...Array(n)].map((e,i) => ((15 + 360/(n))*i)%360 );
    return  hues.map((h) => 'hsl('+h+',65%,65%)' )
}

const ggColMap=(labelSet)=>{
    let hues = [...Array(labelSet.size)].map((e,i) => ((15 + 360/(labelSet.size))*i)%360 );
    let cMap = {};
//     console.log("HUES", hues);
    
    [...labelSet].forEach( (e,i) =>  {console.log(e,i); cMap[e] = 'hsl('+hues[i]+',65%,65%)'}  );// hues.map((h) => 'hsl('+h+',65%,65%)' )
    return cMap;
}


class PathSearchComponent extends React.Component{
    constructor(props){
        super(props);

         this.state={
            kinaseText: "P00533",
            siteText: "Q15459	359	-1.3219\nQ15459	451	0.5352\nP28482	185	4.4463\nP28482	187	4.4195\nQ8N3F8	273	-0.3219",
            pathTreeResponse: [],
            densePathResponse: [],

//             args: [minWeight : 0]
            minWeight: 0,
            
            
            topk: 0,
            minWeightDisplay: 0,
            sitesMap:  new Set(),
            
            pathsPassing : [], //Retured paths that pass the specified cutoff of their log fold
            
            elements: [],
            elementsRendered: [],
            elementsDense: []
        }
        
    }
    
    handleChange=(event)=>{
        let name = event.target.name;
        let value= event.target.value;

       // console.log("CH", name)
        
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
        
        this.state.pathTreeResponse.map((p,i) => {if(p.nodeScore > this.state.minWeightDisplay) pathsPassing.push(i) });
        
        console.log(pathsPassing)
        this.setState({pathsPassing: pathsPassing});
    }
    
    handleUpdateElementsRendered=()=>{
        
        let elements = this.state.pathsPassing.map((arrI) => (this.state.pathTreeResponse[arrI])).slice(0,this.state.topk).map((p)=>(
        
      //  let elements = this.state.pathTreeResponse.slice(0,this.state.topk).map((p)=>(
            
            p.nodes.map((id, count) => (
                {data: {id: id, nodeType: this.props.labelsUsed.nameLookupNode(this.props.nodeData.getEntry(id).labels).toString(), label: this.props.nodeData.getEntry(id).name, pathTerm: -1}, position:{x:0, y:0} }
            ))
            
        ))
        
        //makes the terminal nodes with their pathNumber and flattens to array of node elements
        elements.forEach((pp, pi)=> (pp[0].data.pathTerm =pi));
        elements = elements.flat();//.flat()

        //Pushes the edge elements to the array
        let edgeTypeSet = new Set();
        //this.state.pathTreeResponse.slice(0,this.state.topk).forEach((p)=>{
         this.state.pathsPassing.map((arrI) => (this.state.pathTreeResponse[arrI])).slice(0,this.state.topk).forEach((p)=>{
            for(let i=0; i<p.nodes.length-1; ++i ){
                elements.push({data:{source: p.nodes[i], target: p.nodes[i+1], edgeType: this.props.labelsUsed.nameLookupEdge(p.edgeLabels[i]).toString() }});
                edgeTypeSet.add(this.props.labelsUsed.nameLookupEdge(p.edgeLabels[i]).toString());
                
            }
        })

        elements.forEach((e) => {
            if( e.data.label in this.state.sitesMap){
                e.data.normScore = Math.abs(this.state.sitesMap[e.data.label][1])*10;
                e.data.direction = (this.state.sitesMap[e.data.label] > 0 ? 'up' : 'down');
                e.data.scored = 1;
            }
            else{
                e.data.scored = 0;

            }
        });
        

        //Compute the edge colors
        let colorMap = ggColMap(edgeTypeSet);        
        elements.forEach((e) =>{
            if(e.data.edgeType in colorMap)
                e.data.color = colorMap[e.data.edgeType];
        });
        
        console.log(elements)
        
        this.setState({
            elementsRendered: elements
        });
                
    }
    
    
    handleSubmit=()=>{
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
            console.log("cmd",response.data)

                this.props.handleNodeLookupIndex(response.data.map((p) => p.nodes).flat(), this.setState({pathTreeResponse: response.data}, this.handleMinWeightSlider) /*, formatResponse*/ );
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
//                 console.log("dense", response)
                
                
                             
                let formatResponse=(nodeIndexSet)=>{
                   // console.log("ND", this.props.nodeData)
                    
                    let elementsDense = [...nodeIndexSet].map((id)=>(
                        {data: {id: id, label: this.props.nodeData.getEntry(id).name} }
                    ))
                    
                    response.data.forEach((e)=>{
                        elementsDense.push({data:{source: e.i1, target: e.i2, labelType: e.l }});
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
            
            
    }
    

    
    render(){
    
        return (
            <>
            <RolloverPanel component={<Settings minWeight={this.state.minWeight} handleSubmit={this.handleSubmit} handleChange={this.handleChange} siteText={this.state.siteText} kinaseText={this.state.kinaseText}/>} />
           
           
            <div>Min Weight {this.state.minWeightDisplay}</div>
            <input type="range" name="minWeightDisplay" className="range-pathDisplayMinWeight" min="0" max="5"
                value={this.state.minWeightDisplay} step=".5" id="customRange2"
                onChange={(e) => {this.handleChange(e)  }}
                onMouseUp={(e)=> {this.handleMinWeightSlider(e)}} >
            </input>
           
           <div>Top {this.state.topk} of {this.state.pathsPassing.length}</div>
            <input type="range" name="topk" className="range-pathDisplay" min="0" max={this.state.pathsPassing.length}
                value={this.state.topk} step="1" id="customRange"
                onChange={(e) => {this.handleChange(e)  }}
                onMouseUp={(e)=> {this.handleUpdateElementsRendered()}} >
            </input>
            
           
            <Row>
                <Col><CytoscapeCustom elements={this.state.elementsRendered} handleNodeClick={this.handleNodeClick} handleEdgeClick={this.handleEdgeClick}/></Col>
                {/*<Col><CytoscapeCustom elements={this.state.elementsDense}/></Col>*/}
            </Row>
            
            </>
        )
    }
}

export {PathSearchComponent}
