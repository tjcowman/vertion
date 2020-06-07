import React from 'react';
import {Button, Card, Row, Col} from 'react-bootstrap'

import Cytoscape from 'cytoscape';
import CytoscapeComponent from 'react-cytoscapejs';

import fcose from 'cytoscape-fcose';



import Axios from 'axios';

import {RolloverPanel} from './rolloverPanel.js'

Cytoscape.use( fcose );


class Settings extends React.Component{
    render(){
        return(
            <>
                <textarea value={this.props.kinaseText} className="form-control" name="kinaseText"  onChange={this.props.handleChange} ></textarea>
                <textarea value={this.props.siteText} className="form-control" id="siteTex"   onChange={(e) =>this.handleChange} ></textarea>
            
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
            
            //denseNodeIds: Set(),
            
            elements: [],
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

    
    handleLayoutClick=()=>{
     //   if(this.state.elements.length > 0)
        //    this.cy.layout({name:'fcose'}).run();
        
        if(this.state.elementsDense.length > 0)
            this.cyd.layout({name:'fcose'}).run();
    }
    
    handleRunClick=()=>{
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
                    
                }, () =>  this.cy.layout({name:'fcose'}).run());
                console.log("cy", this.cy)
                this.cy.edges().style('line-color',  'data(labelType)');
                
                
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
        console.log("ELE", event.target._private.data);
        
        console.log("E", event)
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
                        {data: {id: id, label: this.props.nodeData.getEntry(id).name} }
                    ))
                    
                    response.data.forEach((e)=>{
                        elementsDense.push({data:{source: e.i1, target: e.i2, labelType: e.l }});
                    })
                    
                    this.setState({
                        densePathResponse : response,
                        elementsDense : elementsDense
                    }, () => this.cyd.layout({name:'fcose'}).run());
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
            
            
      //     console.log("hi")
    }
    
    componentDidMount = () => {
     //  this.cy.on('add', (event) => (this.cy.layout({name:'random'}).run(), console.log(event)))
       // this.cy.on('add', (event) => {this.cy.layout({name:'fcose'}).run()})
        this.cy.on('click', (event) => {this.handleNodeClick(event)});
    }
    
    

    
    render(){
    
    let stylesheet = [

        {
            selector: 'edge',
            style: {
                'line-color' : 'mapData(labelType, 0, 8, red, blue)'
            }
        },
        {
            selector: 'node',
            style: {
                'label': 'data(label)'
            }
        }
    ]
    console.log("SS",stylesheet)
        
        
        return (
            <>
            <RolloverPanel component={<Settings handleChange={this.handleChange} siteText={this.state.siteText} kinaseText={this.state.kinaseText}/>} />
            
            
            <div>
            <Row>
            
            {/*
                <Col className="col-6"><textarea value={this.state.kinaseText} className="form-control" id="kinaseTextBox" rows="3"  onChange={(e) =>this.handleKinaseInput(e)} ></textarea></Col>
                <Col className="col-6"><textarea value={this.state.siteText} className="form-control" id="siteTextBox" rows="3"  onChange={(e) =>this.handleSiteInput(e)} ></textarea></Col>
                
                <Col className="col-2"><Button onClick={(e) => (this.handleLayoutClick(e))}>Layout</Button></Col>*/}
                <Col className="col-2"><Button onClick={(e) => (this.handleRunClick(e))}>Run</Button></Col>
            </Row>
            
            <Row>
                <Col className="col-6"> <CytoscapeComponent className="border" layout={{name: 'random'}}cy={(cy) => {this.cy = cy}} elements={this.state.elements} stylesheet={ stylesheet } style={ { width: '600px', height: '600px' } }/></Col>
                <Col className="col-6"> <CytoscapeComponent className="border" cy={(cy) => {this.cyd = cy}} elements={this.state.elementsDense} stylesheet={stylesheet} style={ { width: '600px', height: '600px' } }/> </Col>
            </Row>
            </div>
            </>
        )
    }
}

export {PathSearchComponent}
