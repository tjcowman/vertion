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
        

        if(typeof serverResponse !== 'undefined'){
            this.data.labels.vertex = new LabelSet(serverResponse.labels.vertex.names);
            this.data.labels.edge = new LabelSet(serverResponse.labels.edge);
            this.data.versions = serverResponse.versions;
            this.data.vertexData = serverResponse.vertexData;
            
            this.data.vertexData.forEach((e) => e.labelsNames =  this.data.labels.vertex.bitsToNames(e.labels));
            this.labelNames = {
                vertex : serverResponse.labels.vertex.names,
                edge : serverResponse.labels.edge.names
            }
            
            
//             console.log(this.data.vertexData)
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
            versions_n : [0,0],
            
            nodes_s :  [new Set(), new Set()],
            labelsV_s : [new Set(), new Set()],
            labelsE_s : [new Set(), new Set()],
            nodeLookup: new Map(),
        }
        
        var date = new Date();
         Axios.get('http://localhost:9060/ls', date.getTime()).then((response)=>{
             console.log(response)
             
            let nodeLookup = new Map();
    
            response.data.vertexData.forEach((e) =>(
                nodeLookup.set(e.name, e.id)
            ));

            this.setState({
                graphData: new GraphData(response.data),
//                 versions_s : new SelectedVersions(response.data.versions),
                nodeLookup : nodeLookup
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
    

    selectNodes2=(set, nodeIds)=>{
//         console.log("SL2", this.state.nodes_s)
        this.setState(prevState => {
            nodes_s : nodeIds.forEach(prevState.nodes_s[set].add, prevState.nodes_s[set])
        });
//         console.log("SL", this.state.nodes_s)
    }
    
    unSelectNodes2=(set, nodeIds)=>{
        this.setState(prevState => {
            nodes_s : nodeIds.forEach(prevState.nodes_s[set].delete, prevState.nodes_s[set])
        });
        console.log("SL", this.state.nodes_s)
    }
    
    
    
    selectVersion=(set, versionIds)=>{
        console.log("S")
        let newCounts = this.state.versions_n;
        newCounts[set] = newCounts[set] + versionIds.length;
        
        this.setState(prevState => {
             versions_s : versionIds.forEach(prevState.versions_s[set].add, prevState.versions_s[set])
            
        });
        
        this.setState({ versions_n : newCounts});
    }
    
    unSelectVersion=(set, versionIds)=>{
        console.log("US")
        let newCounts = this.state.versions_n;
        newCounts[set] = newCounts[set] - versionIds.length;
        
        this.setState(prevState => {
             versions_s : versionIds.forEach(prevState.versions_s[set].delete, prevState.versions_s[set])
        });
         this.setState({ versions_n : newCounts});

    }
    
    toggleSelectVersion=(set, index)=>{
        if(this.checkVersion(set,index))
            this.unSelectVersion(set, [index]);
        else
            this.selectVersion(set,[index]);
    }
    
    checkVersion=(set, index)=>{
        return this.state.versions_s[set].has(index);
    }
    
    getSelectedNodes2=(set)=>{
        return this.state.nodes_s[set];
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
                                checkVersion={this.checkVersion}

                                toggleSelectVersion={this.toggleSelectVersion}
//                                 getSelectedVersions={this.getSelectedVersions}

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
                            /> 
                        </Card>
                    </Tab>
                  
                   
                    <Tab eventKey="selectNodes" title="Nodes">
                        <Card className="mainPanel">
                            <SelectNodesComponent 
                                allNodes={this.state.graphData.data.vertexData} 
                                
                                selectNodes2={this.selectNodes2} 
                                unSelectNodes2={this.unSelectNodes2} 
                                
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
