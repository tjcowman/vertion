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
        this.names = []
        
        if(typeof names != 'undefined'){
            this.names = names.map((e)=>({name:e}));
        }
        
        console.log("TDN", this.names);
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
  
    bitsToNamesFlat(labelBits){
        return this.bitsToNames(labelBits).map((e)=>(e.name));
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
            this.vertexes = serverResponse.data.vertexData.map((e,i) => ({name: e.name, labels: e.labels, id: e.id}));
            this.labelsV = new LabelSet(serverResponse.data.labels.vertex.names);
            this.labelsE = new LabelSet(serverResponse.data.labels.edge);
            //Add the vertex label bits as plaintext
            this.vertexes.forEach((e) => (
                e.labelsPlainText = this.labelsV.bitsToNames(e.labels).map(
                    (ee) => (ee.name)
                ).join(" : ")
            ));
            console.log("WUT", this)
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
        
        this.stats = {
            nodes: [
                
            ],
            edges: [
                
            ]
        };
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
            
            //Combine in versionCards?
           
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

//             let allVertexLabels0 = new Set(Array(response.data.labels.vertex.names.length).keys());
//             let allEdgeLabels0 = new  Set(Array(response.data.labels.edge.length).keys());
            
            let versionTagDisplay = new Map();
            response.data.versions.forEach((e) => {
                e.tags.forEach((t) => {
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
    

    
    handleAddVersionCard=()=>{

        let versionCardsO = this.state.versionCardsO;
        versionCardsO.push();
        
        this.setState({versionCardsO: versionCardsO});
    }
    
    handleRemoveVersionCard=()=>{
        
        if(this.state.versionCardsO.cards.length <= 1)
            return;

        let versionCardsO = this.state.versionCardsO;
        versionCardsO.pop();
        
        this.setState({
            versionCardsO: versionCardsO,
            activeVersionCard : Math.min(this.state.activeVersionCard, versionCardsO.cards.length-1)
        });
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
    

    handleUpdateStats=(cardId, stats)=>{
        
        console.log("HUSS", stats,this.state)
        let versionCardsO = this.state.versionCardsO;
        console.log("VCUS", this.state.versionCardsO, versionCardsO)
        versionCardsO.cards[cardId].stats = stats;
        versionCardsO.cards[cardId].isStale=false;
        
        //I think this handles making sure it doesnt set stale false with old selection values
        this.setState((prevState) =>({versionCardsO: versionCardsO}));
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
                                
                            <Nav.Link eventKey="main" className="sideElement" >Main</Nav.Link>
                            <Nav.Link eventKey="versions" className=" sideElement">Versions</Nav.Link>
                            <Nav.Link eventKey="labels" className=" sideElement">Labels</Nav.Link>
                            
                        <div className=" text-dark sideElementHeading border-bottom">Queries</div>
                            <Nav.Link eventKey="nodes" className="sideElement">Nodes</Nav.Link>
                            <Nav.Link eventKey="query_rwr" className=" sideElement">RWR</Nav.Link>
                            <Nav.Link eventKey="query_motif" className=" sideElement">Motifs</Nav.Link>
                                
        
                       
                    </div>
                    
                    <div className= "displayPanel">
                        <Tab.Content>
                            <Tab.Pane eventKey="main">
                                <InfoPanel
                                    activeVersionCard={this.state.activeVersionCard}
                                    handleClickVersionCard = {this.handleClickVersionCard}
                                    handleUpdateStats= {this.handleUpdateStats}
                    
                                    
                                    versionCardsO={this.state.versionCardsO}
                                    elementNames = {this.state.elementNames}
                            />
                            </Tab.Pane>
                            
                            <Tab.Pane eventKey="versions">
                                <SelectVersionsComponent 
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
                                     
                            <Tab.Pane eventKey="nodes">
                                <SelectNodesComponent 
                                    allNodes={this.state.graphData.data.vertexData} 
                                    
                                    handleCheckToggle={this.handleCheckToggle}
                                    handleToggle={this.handleToggle}
                                    handleSelect={this.handleSelect}


                                    
                                    handleAddVersionCard = {this.handleAddVersionCard}
                                    handleRemoveVersionCard = {this.handleRemoveVersionCard}
                                    handleClickVersionCard = {this.handleClickVersionCard}
                                    activeVersionCard={this.state.activeVersionCard}
                                    
                                    
                                    versionCardsO={this.state.versionCardsO}
                                    nodeLookup={this.state.nodeLookup}
                                    elementNames = {this.state.elementNames}
                                    
                                />
                                
                            </Tab.Pane>
                        
                            <Tab.Pane eventKey="query_rwr">
                                <QueryComponentRWR
                                    selectedVersions={this.state.versions_s}  
                                
                                    
                                    
                                    selectedVertexLabels={this.state.labelsV_s}
                                    selectedEdgeLabels={this.state.labelsE_s}
                                    selectedNodes={this.state.nodes_s}
                                    
                                    versionCardsO={this.state.versionCardsO}
                                     activeVersionCard={this.state.activeVersionCard}
                                    elementNames = {this.state.elementNames}
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
