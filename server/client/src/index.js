import 'bootstrap/dist/css/bootstrap.min.css';

import {Tabs,Tab, Card} from 'react-bootstrap';

import React from 'react';
import ReactDOM from 'react-dom'; 
// import Axios from 'axios';
import Axios from 'axios';

import InfoPanel from  './infoPanel.js';

import SelectVersionsComponent from './selectVersionsComponent.js';
import SelectNodesComponent from './selectNodesComponent.js';
import {SelectLabelsComponent} from './selectLabelsComponent.js'

import {QueryComponentRWR} from './queryComponentRWR.js';
import QueryComponentMotif from './queryComponentMotif.js';


import './index.css';

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
        
console.log(serverResponse)
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
            graphData: new GraphData(),
//             versions_s : new SelectedVersions(),
            versions_s : [new Set(), new Set()],
            
            nodes_s :  [new Set(), new Set()],
            labelsV_s : [new Set(), new Set()],
            labelsE_s : [new Set(), new Set()],
            nodeLookup: new Map(),
        }
        
        var date = new Date();
         Axios.get('http://localhost:9060/ls', date.getTime()).then((response)=>{
//              console.log(response)
             
            let nodeLookup = new Map();
    
            response.data.vertexData.forEach((e) =>(
                nodeLookup.set(e.name, e.id)
            ));

            let allVertexLabels0 = new Set(Array(response.data.labels.vertex.names.length).keys());
            let allEdgeLabels0 = new  Set(Array(response.data.labels.edge.length).keys());
            
            let allVertexLabels1 = new Set(Array(response.data.labels.vertex.names.length).keys());
            let allEdgeLabels1 = new  Set(Array(response.data.labels.edge.length).keys());
            
            this.setState({
                graphData: new GraphData(response.data),
                labelsV_s : [allVertexLabels0, allVertexLabels1],
                labelsE_s : [allEdgeLabels0, allEdgeLabels1],
                nodeLookup : nodeLookup
                //Array(response.data.labels.vertex.names.length).keys()
            })

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
    

    handleToggle=(name, cardId, elementId)=>{
        console.log(this.state[name])
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
        console.log("S")
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

    
    renderSideMenu(){
        return(
            <Card className="versionPanel">
                <InfoPanel isSelected={this.isSelected}  getLabels={this.getLabels}  setData={this.setData} />
            </Card>
        );
        
    }
    
    renderMainPanel(){
        return(
             <Tabs defaultActiveKey="info" id="mainTab" >
                
                    <Tab eventKey="info" title="VGraph">
                        <Card className="mainPanel">
                            
                        </Card>
                    </Tab>
                
                    <Tab eventKey="selectVersions" title="Versions">
                        <Card className="mainPanel">
                            <SelectVersionsComponent 
                                versionData={this.state.graphData.data.versions}
                                selectedVersions={this.state.versions_s}
                                handleCheckToggle={this.handleCheckToggle}
                                handleToggle={this.handleToggle}
                        />
                        </Card>
                    </Tab>
                  
                    <Tab eventKey="selectLabels" title="Labels">
                        <Card className="mainPanel">
                        
                            <SelectLabelsComponent
                                vertexLabels={this.state.graphData.data.labelNames.vertex}
                                edgeLabels={this.state.graphData.data.labelNames.edge}
                                selectedVertexLabels={this.state.labelsV_s}
                                selectedEdgeLabels={this.state.labelsE_s}
                                
                                handleCheckToggle={this.handleCheckToggle}
                                handleToggle={this.handleToggle}
                            /> 
                        </Card>
                    </Tab>
                  
                   
                    <Tab eventKey="selectNodes" title="Nodes">
                        <Card className="mainPanel">
                            <SelectNodesComponent 
                                allNodes={this.state.graphData.data.vertexData} 
                                
                                handleCheckToggle={this.handleCheckToggle}
                                handleToggle={this.handleToggle}
                                handleSelect={this.handleSelect}

                                selectedNodes={this.state.nodes_s}
                                nodeLookup={this.state.nodeLookup}
                                
                            />
                        </Card>
                    </Tab>
                    
           
                    <Tab eventKey="query_rwr" title="RWR">
                    <Card className="mainPanel">
                        <QueryComponentRWR
                            selectedVersions={this.state.versions_s}  
                            getVertexDataRow={this.getVertexDataRow} 
                            getLabels={this.getLabels} 
                            selectedNodes={this.state.nodes_s}
                        />
                        </Card>
                    </Tab>
                    
                    <Tab eventKey="query_tri" title="Motifs">
                    <Card className="mainPanel">
                        <QueryComponentMotif 
                            selectedVersions={this.state.versions_s}  
                            getVertexDataRow={this.getVertexDataRow}
                            getLabels={this.getLabels} 
                            getSelectedNodes={this.state.nodes_s}/>
                        </Card>
                    </Tab>
            
                </Tabs>
      
        );
    }
    
    render(){
//         console.log("RE", this.state.graphData.vertexData)
        return(
            <div> 
               
            {this.renderMainPanel()}
             {/*this.renderSideMenu()*/}


            </div> 
        );
    }
    
}

ReactDOM.render(
<App />,
document.getElementById('root')
);
