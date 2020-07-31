import React from 'react';
import {Button, Card, Row, Col, ListGroup, ListGroupItem, Input} from 'react-bootstrap'
import Cytoscape from 'cytoscape';
import CytoscapeComponent from 'react-cytoscapejs';

import Select from 'react-select';

import fcose from 'cytoscape-fcose';

import {base}  from './cytoStyles.js'

import './cytoscapeCustom.css'

// var cytoscape = require('cytoscape');
var undoRedo = require('cytoscape-undo-redo');

undoRedo( Cytoscape ); 

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


class CytoscapeLegend extends React.Component{
    constructor(props){
        super(props);
    }
    
    render(){
        return(
            <>
                    <div>
                {[...this.props.basicMap.entries()].map((k, i) =>(
                        <ListGroupItem className="colorItem" key={i}> 
                            <button onClick={this.handleNodeColorSelect} edit="editColorNode" name={k[0]} value={k[1]} className="colorIcon" style={{backgroundColor:k[1]}}>
                            </button>
                            {k[0]}
                        </ListGroupItem>
                ))}
                </div>
            
                <div style={this.props.edgeMap.size === 0 ? {display:'none'} : {}}>Edges :</div> 
                <div>
                {[...this.props.edgeMap.entries()].map((k, i) =>(
                        <ListGroupItem className="colorItem" key={i}> 
                            <button onClick={this.handleEdgeColorSelect} edit="editColorEdge" name={k[0]} value={k[1]} className="colorIcon" style={{backgroundColor:k[1]}}>
                            </button>
                            {k[0]}
                        </ListGroupItem>
                ))}
                </div>
                
                <div style={{clear:"both"}}></div>
                
                <div style={this.props.nodeMap.size === 0 ? {display:'none'} : {}}>Nodes :</div>
                <div>
                {[...this.props.nodeMap.entries()].map((k, i) =>(
                        <ListGroupItem className="colorItem" key={i}> 
                            <button onClick={this.handleNodeColorSelect} edit="editColorNode" name={k[0]} value={k[1]} className="colorIcon" style={{backgroundColor:k[1]}}>
                            </button>
                            {k[0]}
                        </ListGroupItem>
                ))}
                </div>
            
            {/*
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
                */}
            </>
        );
    }
}


class CytoscapeCustom extends React.Component{
    constructor(props){
        super(props);
        
        const options = {
            isDebug: false, // Debug mode for console messages
            actions: {},// actions to be added
            undoableDrag: false, // Whether dragging nodes are undoable can be a function as well
            stackSizeLimit: undefined, // Size limit of undo stack, note that the size of redo stack cannot exceed size of undo stack
            ready: function () { // callback when undo-redo is ready

            }
        }
        
        this.ur = ()=> { return this.cy.undoRedo(options)}

//          cy={(cy) => {this.cy = cy}}
         
        this.colorRef = React.createRef();
        
        this.state={
            colorStyle : "integration",
            labelStyle : "None",
            sizeStyle : "Constant",
            
            elementDescription: {}, 
            
//             editColorEdge : "",
//             editColorNode : "",
//             editValue : "",
            
            exportField : "",
            
            colorMapEdges : new Map(),
            colorMapNodes : new Map(),
            colorMapBoth : new Map(),
            
            test: undefined,
//             elementsLocal : [],
//             lastDenseElements : undefined,  
        }
        
    }
    
    formatElementDescription(){
//         return(
            const v = this.state.elementDescription;
        
            if(v.hasOwnProperty('nodeType'))
            {
                return (
                    v.nodeType + ": " +
                    (v.pLabel ? v.pLabel: v.label)
                    
                    
                );
            }else if(v.hasOwnProperty('edgeType')){
                return(
                    v.edgeType
                )
            }
            
//         );
    }
    
    //Layouts
     layout_fcose=()=>{
        if(this.cy.elements().length>0){

            this.cy.layout({name:'fcose',    }).run();
            
            
            
           ;
            
        }
    }   
    
    layout_fcoseP=()=>{
        if(this.cy.elements().length>0){
            
            this.cy.nodes('[queryClass = "sourceKinase"]').lock();
            
            
            (this.cy.layout({name:'fcose', randomize: false, qualiy: 'proof', stop:  ()=>{this.cy.nodes('[queryClass = "sourceKinase"]').unlock()}     }).run());
            
            
            
           ;
            
        }
    }   
    
    componentDidUpdate(prevProps, prevState){
        
        if(this.props.elements.length > 0){//make sure elements actually exist
//             this.cy.startBatch();
            if(this.props.elements !== prevProps.elements){ 
//                 this.cy.removeData();
            
                let edgeTypeSet = new Set();
                let nodeTypeSet = new Set();
                this.cy.edges().forEach((n) => {edgeTypeSet.add(n._private.data.edgeType); /*console.log(n._private.data.edgeType);*/})
                this.cy.nodes().forEach((n) => {nodeTypeSet.add(n._private.data.nodeType); /*console.log(n._private.data.nodeType);*/})
                let colorMapEdges = ggColMap(edgeTypeSet);
                let colorMapNodes = ggColMap(nodeTypeSet);
                let colorMapBoth = ggColMap(new Set([...nodeTypeSet,...edgeTypeSet]));
                this.setState({colorMapEdges : colorMapEdges, colorMapNodes: colorMapNodes, colorMapBoth: colorMapBoth}, this.colorElements);
                
                this.layout_fcose();
            }   
            else
            {
                this.colorElements();
            }
//             this.cy.endBatch();
        }
    }
    
    
    colorElements=()=>{
//         this.cy.edges().forEach((n) => n.json({data :{color_auto : this.state.colorMapEdges.get(n._private.data.edgeType)}}) );
//         this.cy.nodes().forEach((n) => n.json({data :{color_auto : this.state.colorMapNodes.get(n._private.data.nodeType)}}) );
         this.cy.edges().forEach((n) => n.json({data :{color_auto : this.state.colorMapBoth.get(n._private.data.edgeType)}}) );
        this.cy.nodes().forEach((n) => n.json({data :{color_auto : this.state.colorMapBoth.get(n._private.data.nodeType)}}) );
                
    }
    
    componentDidMount = () => {
//         this.cy.on('click', 'node', this.props.handleNodeClick);
//         this.cy.on('click', 'edge', this.props.handleEdgeClick);
//         let this.ur = this.cy.undoRedo();
//         let ur = this.cy.undoRedo() 
//         cy={(cy) => {this.cy = cy}}
//         ur.action("displayDensePath");
//         this.cy.on('click', 'node', (e)=>{console.log(e.target._private.data)} );
        this.cy.on('click', this.handleElementClick);
//         this.setState({ lastDenseElements :this.cy.collection()});
        
    }
    
    handleElementClick=(event)=>{
//         console.log(event.target._private.data);
        
//         this.setState({ });
        
//         console.log("ur", this.ur)
        
//         this.cy.remove(this.cy.elements('[dense]'));
        //.do("remove", (this.cy.elements('[dense]')));
        
        if(event.target._private.data.hasOwnProperty('score')){
             this.ur().undoAll()
            this.ur().do("remove", this.cy.elements())
            
            this.props.handleSubmitDensePath(event.target._private.data.id, ()=>{
//                 console.log(this.props.denseElements)
                this.ur().do("add",(this.props.denseElements));
                
            });
        }
        
//         if(this.cy.elements(':selected').length<=1)
        this.setState({elementDescription : event.target._private.data });
     
//         console.log("G",this.props.denseElements)
//         this.cy.add(this.props.denseElements);
    }
    

    handleSetColorStyle=(event)=>{
        this.setState({colorStyle: event.label}, console.log(this.cy));
    }
    
    handleSetLabelStyle=(event)=>{
        this.setState({labelStyle: event.label}, console.log(this.cy));
    }
    
    handleSetSizeStyle=(event)=>{
        this.setState({sizeStyle: event.label}, console.log(this.cy));
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
    
    handleExportChange=(event)=>{
        this.setState({exportField : event.value})
    }
    
    styleLookup=(map, name)=>{
//         console.log("MN", map[name]);
        if(typeof(map[name]) !== 'undefined')
            return map[name];
        else
            return (new Array());
    }
    
    computeStyle=()=>{
        return [
            ...base,
            ...this.styleLookup(this.props.cstyle.colors, this.state.colorStyle),
            ...this.styleLookup(this.props.cstyle.labels, this.state.labelStyle),
            ...this.styleLookup(this.props.cstyle.sizes, this.state.sizeStyle)
        ]
    }
    
    generateLegendEdges=()=>{
        //If the color scheme is set to auto, use the generated state colorMapping
        if(this.state.colorStyle === "auto"){
//             return(this.state.colorMapEdges)
//             console.log([...this.state.colorMapBoth.keys()].filter(e => {return this.state.colorMapEdges.has(e)} ))
            return(new Map([...this.state.colorMapBoth].filter(e => {return this.state.colorMapEdges.has(e[0])} )))
        }
        else{ //Otherwise use the style provided legend names and colors
            let s = this.styleLookup(this.props.cstyle.colors, this.state.colorStyle);
            
            let colorMap = new Map();
            
            s.forEach(e => {
                if(e.hasOwnProperty('legendName') && (e.selector.search("edge\\[") !== -1 || e.selector.search("\\[") === 0))
                    colorMap.set(e.legendName, e.style['background-color']);
            })
            
            return colorMap;
        }
        
    }
    
    generateLegendNodes=()=>{
        
        //If the color scheme is set to auto, use the generated state colorMapping
        if(this.state.colorStyle === "auto")
//             return(this.state.colorMapNodes)
            
            return(new Map([...this.state.colorMapBoth].filter(e => {return this.state.colorMapNodes.has(e[0])} )))
        //
        else{ //Otherwise use the style provided legend names and colors
            let s = this.styleLookup(this.props.cstyle.colors, this.state.colorStyle);
            
            let colorMap = new Map();
            
            s.forEach(e => {
                if(e.hasOwnProperty('legendName') &&( e.selector.search("node\\[")!== -1 ||  e.selector.search("\\[") === 0))
                    colorMap.set(e.legendName, e.style['background-color']);
            })
            
            return colorMap;
        }
    }
    
    generateLegendShared=()=>{
        let s = this.styleLookup(this.props.cstyle.colors, this.state.colorStyle);
        
        let colorMap = new Map();
        
        s.forEach(e => {
            if(e.hasOwnProperty('legendNameBasic') )
                colorMap.set(e.legendNameBasic, e.style['background-color']);
        })
        
        return colorMap;
    }
    
    printJson=()=>{
        let w = window.open("","",[]);
        w.document.open();
        w.document.write(JSON.stringify(this.cy.json()));
        w.document.close();
    }
    
    renderExport(){
        return(
            <div className= "border" style={{width: '200px',margin:'5px 0px' }}>
                <Card.Body>
              
                    <Button style={{width:'100%', marginBottom:'5px'}} onClick={async () => {
                        await navigator.clipboard.writeText(this.cy.nodes('[nodeType = "Protein"]').map((e) => e._private.data[this.state.exportField]).join('\n'));
                    }}>Export Proteins</Button>
            
                
                    <div style={{ verticalAlign: 'middle'}}>
                        <Select 
                            options={[
                                {value: 'label', label: 'Uniprot'},
                                {value:  'pLabel', label: 'Name'}
                            ]}
                            onChange={this.handleExportChange}
                        />
                    </div>
                </Card.Body>
                
                    <Button style={{width:'100%', marginBottom:'5px'}} onClick={this.printJson}>Export Json</Button>
            
                
            </div>
        );
    }
    
    
    renderMainPaths=()=>{
//         this.props.elements= []
//         console.log("G", this.state.elementsLocal)
//         this.cy.remove(this.cy.elements());
//         console.log("FF", this.props.elements)
//         this.cy.add(this.props.elements)
//         this.cy.data(this.props.elements); 
    }
    

    
    renderLayout(){
    
        
        return(
            <div className="border" style={{padding: '5px', marginBottom:'5px'}}>
                <Button className="btn-secondary" style={{display: 'inline-block'}}
                    onClick={this.layout_fcose}
                >Layout</Button>
                
                <Button className="btn-secondary" style={{display: 'inline-block'}}
                    onClick={()=>{this.ur().undoAll()}}
                >Back</Button>
                
                
                <div className="" style={{marginLeft:'5px', display: 'inline-block', padding: '2px', verticalAlign: 'middle'}}>
                    {this.formatElementDescription()}
                </div>
            
            </div>
        );
    }
    
    render(){

//         {this.generateLegendNodes()}
        return(
        
            <Card className="rounded-0">
            <Card.Body>
            
                
                {this.renderLayout()}
            
            
                <CytoscapeComponent className="border cyClass"  cy={(cy) => {this.cy = cy}} elements={this.props.elements} stylesheet={ this.computeStyle() } style={ { width: '600px', height: '400px', marginBottom:'10px' } }/>
           
                <div style={{display: 'inline-block', verticalAlign: 'top', marginLeft:'5px'}}>
                <Card className="styleSelectorContainer rounded-0">
                    <Card.Body>
                    
                        {/*<label>Color</label>
                        <Select
                            options={Object.keys(this.props.cstyle.colors).map((e,i) => ({value: i, label: e }))}
                            onChange={this.handleSetColorStyle}
                            defaultValue={{label:this.state.colorStyle}}
                        />*/}
                    
                        <label style={{margin:'8px 0px'}}>Labels</label>
                        <Select
                            options={Object.keys(this.props.cstyle.labels).map((e,i) => ({value: i, label: e }))}
                            onChange={this.handleSetLabelStyle}
                            defaultValue={{label:this.state.labelStyle}}
                        />
                        
                        <label style={{margin:'8px 0px'}}>Terminal Sizes</label>
                        <Select
                            options={Object.keys(this.props.cstyle.sizes).map((e,i) => ({value: i, label: e }))}
                            onChange={this.handleSetSizeStyle}
                            defaultValue={{label:this.state.sizeStyle}}
                        />
                    </Card.Body>
                </Card>
           
                {/*this.renderExport()*/}
                </div>
                
                {/*<CytoscapeLegend edgeMap={this.state.colorMapEdges} nodeMap={this.state.colorMapNodes}/>*/}
                {this.props.elements.length > 0 ? <CytoscapeLegend basicMap={this.generateLegendShared()} edgeMap={this.generateLegendEdges()} nodeMap={this.generateLegendNodes()}/> : ""}
    
   
                
            </Card.Body>
            </Card>
          
           
        );
    }
}

export{CytoscapeCustom};
