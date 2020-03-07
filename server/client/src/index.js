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
        
// console.log(serverResponse)
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
            
            
//              console.log("TH", this)
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
            
            versionCards: [0],
            staleCards: [false],
            activeVersionCard: 0,
            versions_s : [new Set()],            
            nodes_s :  [new Set()],
            labelsV_s : [new Set()],
            labelsE_s : [new Set()],
            
            
            nodeLookup: new Map(),
            versionTagDisplay : new Map(),
        }
        
        var date = new Date();
         Axios.get('http://localhost:9060/ls', date.getTime()).then((response)=>{
             console.log("lsResponse", response)
             
            let nodeLookup = new Map();
            
//             console.log(response.serverProp)
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
                labelsV_s : [allVertexLabels0],
                labelsE_s : [allEdgeLabels0],
                nodeLookup : nodeLookup
                //Array(response.data.labels.vertex.names.length).keys()
            }, () =>{console.log("initstate", this.state)})

         })
        
    }
    
    markCardFresh=(cardId)=>{
        let staleCards =[...this.state.staleCards];
        staleCards[cardId] = false;
        
        this.setState({staleCards: staleCards});
    }
    
    handleAddVersionCard=()=>{
        console.log(this.state.versionCards)
        let versionCards = [...this.state.versionCards]
        versionCards.push(this.state.versionCards.length);
        
        let allVertexLabels = new Set(Array(this.state.graphData.data.labels.vertex.names.length).keys());
        let allEdgeLabels = new Set(Array(this.state.graphData.data.labels.edge.names.length).keys());
//         Array(response.data.labels.edge.names.length).keys()
        
        let versions_s = [...this.state.versions_s];
        versions_s.push(new Set());
        let nodes_s = [...this.state.nodes_s];
        nodes_s.push(new Set());
        let labelsV_s =  [...this.state.labelsV_s];
        labelsV_s.push(allVertexLabels);
        let labelsE_s =  [...this.state.labelsE_s];
        labelsE_s.push(allEdgeLabels);
        
        let staleCards =[...this.state.staleCards];
        staleCards.push(false);
         
        this.setState({
            versionCards: versionCards,
            staleCards: staleCards,
            versions_s: versions_s,
            
            nodes_s :  nodes_s,
            labelsV_s : labelsV_s,
            labelsE_s : labelsE_s,
        })
        
        let versionCardsO = this.state.versionCardsO;
        versionCardsO.push();
        
        this.setState({versionCardsO: versionCardsO});
    }
    
    handleRemoveVersionCard=()=>{
        
        if(this.state.versionCards.length <= 1)
            return;
//         if(this.state.activeVersionCard = this.state.versionCards.length)
        let activeVersionCard = Math.min(this.state.activeVersionCard, this.state.versionCards.length-2 );
        
        let versionCards = [...this.state.versionCards];
        versionCards.pop();
        let versions_s = [...this.state.versions_s];
        versions_s.pop();
        let nodes_s = [...this.state.nodes_s];
        nodes_s.pop();
        let labelsV_s =  [...this.state.labelsV_s];
        labelsV_s.pop();
        let labelsE_s =  [...this.state.labelsE_s];
        labelsE_s.pop();
         
        let staleCards =[...this.state.staleCards];
        staleCards.pop();
        
        this.setState({
            activeVersionCard: activeVersionCard,
             staleCards: staleCards,
            versionCards: versionCards,
             
            versions_s: versions_s,
            
            nodes_s :  nodes_s,
            labelsV_s : labelsV_s,
            labelsE_s : labelsE_s,
        })
        
        let versionCardsO = this.state.versionCardsO;
        versionCardsO.pop();
        
        this.setState({versionCardsO: versionCardsO});
    }
    
    handleClickVersionCard=(id)=>{
        this.setState({activeVersionCard: id})
    }

    handleToggle=(name, cardId, elementId)=>{
//         console.log(this.state[name])
        let ns = this.state[name];
                    
        if(this.state[name][cardId].has(elementId)){
            ns[cardId].delete(elementId);
        }
        else{
            ns[cardId].add(elementId);
        }
                    
        let staleCards =[...this.state.staleCards];
        staleCards[ cardId] = true;
        
        this.setState({
            [name] : ns,
            staleCards: staleCards,
        });
        
        let versionCardsO = this.state.versionCardsO;
        versionCardsO.cards[cardId].toggle(name,elementId);
        
        this.setState({versionCardsO: versionCardsO});
        console.log("VC ", this.state.versionCardsO)
    }
    
    handleCheckToggle=(name,cardId, elementId)=>{
         return this.state[name][cardId].has(elementId);
    }
    
    selectLabels=(set, versionIds)=>{
//         console.log("S")
        let newCounts = this.state.versions_n;
        newCounts[set] = newCounts[set] + versionIds.length;
        
        this.setState(prevState => {
             versions_s : versionIds.forEach(prevState.versions_s[set].add, prevState.versions_s[set])
            
        });
        
        this.setState({ versions_n : newCounts});
    }
   
    
    
    getLabels = () => {
        return [this.state.graphData.data.labels.vertex, this.state.graphData.data.labels.edge]
    }
    

    getVertexDataRow=(rowIndex)=>{
        return this.state.graphData.data.vertexData[rowIndex];
    }

    
    handleSideMenuClick=(name)=>{

        this.setState({activePanel : name});
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
                                selectedVersions={this.state.versions_s}  
                                selectedVertexLabels={this.state.labelsV_s}
                                selectedEdgeLabels={this.state.labelsE_s}                   
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
                                    selectedVersions={this.state.versions_s}
                                    handleCheckToggle={this.handleCheckToggle}
                                    handleToggle={this.handleToggle}
                                    
                                    handleAddVersionCard = {this.handleAddVersionCard}
                                    handleRemoveVersionCard = {this.handleRemoveVersionCard}
                                    handleClickVersionCard = {this.handleClickVersionCard}
                                    activeVersionCard={this.state.activeVersionCard}
                                    versionCards={this.state.versionCards}
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
                                    versionCards={this.state.versionCards}
                                /> 
                            </Tab.Pane>
                            <Tab.Pane eventKey="nodes">
                                <SelectNodesComponent 
                                    allNodes={this.state.graphData.data.vertexData} 
                                    
                                    handleCheckToggle={this.handleCheckToggle}
                                    handleToggle={this.handleToggle}
                                    handleSelect={this.handleSelect}

                                    selectedNodes={this.state.nodes_s}
                                    nodeLookup={this.state.nodeLookup}
                                    
                                    handleAddVersionCard = {this.handleAddVersionCard}
                                    handleRemoveVersionCard = {this.handleRemoveVersionCard}
                                    handleClickVersionCard = {this.handleClickVersionCard}
                                    activeVersionCard={this.state.activeVersionCard}
                                    versionCards={this.state.versionCards}
                                    
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
                            <Tab.Pane eventKey="query_motif">
                                <QueryComponentMotif 
                                    selectedVersions={this.state.versions_s}  
                                    getVertexDataRow={this.getVertexDataRow}
                                    getLabels={this.getLabels} 
                                    selectedNodes={this.state.nodes_s}
                                />
                            </Tab.Pane>
                            
                            
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
