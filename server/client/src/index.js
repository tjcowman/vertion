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

class App extends React.Component {
    constructor(props){
        super(props);
        this.state={
            activePanel: 'main',
            versionCards: [0],
            activeVersionCard: 0,
            graphData: new GraphData(),

            serverProps : {},
            
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
            
//             let allVertexLabels1 = new Set(Array(response.data.labels.vertex.names.length).keys());
//             let allEdgeLabels1 = new  Set(Array(response.data.labels.edge.length).keys());
            
            
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
            
//             console.log(versionTagDisplay)
            
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
    
    

    setData=(serverResponse)=>{
        let nodeLookup = new Map();
        
        serverResponse.vertexData.forEach((e) =>(
                nodeLookup.set(e.name, e.id)
        ));

        this.setState({
            graphData: new GraphData(serverResponse),
//             versions_s : new SelectedVersions(serverResponse.versions),
            nodeLookup : nodeLookup
        });
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
        
        this.setState({
            versionCards: versionCards,
             
            versions_s: versions_s,
            
            nodes_s :  nodes_s,
            labelsV_s : labelsV_s,
            labelsE_s : labelsE_s,
        })
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
         
        this.setState({
            activeVersionCard: activeVersionCard,
            
            versionCards: versionCards,
             
            versions_s: versions_s,
            
            nodes_s :  nodes_s,
            labelsV_s : labelsV_s,
            labelsE_s : labelsE_s,
        })
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
                    
        this.setState({[name] : ns});
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
    
    renderSideMenu(){
        return(
            <Card className="versionPanel">
                <InfoPanel isSelected={this.isSelected}  getLabels={this.getLabels}  setData={this.setData} />
            </Card>
        );
        
    }
    
    

    renderMainPanel2(){
       
        
          switch(this.state.activePanel){
                case 'main': return (
                    <InfoPanel
                        vertexLabelNames={this.state.graphData.data.labels.vertex}
                        edgeLabelNames={this.state.graphData.data.labels.edge}
                        selectedVersions={this.state.versions_s}  
                        selectedVertexLabels={this.state.labelsV_s}
                        selectedEdgeLabels={this.state.labelsE_s}                   
                    
                        versionCards={this.state.versionCards}
                    />
                    
                    
                       
                )
                case 'versions': return (
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
                )
                case 'labels': return(
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
                    
                )
                case 'query_rwr': return(
                        <QueryComponentRWR
                            selectedVersions={this.state.versions_s}  
                            getVertexDataRow={this.getVertexDataRow} 
                            getLabels={this.getLabels} 
                            selectedVertexLabels={this.state.labelsV_s}
                            selectedEdgeLabels={this.state.labelsE_s}
                            selectedNodes={this.state.nodes_s}
                        />
                )
                case 'query_motif' :return(
                                    
                     <QueryComponentMotif 
                            selectedVersions={this.state.versions_s}  
                            getVertexDataRow={this.getVertexDataRow}
                            getLabels={this.getLabels} 
                             selectedNodes={this.state.nodes_s}
                        />
                )
                case 'nodes': return(

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

                              )
                    
                
          }
         
        
    }
    
    renderMainPanel3(){
        let d_infoPanel= (this.state.activePanel=="main");
        let d_nodes= (this.state.activePanel=="nodes");
        
        return(
            <>
             {(d_infoPanel) ? <InfoPanel
                        vertexLabelNames={this.state.graphData.data.labels.vertex}
                        edgeLabelNames={this.state.graphData.data.labels.edge}
                        selectedVersions={this.state.versions_s}  
                        selectedVertexLabels={this.state.labelsV_s}
                        selectedEdgeLabels={this.state.labelsE_s}                   
                        versionCards={this.state.versionCards}
                    /> : null}
                    
           { (d_nodes) ?  <SelectNodesComponent 
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
                    /> : null}
                    </>
        )
    }
    
    renderMainPanel4(){
        return(

            <Tabs defaultActiveKey="main" id="test">
            <Tab eventKey="main" title="main">
            <InfoPanel
                        vertexLabelNames={this.state.graphData.data.labels.vertex}
                        edgeLabelNames={this.state.graphData.data.labels.edge}
                        selectedVersions={this.state.versions_s}  
                        selectedVertexLabels={this.state.labelsV_s}
                        selectedEdgeLabels={this.state.labelsE_s}                   
                        versionCards={this.state.versionCards}
                    />
            </Tab>
            <Tab eventKey="nodes" title="nodes">
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
            </Tab>
            </Tabs>
        )
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
    
    renderSideBar(){
        return(
                        
            
                <ListGroup>
                    <ListGroup.Item className=" text-dark sideElementHeading border-bottom">
                        GraphView
                    </ListGroup.Item >
                     <ListGroup.Item onClick={(e)=>this.handleSideMenuClick("main")} className=" btn text-muted sideElement">
                        Main
                    </ListGroup.Item>
                    <ListGroup.Item   onClick={(e)=>this.handleSideMenuClick("versions")} className=" btn text-muted sideElement">
                        Versions
                    </ListGroup.Item>
                    <ListGroup.Item  onClick={(e)=>this.handleSideMenuClick("labels")} className="btn text-muted sideElement">
                        Labels
                    </ListGroup.Item>
                    <ListGroup.Item className=" text-dark sideElementHeading border-bottom">
                        Queries
                    </ListGroup.Item>
                    <ListGroup.Item  onClick={(e)=>this.handleSideMenuClick("nodes")} className="btn text-muted sideElement">
                        Nodes
                    </ListGroup.Item>
                    <ListGroup.Item  onClick={(e)=>this.handleSideMenuClick("query_rwr")} className="btn text-muted sideElement">
                        RWR
                    </ListGroup.Item>
                    <ListGroup.Item  onClick={(e)=>this.handleSideMenuClick("query_motif")} className="btn text-muted sideElement">
                        Motifs
                    </ListGroup.Item>
                </ListGroup>
          
        );
    }
    
    render(){
//         console.log("RE", this.state.graphData.vertexData)
        return(
            <div> 
               
                <div className= "fixed-top border-bottom titleBar bg-dark">

                </div>
                
             
            {/*<div className="mainContent" >*/}
                {/*<div className=" border-right menuContainer bg-light" >  
            
                    this.renderSideBar()
                    
                </div>*/}
                
                <div className= "displayPanel2">
                    {this.renderMainPanel5()}
                </div>
            {/*</div>*/}
               


            </div> 
        );
    }
    
}

ReactDOM.render(
<App />,
document.getElementById('root')
);
