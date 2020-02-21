import 'bootstrap/dist/css/bootstrap.min.css';
// import { Button, ButtonToolbar, Form,Col,Row} from 'react-bootstrap';

import React from 'react';
import ReactDOM from 'react-dom'; 
// import Axios from 'axios';


import VersionList from  './infoPanel.js';
import QueryPanel from './queryPanel.js'

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


class App extends React.Component {
    constructor(props){
        super(props);
        this.state={
            vertexLabels : new LabelSet([]),
            edgeLabels : new LabelSet([]),
            vertexData : [],
            versions_s : []
        }
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
    
    getSelectedVersions=()=>{

            let ret = [];
            for(let i in this.state.versions_s)
                if(this.state.versions_s[i])
                    ret.push(Number(i));

            return(ret);
    }
    
    
    setLabels=(vertexLabels, edgeLabels)=>{
        this.setState({
//             vertexLabels: vertexLabels,
            vertexLabels : new LabelSet(vertexLabels.names),
            edgeLabels: new LabelSet(edgeLabels)
        })
        
//         console.log(vertexLabels)
//         console.log(this.state.vertexLabels);
    }
    
    
    getLabels = () => {
        
        return [this.state.vertexLabels, this.state.edgeLabels]
//        return [this.state.vertexLabels, this.state.edgeLabels];
    }
    
    setVertexData =(vertexData)=>{
        this.setState({
            vertexData: vertexData
        })
    }
    
    getVertexDataRow=(rowIndex)=>{
        return this.state.vertexData[rowIndex];
    }

    
    render(){
        return(
        <div>
            
            <div className="card rwrPanel">
                <QueryPanel getSelectedVersions={this.getSelectedVersions}  getVertexDataRow={this.getVertexDataRow} getLabels={this.getLabels} />
            </div>
        
            <div className="card versionPanel" >
                <VersionList selectVersionToggle={this.selectVersionToggle} isSelected={this.isSelected} setVertexData={this.setVertexData} getLabels={this.getLabels} setLabels={this.setLabels} />
            </div>
           {/* <div className="card descriptionPanel">
                <DescriptionPanel/>
            </div>*/}
        </div>
        );
    }
    
}

ReactDOM.render(
<App />,
document.getElementById('root')
);
