import 'bootstrap/dist/css/bootstrap.min.css';

import {Tabs,Tab, Card} from 'react-bootstrap';

import React from 'react';
import ReactDOM from 'react-dom'; 
// import Axios from 'axios';
import Axios from 'axios';

import InfoPanel from  './infoPanel.js';

import SelectVersionsComponent from './selectVersionsComponent.js';
import SelectNodesComponent from './selectNodesComponent.js';

import QueryComponentRWR from './queryComponentRWR.js';
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

class SelectedVersions{
    constructor(versions){
        this.versionNames = [];
        this.versionLists = [];
        
        if(typeof versions !== 'undefined'){
            this.versionNames = versions
            this.versionLists = new Array(versions.length).fill(false)
        }
    }
}

class GraphData{
    constructor(serverResponse){
//         console.log(serverResponse)
        
        this.data={
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
            
//             console.log(this.data.vertexData)
        }

    }
  

}

class App extends React.Component {
    constructor(props){
        super(props);
        this.state={
            graphData: new GraphData(),
            versions_s : new SelectedVersions(),
            nodes_s :  [new Set(), new Set()],
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
                versions_s : new SelectedVersions(response.data.versions),
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
            versions_s : new SelectedVersions(serverResponse.versions),
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
    
    getSelectedNodes2=(set)=>{
        return this.state.nodes_s[set];
    }
    
    getSelectedNodeDifference=()=>{
        let l1 = [...this.state.nodes_s[0]].filter((e)=>(!this.state.nodes_s[1].has(e)));
        let l2 = [...this.state.nodes_s[1]].filter((e)=>(!this.state.nodes_s[0].has(e)));
        let c = [];
        l1.forEach((e)=>{c.push({v:0, id:e})})
        l2.forEach((e)=>{c.push({v:1, id:e})})
        
        return c
    }
    
    selectVersionToggle=(index)=>{
        
        const versions_s = this.state.versions_s.slice();
        versions_s[Number(index)] = !versions_s[Number(index)];
        
        this.setState({
            versions_s: versions_s,
        })
    }
    
    selectVersionToggle2=(set, index)=>{
        console.log("SVT2", this.state.versions_s)
        const newVersionList = this.state.versions_s.versionLists.slice();
        
        newVersionList[set * this.state.versions_s.versionNames.length + Number(index)] = !this.state.versions_s.versionLists[set * this.state.versions_s.versionNames.length + Number(index)];
        
        this.setState({
            versions_s:{
                versionNames : this.state.versions_s.versionNames,
                versionLists : newVersionList,
            }
        })
    }
    
    isSelected=(index)=>{
        return this.state.versions_s[index] === true;
    }
    
    isSelected2=(set, index)=>{
        return this.state.versions_s.versionLists[set * this.state.versions_s.versionNames.length + Number(index)] === true;
    }
    
    getVersions=()=>{
        return this.state.versions_s;
    }
    
    getSelectedVersions=()=>{
        return this.getSelectedVersions2(0);

    }
    
    getSelectedVersions2=(set)=>{
        let ret=[];
//         console.log("VS2", this.state.versions_s2)
        let offset = this.state.versions_s.versionNames.length;
        for(let i=(set*offset) ; i<((set+1)*offset) ; ++i){
            if(this.state.versions_s.versionLists[i])
                ret.push(i-(set*offset));
            
        }
        return ret;
        
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
             <Tabs defaultActiveKey="selectVersions" id="mainTab" >
                
                    <Tab eventKey="selectVersions" title="Versions">
                        <Card className="mainPanel">
                            <SelectVersionsComponent getVersions={this.getVersions} isSelected={this.isSelected2} selectVersionToggle={this.selectVersionToggle2} getSelectedVersions={this.getSelectedVersions2}/>
                        </Card>
                    </Tab>
                    
                    <Tab eventKey="selectNodes" title="Nodes">
                        <Card className="mainPanel">
                            <SelectNodesComponent allNodes={this.state.graphData.data.vertexData} 
                                selectNodes2={this.selectNodes2} unSelectNodes2={this.unSelectNodes2} 
                                getSelectedNodes2={this.getSelectedNodes2} selNodes={this.state.nodes_s}
                                nodeLookup={this.state.nodeLookup}
                                getSelectedNodesDifference={this.getSelectedNodeDifference}
                            />
                        </Card>
                    </Tab>
                    
           
                    <Tab eventKey="query_rwr" title="RWR">
                    <Card className="mainPanel">
                        <QueryComponentRWR getSelectedVersions={this.getSelectedVersions}  getVertexDataRow={this.getVertexDataRow} getLabels={this.getLabels} getSelectedNodes={this.getSelectedNodes2}/>
                        </Card>
                    </Tab>
                    
                    <Tab eventKey="query_tri" title="Motifs">
                    <Card className="mainPanel">
                        <QueryComponentMotif getSelectedVersions={this.getSelectedVersions}  getVertexDataRow={this.getVertexDataRow} getLabels={this.getLabels} getSelectedNodes={this.getSelectedNodes2}/>
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
