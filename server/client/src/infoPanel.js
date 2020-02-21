import {Button, ButtonGroup} from 'react-bootstrap'
import React, { Component } from 'react';
import Axios from 'axios';

class VersionList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            raw: [],
            tags: [],
            tree: [],
            names: [],
            integrationMethod: 0,
            
            selectedTags: [],
        };

        
        var date = new Date();
        Axios.get('http://localhost:9060/ls', date.getTime()).then((response)=>{
            this.setState({
                raw: response.data,
            })
             console.log(response)
            this.props.setVertexData(response.data.vertexData);
            this.props.setLabels(response.data.labels.vertex, response.data.labels.edge);
//             console.log(response.data.labels.vertex);
           

        }).then(()=>{          
            let tags = {};

            console.log(this.props.getLabels());
            
            for(let i in this.state.raw.versions){
                let ar =  this.state.raw.versions[i].tags;
                for(let j in ar){
                    if(!isNaN(tags[ar[j]])){
                        tags[ar[j]]++;
                    }
                    else{
                        tags[ar[j]] = 1;
                    }
                }
            }
            
            
            let tagsArr = Object.keys(tags).map((e,i) => ([e,i]));
            let namesArr =this.state.raw.versions.map( (e,i) => ([e.name])   );
            let newData= []; this.convertToTree(this.state.raw.tree, 0, 0, newData);

            this.setState({
                tags: tagsArr,
                selectedTags: Array(tagsArr.length).fill(false),
                selectedVersions: Array(this.state.raw.nodes).fill(false),
                names: namesArr,
                tree: newData,
            });
     
        });
     
        
    }
    
    convertToTree(data, depth, index, newData)
    {
        newData.push([depth, index]);
        
        if(data[index].length === 0)
           return;
        else{
            for(let i=0; i<data[index].length; ++i){
                this.convertToTree(data, depth+1,  data[index][i], newData);
            }
        }
    }
    
    handleClick(event)
    {

        event.target.checked=false;
        
        const selectedTags = this.state.selectedTags.slice();
        selectedTags[Number(event.target.name)] = !selectedTags[Number(event.target.name)];
//         
        this.setState({
            selectedTags: selectedTags,
        })

    }
    

    handleIntegrationToggle(event)
    {
        this.setState({
            integrationMethod : event.target.value
        });
    }
    
    render(){
        return(

            <div className="card">
            
                <div className="card-body">
                
                    <h3>VGraph</h3>
                    <div className="card mb-3">
                        <div className=" card-body">
                            <div>Versions: {this.state.names.length}</div>
                            <div>Nodes: {this.state.raw.nodes}</div>
                            
                            
                            Vertex Labels: 
                            <div className="card-body pb-0 pt-0">
                                { this.props.getLabels()[0].names.map((e,i) =>(
                                    <button key={i} className="btn btn-outline-secondary m-1 btn-smaller" >{e}</button>
                                ))}
                            </div>
                            
                            Edge Labels: 
                            <div className="card-body pb-0 pt-0">
                                {this.props.getLabels()[1].names.map((e,i) =>(
                                    <button key={i} className="btn btn-outline-secondary m-1 btn-smaller" >{e}</button>
                                ))}
                            </div>
                            
                            Version Tags:
                            <div  className="card-body pb-0 pt-0">
                                {this.state.tags.map((e,i) => (
                                    <button key={i} value={e[0]} name={i} className={this.state.selectedTags[i] ? "active btn btn-outline-secondary m-1 btn-smaller" : "btn btn-outline-secondary m-1 btn-smaller"} onClick={(event) =>this.handleClick(event)}>{e[0]}</button>
                                ))}
                            </div>
                            
                        </div>
                    </div>
                
            
                    <h3>Version Tree</h3>
                    <div className="card mb-3" >
                        
                        
                        <ButtonGroup className="card-body " size="sm" onClick={(e) =>this.handleIntegrationToggle(e)} >
                            <Button  value={0} className={this.state.integrationMethod===0 ? "btn-secondary active": "btn-secondary"}  >Union</Button>
                            <Button  value={1} className={this.state.integrationMethod===1 ? "btn-secondary active": "btn-secondary"}  >Intersection</Button>
                        </ButtonGroup>
                        
                        <div className="card-body versionNames">
                            {this.state.tree.map((e,i)=>(
                                <div  key={i}>
                                    {'......'.repeat(e[0])} <button  value={e[1]} name={i} className={this.props.isSelected(i) ? "active btn btn-outline-secondary m-1 btn-smaller vName" : "btn btn-outline-secondary m-1 btn-smaller vName"} onClick={(event) =>this.props.selectVersionToggle(i)}>{this.state.names[e[1]]}</button>
                                </div>                                
                            ))}
                        </div>
                        
                        
                    </div>
                    
                </div>
                
            </div>
             
        );
    }
} 

export default VersionList;
