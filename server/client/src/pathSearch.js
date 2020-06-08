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
                    
                    </Card.Body>
                </Card>
            </>
        );
    }
}


class PathSearchComponent extends React.Component{
    constructor(props){
        super(props);

         this.state={
            kinaseText: "P00533",
            siteText: "Q15459	359	-1.3219\nQ15459	451	0.5352\nP28482	185	4.4463\nP28482	187	4.4195\nQ8N3F8	273	-0.3219",
            pathTreeResponse: [],
            densePathResponse: [],

            
            elements: [],
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

    
    
    handleSubmit=()=>{
        let versions = [1,20,21,22];// [...this.props.versionCardsO.cards[this.props.versionCardsO.activeCard].versions_s];
        if(versions.length === 0)
        {
            this.props.handleLog("e", "no versions");
            this.setState({result:  {nodes:[{"row":null, "id":null, "value":null}], edges: [] } });
            return;
        }
        
        
        
        let command = {cmd:"pths", versions:versions, 
            vertexLabels: [0,1],// [...this.props.versionCardsO.cards[this.props.versionCardsO.activeCard].labelsV_s],
            edgeLabels:  [0,1,2,3], //[...this.props.versionCardsO.cards[this.props.versionCardsO.activeCard].labelsE_s],
            minWeight: 2,
            kinase: this.state.kinaseText ,
            sites: this.state.siteText.split("\n").map((r) => (r.split("\t")) ).map((e) => [e[0], Number(e[1]), Number(e[2])])
        };
        
      
         Axios.post('http://'+this.props.backAddr, JSON.stringify(command)).then((response)=>{
            console.log("cmd",response.data)
             
            let formatResponse=()=>{
                
                let elements = response.data.map((p)=>(
                    p.nodes.map((id, count) => (
                        {data: {id: id, label: this.props.nodeData.getEntry(id).name, pathTerm: -1}, position:{x:0, y:0} }
                    ))
                    
                ))
                
                //makes the terminal nodes with their pathNumber and flattens to array of node elements
                elements.forEach((pp, pi)=> (pp[0].data.pathTerm =pi));
                elements = elements.flat();//.flat()

                response.data.forEach((p)=>{
                    for(let i=0; i<p.nodes.length-1; ++i ){
                        elements.push({data:{source: p.nodes[i], target: p.nodes[i+1], labelType: p.edgeLabels[i] }});
                    }
                })

                
                
                
                this.setState({
                    pathTreeResponse : response.data,
                    elements: elements
                });
     
                console.log(this.state)
            }
             
            this.props.handleNodeLookupIndex(response.data.map((p) => p.nodes).flat(), formatResponse );
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
    
    handleNodeClick=(event)=>{
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
            <RolloverPanel component={<Settings handleSubmit={this.handleSubmit} handleChange={this.handleChange} siteText={this.state.siteText} kinaseText={this.state.kinaseText}/>} />
           
            <Row>
                <Col><CytoscapeCustom elements={this.state.elements} handleNodeClick={this.handleNodeClick}/></Col>
                <Col><CytoscapeCustom elements={this.state.elementsDense}/></Col>
            </Row>
            
            </>
        )
    }
}

export {PathSearchComponent}
