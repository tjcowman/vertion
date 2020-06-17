import React from 'react';
import {Button, Card, Row, Col, ListGroup, ListGroupItem, Input} from 'react-bootstrap'
import Cytoscape from 'cytoscape';
import CytoscapeComponent from 'react-cytoscapejs';

import fcose from 'cytoscape-fcose';

import './cytoscapeCustom.css'

const ggcol=(n)=>{
    let hues = [...Array(n)].map((e,i) => ((15 + 360/(n))*i)%360 );
    return  hues.map((h) => 'hsl('+h+',65%,65%)' )
}

const ggColMap=(labelSet)=>{
    let hues = [...Array(labelSet.size)].map((e,i) => ((15 + 360/(labelSet.size))*i)%360 );
    let cMap = new Map();
//     console.log("HUES", hues);
    
    [...labelSet].forEach( (e,i) =>  {/*console.log(e,i);*/ cMap.set( e, 'hsl('+hues[i]+',65%,65%)')}  );// hues.map((h) => 'hsl('+h+',65%,65%)' )
    return cMap;
}


let stylesheet = [

    {
        selector: 'edge',
        style: {
            'line-color' : 'data(color)'  //'mapData(edgeType, 0, 8, red, blue)'
        }
    },
    {
      selector: 'node',
      style: {
           'label': 'data(label)',
           'background-color' : 'data(color)',
           'width': '20px',
           'height': '20px'
      }
      
    },
    {
        selector: 'node[pLabel]',
        style:{
            'label': 'data(pLabel)',
            'background-color' : 'data(color)'
        }
    },
    {
        selector: 'node[nodeScore]',
        style: {
            'width' : 'data(nodeScore)',
            'height' : 'data(nodeScore)',
            }
        
    },
    {
        selector: "node[scored = 0 ]",
            style: {
//                 'background-color' : 'white',
                'border-color' : 'black',
                'border-width' : '2'
            }
    },
    {
        selector: "node[scored = 1 ]",
            style: {
//                 'background-color' : 'blue',
                'border-color' : 'black',
                'border-width' : '2'
            }
    }
]

class CytoscapeCustom extends React.Component{
    constructor(props){
        super(props);

        this.colorRef = React.createRef();
        
        this.state={
//             reRenderPlot: 1,
            
            editColorEdge : "",
            editColorNode : "",
            editValue : "",
            
            colorMapEdges : new Map(),
            colorMapNodes : new Map(),
        }
        
    }
    
    
    
    componentDidUpdate(prevProps, prevState){
//         console.log( this.state.colorMapEdges, prevState.colorMapEdges)
        
        if(this.props.elements.length > 0){//make sure elements actually exist
            if(this.props.elements !== prevProps.elements){ 
            
            
                let edgeTypeSet = new Set();
                let nodeTypeSet = new Set();
                this.cy.edges().forEach((n) => {edgeTypeSet.add(n._private.data.edgeType); /*console.log(n._private.data.edgeType);*/})
                this.cy.nodes().forEach((n) => {nodeTypeSet.add(n._private.data.nodeType); /*console.log(n._private.data.nodeType);*/})
                let colorMapEdges = ggColMap(edgeTypeSet);
                let colorMapNodes = ggColMap(nodeTypeSet);
                this.setState({colorMapEdges : colorMapEdges, colorMapNodes: colorMapNodes}, this.colorElements);
                
                this.cy.layout({name:'fcose'}).run();
            }   
            else
            {
                this.colorElements();
            }

        }
    }
    
    colorElements=()=>{
        this.cy.edges().forEach((n) => n.json({data :{color : this.state.colorMapEdges.get(n._private.data.edgeType)}}) );
        this.cy.nodes().forEach((n) => n.json({data :{color : this.state.colorMapNodes.get(n._private.data.nodeType)}}) );
                
    }
    
    componentDidMount = () => {
        this.cy.on('click', 'node', this.props.handleNodeClick);
        this.cy.on('click', 'edge', this.props.handleEdgeClick);
    }
    

    handleEdgeColorSelect=(event)=>{
          this.setState({
              editColorNode : "",
            editColorEdge : event.target.name,
            editValue : event.target.value
        }, ()=>{this.colorRef.current.focus()});
    }
    
    handleColorValueChange=(event)=>{
        this.setState({editValue : event.target.value});
    }
    
    handleEdgeColorChange=(event)=>{
        event.preventDefault();
//         console.log(event);
        
        let colorMapEdges = this.state.colorMapEdges;
        colorMapEdges.set(this.state.editColorEdge, this.state.editValue);
//         this.colorElements();
        this.setState({colorMapEdges: colorMapEdges}, this.colorElements);
    }
    
    handleNodeColorSelect=(event)=>{
        this.setState({
            editColorEdge : "",
            editColorNode : event.target.name,
            editValue : event.target.value
        }, ()=>{this.colorRef.current.focus()});
    }
    
    handleNodeColorChange=(event)=>{
        event.preventDefault();

        let colorMapNodes = this.state.colorMapNodes;
        colorMapNodes.set(this.state.editColorNode, this.state.editValue);
        this.colorElements();
        this.setState({colorMapNodes: colorMapNodes});
    }
    
    render(){
//         console.log("SSSSS", [...this.state.colorMapEdges.entries()].map((key,val) => key))
      
        return(
        
            <Card>
            <Card.Body>
                <Button onClick={async () => {
                    await navigator.clipboard.writeText(this.cy.nodes('[nodeType = "Protein"]').map((e) => e._private.data.label).join('\n'));
                    console.log(this.cy.nodes('[nodeType = "Protein"]').map((e) => e._private.data.label))
                }}
                    
                ></Button>
            
            
            
                <CytoscapeComponent className="border"  cy={(cy) => {this.cy = cy}} elements={this.props.elements} stylesheet={ stylesheet } style={ { width: '600px', height: '400px', marginBottom:'10px' } }/>
           
                        <div style={this.state.colorMapEdges.size === 0 ? {display:'none'} : {}}>Edges :</div> 
                        <div>
                        {[...this.state.colorMapEdges.entries()].map((k, i) =>(
                                <ListGroupItem className="colorItem" key={i}> 
                                    <button onClick={this.handleEdgeColorSelect} edit="editColorEdge" name={k[0]} value={k[1]} className="colorIcon" style={{backgroundColor:k[1]}}>
                                    </button>
                                    {k[0]}
                                </ListGroupItem>
                        ))}
                        </div>
                        
                        <div style={{clear:"both"}}></div>
                        
                        <div style={this.state.colorMapNodes.size === 0 ? {display:'none'} : {}}>Nodes :</div>
                        <div>
                        {[...this.state.colorMapNodes.entries()].map((k, i) =>(
                                <ListGroupItem className="colorItem" key={i}> 
                                    <button onClick={this.handleNodeColorSelect} edit="editColorNode" name={k[0]} value={k[1]} className="colorIcon" style={{backgroundColor:k[1]}}>
                                    </button>
                                    {k[0]}
                                </ListGroupItem>
                        ))}
                        </div>
                    
                        <div style={{clear:"both"}}></div>
                    
                        <div style={this.state.editColorEdge === "" ? {display:"none"} : {display:"inline"} }>
                        
                            <form onSubmit={this.handleEdgeColorChange}>
                                {this.state.editColorEdge} : 
                                    <input ref={this.colorRef} value={this.state.editValue}
                                        onChange={this.handleColorValueChange}
                                        
                                        >
                                    </input>
                                
                            </form>
                        </div>
                            
                                          
                        <div style={this.state.editColorNode === "" ? {display:"none"} : {display:"inline"} }>
                        
                            <form onSubmit={this.handleNodeColorChange}>
                                {this.state.editColorNode} : 
                                    <input ref={this.colorRef} value={this.state.editValue}
                                        onChange={this.handleColorValueChange}
                                        
                                        >
                                    </input>
                            </form>
                        </div>
   
                
            </Card.Body>
            </Card>
          
           
        );
    }
}

export{CytoscapeCustom};
