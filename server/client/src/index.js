import { StrictMode} from 'react';

import 'bootstrap/dist/css/bootstrap.min.css';

import {Tab, Nav,} from 'react-bootstrap';

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

import {LabelSet, NodeData} from './graphStructs.js';
import {VersionCards, VersionCard} from './versionCards.js';

import './index.css';
import './sideBarMenu.css';



class GraphData{
    constructor(serverResponse){

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
//             this.vertexes = serverResponse.data.vertexData.map((e,i) => ({name: e.name, labels: e.labels, id: e.id}));
            this.labelsV = new LabelSet(serverResponse.data.labels.vertex.names);
            this.labelsE = new LabelSet(serverResponse.data.labels.edge);
            //Add the vertex label bits as plaintext
            this.vertexes.forEach((e) => (
                e.labelsPlainText = this.labelsV.bitsToNames(e.labels).map(
                    (ee) => (ee.name)
                ).join(" : ")
            ));

        }
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
//             activeVersionCard: 0,

            nodeData: new NodeData(),
            
            nodeLookup: new Map(),
            versionTagDisplay : new Map(),
            backAddr  : "192.168.1.19:9060"
        }
        
        var date = new Date();
         Axios.get('http://'+this.state.backAddr+'/ls', date.getTime()).then((response)=>{
             console.log("lsResponse", response)
          
            let serverProps = JSON.parse(response.data.serverProps);

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
//                 nodeLookup : nodeLookup,
                nodeData: new NodeData(response.data.nodes),
                elementNames: new ElementNames(response)

            }, () =>{console.log("initstate", this.state)})

         })
        
    }
    
    //TODO: Split the lookup and fill in nodeData from the handleSelect card
    handleNodeLookup=(names, afterLookupFn)=>{
//          return new Promise((resolve) =>{
            let queryNames = this.state.nodeData.filterKnown(names);
    
            //Only need to make request if names are unknown
            if(queryNames.length > 0){
                Axios.post('http://'+this.state.backAddr,JSON.stringify({cmd:"lkpn", names:queryNames})).then((response)=>{

                    console.log("R", response.data)
                    let nodeData = this.state.nodeData.update(queryNames, response.data);
                    
                    this.setState({nodeData: nodeData}, afterLookupFn

                    );
                })
            }
            else
            {
                afterLookupFn()
            }

    }
    
    handleNodeLookupIndex=(indexes, afterLookupFn)=>{
//          return new Promise((resolve) =>{
            let queryIndexes = this.state.nodeData.filterKnownIndex(indexes);
    
            //Only need to make request if names are unknown
            if(queryIndexes.length > 0){
                Axios.post('http://'+this.state.backAddr,JSON.stringify({cmd:"lkpi", ids:queryIndexes})).then((response)=>{

                    console.log("R", response.data)
                    let nodeData = this.state.nodeData.updateIndex(queryIndexes, response.data);
//                     
                    this.setState({nodeData: nodeData}, afterLookupFn

                    );
                })
            }
            else
            {
                afterLookupFn()
            }

    }

    
    handleAddVersionCard=()=>{

        let versionCardsO = this.state.versionCardsO;
//         versionCardsO.push();
        this.state.versionCardsO.handleAddVersionCard();
        
        this.setState({versionCardsO: versionCardsO});
    }
    
    handleRemoveVersionCard=()=>{
        
        if(this.state.versionCardsO.cards.length <= 1)
            return;

        let versionCardsO = this.state.versionCardsO;
//         versionCardsO.pop();
        this.state.versionCardsO.handleRemoveVersionCard();
        
        this.setState({
            versionCardsO: versionCardsO,
            activeVersionCard : Math.min(this.state.activeVersionCard, versionCardsO.cards.length-1)
        });
    }
    
    handleClickVersionCard=(id)=>{
         let versionCardsO = this.state.versionCardsO;
         this.state.versionCardsO.handleClickVersionCard(id);
        this.setState({versionCardsO: versionCardsO});
//         this.setState({activeVersionCard: id})
    }

    
    handleToggle=(name, cardId, elementId)=>{

        console.log("DB", name, cardId, elementId)
        let versionCardsO = this.state.versionCardsO;
        versionCardsO.cards[cardId].toggle(name,elementId);
        
        this.setState({versionCardsO: versionCardsO});
//         console.log("VC ", this.state.versionCardsO)
    }
    
    handleCheckToggle=(name,cardId, elementId)=>{
        return this.state.versionCardsO.cards[cardId][name].has(elementId);
//          return this.state[name][cardId].has(elementId);
    }
    
    handleSelect=(name, cardId, elementId)=>{
        if( elementId !== -1 & !this.state.versionCardsO.cards[cardId][name].has(elementId))
            this.handleToggle(name, cardId, elementId)
    }

    handleUpdateStats=(cardId, stats)=>{
        let versionCardsO = this.state.versionCardsO;

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
                <Tab.Container id="menu" defaultActiveKey="versions" >
                    
                    <div className=" border-right menuContainer bg-light">
                   
        
                        <div className=" text-dark sideElementHeading border-bottom">GraphView</div>
                                
                            
                            <Nav.Link eventKey="versions" className=" sideElement">Versions</Nav.Link>
                            <Nav.Link eventKey="labels" className=" sideElement">Labels</Nav.Link>
                            <Nav.Link eventKey="summary" className="sideElement" >Summary</Nav.Link>
                            
                        <div className=" text-dark sideElementHeading border-bottom">Queries</div>
                            <Nav.Link eventKey="nodes" className="sideElement">Nodes</Nav.Link>
                            <Nav.Link eventKey="query_rwr" className=" sideElement">RWR</Nav.Link>
                            <Nav.Link eventKey="query_motif" className=" sideElement">Motifs</Nav.Link>
                                
        
                       
                    </div>
                    
                    <div className= "displayPanel">
                        <Tab.Content>
                            <Tab.Pane eventKey="summary">
                                <InfoPanel
                                    backAddr={this.state.backAddr}
                                    activeVersionCard={this.state.versionCardsO.activeCard}
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
                                    activeVersionCard={this.state.versionCardsO.activeCard}
                                    
                                    
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
                                    activeVersionCard={this.state.versionCardsO.activeCard}
                                   
                                    versionCardsO={this.state.versionCardsO}
                                    elementNames = {this.state.elementNames}
                                /> 
                            </Tab.Pane>
                                     
                            <Tab.Pane eventKey="nodes">
                                <SelectNodesComponent 
                                    backAddr={this.state.backAddr}
                                    allNodes={this.state.graphData.data.vertexData} 
                                    nodeData={this.state.nodeData}
                                    
                                    handleCheckToggle={this.handleCheckToggle}
                                    handleToggle={this.handleToggle}
                                    handleSelect={this.handleSelect}

                                    
                                    
                                    handleAddVersionCard = {this.handleAddVersionCard}
                                    handleRemoveVersionCard = {this.handleRemoveVersionCard}
                                    handleClickVersionCard = {this.handleClickVersionCard}
                                    activeVersionCard={this.state.versionCardsO.activeCard}
                                    
                                    handleNodeLookup={this.handleNodeLookup}
                                    
                                    versionCardsO={this.state.versionCardsO}
                                    nodeLookup={this.state.nodeLookup}
                                    elementNames = {this.state.elementNames}
                                    
                                />
                                
                            </Tab.Pane>
                        
                            <Tab.Pane eventKey="query_rwr">
                                <QueryComponentRWR
                                    backAddr={this.state.backAddr}
                                    selectedVersions={this.state.versions_s}  
                                
                                    handleNodeLookupIndex={this.handleNodeLookupIndex}
                                    
                                    nodeData = {this.state.nodeData}
                                    
                                    selectedVertexLabels={this.state.labelsV_s}
                                    selectedEdgeLabels={this.state.labelsE_s}
                                    selectedNodes={this.state.nodes_s}
                                    
                                    versionCardsO={this.state.versionCardsO}
                                    activeVersionCard={this.state.versionCardsO.activeCard}
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
            <StrictMode> 
               
                <div className= "fixed-top border-bottom titleBar bg-dark">
                </div>
                
     
                <div className= "displayPanel2">
                    {this.renderMainPanel5()}
                </div>


            </StrictMode> 
        );
    }
    
}

ReactDOM.render(
<App />,
document.getElementById('root')
);
