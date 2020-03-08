import 'bootstrap/dist/css/bootstrap.min.css';

import {Tabs,Tab, Card, Navbar, Nav, Form, FormControl, Button, ListGroup, Col} from 'react-bootstrap';

import React from 'react';
import ReactDOM from 'react-dom'; 
// import Axios from 'axios';
import Axios from 'axios';

import {InfoPanel} from  './infoPanel.js';

import SelectVersionsComponent from './selectVersionsComponent.js';
import SelectNodesComponent from './selectNodesComponent.js';
import {SelectLabelsComponent} from './selectLabelsComponent.js'

import {QueryComponentRWR} from './queryComponentRWR.js';
import QueryComponentMotif from './queryComponentMotif.js';


import './index.css';
import './sideBarMenu.css';

class LabelSet{
    constructor(names){
        this.names = names;
//         this.urls = 
    }
    
    bitsToArray(labelBits){
        let indexes = [];
        for(let i=0; i<this.names.length; ++i) {
            if (labelBits & 0x1)
                indexes.push(i);
        
            labelBits = labelBits >> 1;
        }
        return indexes;
    }
  
    arrayToNames(labelArray){
        let names=[];

        for(let e in labelArray)
            names.push(this.names[labelArray[e]]);
            
        return names;
    }
    
    bitsToNames(labelBits){
        return this.arrayToNames(this.bitsToArray(labelBits));
    }
  
}



class GraphData{
    constructor(serverResponse){
//         console.log(serverResponse)
        
        this.data={
            labelNames: {
                vertex: [],
                edge: [],
            },
            
            labels: {
                vertex: new LabelSet([]),
                edge: new LabelSet([])
                
            },
            versions: [],
            vertexData: []
            
        }
        

        if(typeof serverResponse !== 'undefined'){
            this.data.labels.vertex = new LabelSet(serverResponse.labels.vertex.names);
            this.data.labels.edge = new LabelSet(serverResponse.labels.edge);
            this.data.versions = serverResponse.versions;
            this.data.vertexData = serverResponse.vertexData;
            
            this.data.vertexData.forEach((e) => e.labelsNames =  this.data.labels.vertex.bitsToNames(e.labels));
            this.data.labelNames = {
                vertex : serverResponse.labels.vertex.names.map((e,i)=>({index : i, name : e})),
                edge : serverResponse.labels.edge.map((e,i)=>({index : i, name : e}))
            }
            

        }

    }
  

}

//Holds the plaintext representations of each element index 
class ElementNames{
    constructor(serverResponse){
        this.versions = [];
        this.vertexes = [];
        this.labelsV = new LabelSet();
        this.labelsE = new LabelSet();
        
        
        if(typeof serverResponse !== 'undefined'){
            this.versions = serverResponse.data.versions.map((e) => ({name:e.name, tags:e.tags}));
            this.vertexes = serverResponse.data.vertexData.map((e) => ({name: e.name, labels: e.labels}));
            this.labelsV = new LabelSet(serverResponse.data.labels.vertex.names);
            this.labelsE = new LabelSet(serverResponse.data.labels.edge);
            //Convert the vertex label bits to plaintext
            this.vertexes.forEach((e) => (e.labels = this.labelsE.bitsToNames(e.labels)));
        }
    }
    
    
    
}

class VersionCard{
    constructor(){
        this.isStale = false;
        this.versions_s = new Set();          
        this.nodes_s =  new Set();
        this.labelsV_s = new Set();
        this.labelsE_s = new Set();
    }
    
    toggle=(name, elementId)=>{

        let ns = this[name];
                    
        if(this[name].has(elementId)){
            ns.delete(elementId);
        }
        else{
            ns.add(elementId);
        }

        
        this[name] = ns;
        this.isStale = true;
    
    }
    
    checkToggle=(name, elementId)=>{
         return this[name].has(elementId);
    }
    
}

class VersionCards{
    constructor(){
        this.cards = [new VersionCard()];
    }
    
    
    push=()=>{
        this.cards.push(new VersionCard());

    }
    
    pop=()=>{
        this.cards.pop();
    }
    
}

class App extends React.Component {
    constructor(props){
        super(props);
        this.state={
            graphData: new GraphData(),

            serverProps : {},
            
            versionCardsO: new VersionCards(),
            elementNames: new ElementNames(),
            
            versionCards: [0],
            staleCards: [false],
            activeVersionCard: 0,

            
            
            nodeLookup: new Map(),
            versionTagDisplay : new Map(),
        }
        
        var date = new Date();
         Axios.get('http://localhost:9060/ls', date.getTime()).then((response)=>{
             console.log("lsResponse", response)
          
            let nodeLookup = new Map();
            

            let serverProps = JSON.parse(response.data.serverProps);
            
            response.data.vertexData.forEach((e) =>(
                nodeLookup.set(e.name, e.id)
            ));

            let allVertexLabels0 = new Set(Array(response.data.labels.vertex.names.length).keys());
            let allEdgeLabels0 = new  Set(Array(response.data.labels.edge.length).keys());
            
            let versionTagDisplay = new Map();
            response.data.versions.forEach((e) => {
                e.tags.forEach((t) => {
//                     console.log(t)
                    if (!versionTagDisplay.has(t)){
                        versionTagDisplay.set(t,  [])
                    }
                    versionTagDisplay.get(t).push({index: e.index, name: e.name})
                })
                
            });
            
            
            this.setState({
                serverProps : serverProps,
                versionTagDisplay: versionTagDisplay,
                graphData: new GraphData(response.data),
                nodeLookup : nodeLookup,
                elementNames: new ElementNames(response)

            }, () =>{console.log("initstate", this.state)})

         })
        
    }
    
    markCardFresh=(cardId)=>{
        let staleCards =[...this.state.staleCards];
        staleCards[cardId] = false;
        
        this.setState({staleCards: staleCards});
    }
    
    handleAddVersionCard=()=>{

        let versionCardsO = this.state.versionCardsO;
        versionCardsO.push();
        
        this.setState({versionCardsO: versionCardsO});
    }
    
    handleRemoveVersionCard=()=>{
        
        if(this.state.versionCards.length <= 1)
            return;

        let versionCardsO = this.state.versionCardsO;
        versionCardsO.pop();
        
        this.setState({versionCardsO: versionCardsO});
    }
    
    handleClickVersionCard=(id)=>{
        this.setState({activeVersionCard: id})
    }

    handleToggle=(name, cardId, elementId)=>{

        let versionCardsO = this.state.versionCardsO;
        versionCardsO.cards[cardId].toggle(name,elementId);
        
        this.setState({versionCardsO: versionCardsO});
        console.log("VC ", this.state.versionCardsO)
    }
    
    handleCheckToggle=(name,cardId, elementId)=>{
        return this.state.versionCardsO.cards[cardId][name].has(elementId);
//          return this.state[name][cardId].has(elementId);
    }
    

    
    getLabels = () => {
        return [this.state.graphData.data.labels.vertex, this.state.graphData.data.labels.edge]
    }
    

    getVertexDataRow=(rowIndex)=>{
        return this.state.graphData.data.vertexData[rowIndex];
    }


    renderMainPanel5(){
        return(
            <div className="mainContent">
                <Tab.Container id="menu" defaultActiveKey="main" >
                    
                    <div className=" border-right menuContainer bg-light">
                   
        
                        <div className=" text-dark sideElementHeading border-bottom">GraphView</div>
                                
                            <Nav.Link eventKey="main" className="text-muted sideElement" >Main</Nav.Link>
                            <Nav.Link eventKey="versions" className="text-muted sideElement">Versions</Nav.Link>
                            <Nav.Link eventKey="labels" className="text-muted sideElement">Labels</Nav.Link>
                            
                        <div className=" text-dark sideElementHeading border-bottom">Queries</div>
                            <Nav.Link eventKey="nodes" className="text-muted sideElement">Nodes</Nav.Link>
                            <Nav.Link eventKey="query_rwr" className="text-muted sideElement">RWR</Nav.Link>
                            <Nav.Link eventKey="query_motif" className="text-muted sideElement">Motifs</Nav.Link>
                                
        
                       
                    </div>
                    
                    <div className= "displayPanel">
                        <Tab.Content>
                            <Tab.Pane eventKey="main">
                                <InfoPanel
                                vertexLabelNames={this.state.graphData.data.labels.vertex}
                                edgeLabelNames={this.state.graphData.data.labels.edge}
                                   
                                staleCards={this.state.staleCards}
                                markCardFresh={this.markCardFresh}
                                
                                activeVersionCard={this.state.activeVersionCard}
                                handleClickVersionCard = {this.handleClickVersionCard}
                                versionCards={this.state.versionCards}
                            />
                            </Tab.Pane>
                            
                            <Tab.Pane eventKey="versions">
                                <SelectVersionsComponent 
                                    versionData={this.state.graphData.data.versions}
                                    versionTagDisplay={this.state.versionTagDisplay}

                                    handleCheckToggle={this.handleCheckToggle}
                                    handleToggle={this.handleToggle}
                                    
                                    handleAddVersionCard = {this.handleAddVersionCard}
                                    handleRemoveVersionCard = {this.handleRemoveVersionCard}
                                    handleClickVersionCard = {this.handleClickVersionCard}
                                    activeVersionCard={this.state.activeVersionCard}
                                    
                                    
                                    versionCardsO={this.state.versionCardsO}
                                    elementNames = {this.state.elementNames}
                                />
                            </Tab.Pane>
                   
                            <Tab.Pane eventKey="labels">
                                <SelectLabelsComponent
                                    vertexLabels={this.state.graphData.data.labelNames.vertex}
                                    edgeLabels={this.state.graphData.data.labelNames.edge}
                                    selectedVertexLabels={this.state.labelsV_s}
                                    selectedEdgeLabels={this.state.labelsE_s}
                                    
                                    handleCheckToggle={this.handleCheckToggle}
                                    handleToggle={this.handleToggle}
                                    
                                    handleAddVersionCard = {this.handleAddVersionCard}
                                    handleRemoveVersionCard = {this.handleRemoveVersionCard}
                                    handleClickVersionCard = {this.handleClickVersionCard}
                                    activeVersionCard={this.state.activeVersionCard}
                                   
                                    versionCardsO={this.state.versionCardsO}
                                /> 
                            </Tab.Pane>
                                     
                            <Tab.Pane eventKey="nodes">
                                <SelectNodesComponent 
                                    allNodes={this.state.graphData.data.vertexData} 
                                    
                                    handleCheckToggle={this.handleCheckToggle}
                                    handleToggle={this.handleToggle}
                                    handleSelect={this.handleSelect}


                                    nodeLookup={this.state.nodeLookup}
                                    
                                    handleAddVersionCard = {this.handleAddVersionCard}
                                    handleRemoveVersionCard = {this.handleRemoveVersionCard}
                                    handleClickVersionCard = {this.handleClickVersionCard}
                                    activeVersionCard={this.state.activeVersionCard}
                                    versionCards={this.state.versionCards}
                                    
                                    versionCardsO={this.state.versionCardsO}
                                    
                                />
                                
                            </Tab.Pane>
                        
                            <Tab.Pane eventKey="query_rwr">
                                <QueryComponentRWR
                                    selectedVersions={this.state.versions_s}  
                                    getVertexDataRow={this.getVertexDataRow} 
                                    getLabels={this.getLabels} 
                                    selectedVertexLabels={this.state.labelsV_s}
                                    selectedEdgeLabels={this.state.labelsE_s}
                                    selectedNodes={this.state.nodes_s}
                                />
                            </Tab.Pane>
                                {/*
                            <Tab.Pane eventKey="query_motif">
                                <QueryComponentMotif 
                                    selectedVersions={this.state.versions_s}  
                                    getVertexDataRow={this.getVertexDataRow}
                                    getLabels={this.getLabels} 
                                    selectedNodes={this.state.nodes_s}
                                />
                            </Tab.Pane>
                            */}
                            
                        </Tab.Content>
                        
                    
                    </div>
                    
                </Tab.Container>
            </div>
        );
        
    }
    

    
    render(){
//         console.log("RE", this.state.graphData.vertexData)
        return(
            <div> 
               
                <div className= "fixed-top border-bottom titleBar bg-dark">
                </div>
                
     
                <div className= "displayPanel2">
                    {this.renderMainPanel5()}
                </div>


            </div> 
        );
    }
    
}

ReactDOM.render(
<App />,
document.getElementById('root')
);
