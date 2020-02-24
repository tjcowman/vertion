import 'bootstrap/dist/css/bootstrap.min.css';
// import { Button, ButtonToolbar, Form,Col,Row} from 'react-bootstrap';
import { Button, Form,Col,Row,Tabs,Tab} from 'react-bootstrap';

import React from 'react';
import ReactDOM from 'react-dom'; 
// import Axios from 'axios';


import VersionList from  './infoPanel.js';
import QueryPanel from './queryPanel.js';
import SelectVersionsComponent from './selectVersionsComponent.js';
import SelectNodesComponent from './selectNodesComponent.js';

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
        this.versionNames = versions
        this.versionLists = [[]]
    }
}

class GraphData{
    constructor(serverResponse){
        console.log(serverResponse)
        
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
        }

    }
  

}

class App extends React.Component {
    constructor(props){
        super(props);
        this.state={
            graphData: new GraphData(),
            versions_s : [],
            versions_s2 : new SelectedVersions(),
        }
    }
    
    
    setData=(serverResponse)=>{
        this.setState({
            graphData: new GraphData(serverResponse),
            versions_s2 : new SelectedVersions(serverResponse.versions)
        });
    }
    

    
    
    selectVersionToggle=(index)=>{
        const versions_s = this.state.versions_s.slice();
        versions_s[Number(index)] = !versions_s[Number(index)];
        
        this.setState({
            versions_s: versions_s,
        })
            

    }
    
    isSelected=(index)=>{
        return this.state.versions_s[index] === true;
    }
    
    getVersions = ()=>{
        return this.state.versions_s2;
    }
    
    getSelectedVersions=()=>{

        let ret = [];
        for(let i in this.state.versions_s)
            if(this.state.versions_s[i])
                ret.push(Number(i));

        console.log("SV", ret)
        return(ret);
    }
    
    
    
    getLabels = () => {
        return [this.state.graphData.data.labels.vertex, this.state.graphData.data.labels.edge]
    }
    

    getVertexDataRow=(rowIndex)=>{
        return this.state.graphData.data.vertexData[rowIndex];
    }

    
    render(){
        return(
        <div>
            
            <Tabs defaultActiveKey="selectVersions" id="mainTab">
            
                <Tab eventKey="selectVersions" title="Versions">
                    <div className="card rwrPanel">
                        <SelectVersionsComponent getVersions={this.getVersions}/>
                    </div>
                </Tab>
                
                <Tab eventKey="selectNodes" title="Nodes">
                    <div className="card rwrPanel">
                        <SelectNodesComponent />
                    </div>
                </Tab>
                
                <Tab eventKey="query" title="Query">
                    <div className="card rwrPanel">
                        <QueryPanel getSelectedVersions={this.getSelectedVersions}  getVertexDataRow={this.getVertexDataRow} getLabels={this.getLabels} />
                    </div>
                </Tab>
        
            </Tabs>
        
            <div className="card versionPanel" >
                <VersionList selectVersionToggle={this.selectVersionToggle} isSelected={this.isSelected} /*setVertexData={this.setVertexData}*/ getLabels={this.getLabels} /*setLabels={this.setLabels}*/ setData={this.setData} />
            </div>

        </div>
        );
    }
    
}

ReactDOM.render(
<App />,
document.getElementById('root')
);
