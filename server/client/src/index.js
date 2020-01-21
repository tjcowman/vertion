import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, ButtonToolbar, Form,Col,Row} from 'react-bootstrap';

import React from 'react';
import ReactDOM from 'react-dom'; 
import Axios from 'axios';

import './index.css';

let cmd_get_version_list = {cmd: "ls"};


class VersionList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            raw: [],
            vertexLabels: [],
            edgeLabels: [],
            tags: [],
            tree: [],
            names: [],
            selectedTags: [],
            selectedVersions: [],
        };
        Axios.post('http://localhost:9060', JSON.stringify(cmd_get_version_list)).then((response)=>{
            this.setState({
                raw: response.data,
                vertexLabels:response.data.labels.vertex, 
                edgeLabels:response.data.labels.edge
            })
            
        }).then(()=>{          
            let tags = {};
//              console.log(this.state.raw);
            
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
//             console.log(namesArr);
            
             console.log(this.state.raw.labels);
            
            this.setState({
                tags: tagsArr,
                selectedTags: Array(tagsArr.length).fill(false),
                names: namesArr,
                tree: newData,
            });
//             console.log(this.state.tree)          
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
//         console.log(event)
//         console.log(this.state.selectedTags, event.target.name)
        event.target.checked=false;
        
        const selectedTags = this.state.selectedTags.slice();
        selectedTags[Number(event.target.name)] = !selectedTags[Number(event.target.name)];
//         
        this.setState({
            selectedTags: selectedTags,
        })
        
        
        //
    }
    
    
    renderTree(index, depth){
        return(

            <p>
//      
            </p>
  
            

 
        );
    }
    
    
    render(){
        return(

            <div className="card">
            
                <div className="card-body">
                
                    <h3>VGraph</h3>
                    <div className="card">
                        <div className=" card-body">
                            <div>Versions: {this.state.names.length}</div>
                            <div>Nodes: </div>
                            
                            <div>
                                Vertex Labels: 
                            </div>
                            
                            Edge Labels: 
                            <div className="card-body pb-0 pt-0">
                                {this.state.edgeLabels.map((e,i) =>(
                                    <button key={i} className="btn btn-outline-secondary m-1 btn-smaller" >{e}</button>
                                ))}
                            </div>
                            
                            Version Tags:
                            <div  className="card-body pb-0 pt-0">
                                {this.state.tags.map((e,i) => (
                                    <Button variant="outline-secondary" key={i} value={e[0]} name={i} className={this.state.selectedTags[i] ? "active m-1 btn-smaller" : "m-1 btn-smaller"} onClick={(event) =>this.handleClick(event)}>{e[0]}</Button>
                                ))}
                            </div>
                            
                        </div>
                    </div>
                
            

                    
                    <h3>Versions Selected</h3>
                    <div className="card" >
                    <ul className="card-body versionNames">
                        {this.state.names.map((e,i) => (
                            <li key={i}>{e}</li>
                        ))}
                    </ul>
                    </div>
                    
                    <h3>Version Tree</h3>
                    <div className="card" >
                        <ul className="card-body versionNames">
                            {this.state.tree.map((e,i)=>(
                                <li key={i}>{'...'.repeat(e[0])} [{e[1]}] : [{this.state.names[e[1]]}]</li>
                            ))}
                        </ul>
                    </div>
                    
                </div>
                
            </div>
             
                   
        
                
          

//             <div><textarea className="responseArea" value={JSON.stringify(this.state.tags)} rows="4" cols="50" readOnly />  </div>
        );
    }
}

class QueryForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
        version: 0,
        alpha: .15,
        epsilon: 1e-5,
        topk: 10,
        result: "",
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    let name = event.target.name;
    let value= event.target.value;
      
    this.setState({
        [name]: value,
    }/*, () => alert(this.state.version)*/)
 
  }


  handleSubmit(event) {

    let command = {cmd:"rwr", version:Number(this.state.version), alpha:Number(this.state.alpha), epsilon:Number(this.state.epsilon), topk:Number(this.state.topk)}; 
//     alert(JSON.stringify(command))
    
     Axios.post('http://localhost:9060', JSON.stringify(command)).then((response)=>{this.setState({result: response.data})});
    event.preventDefault();
  }

  render() {
    return(
        <Form className="card-body">
        <div className="card">
            <div className="card-body"> 
                <Row>
                    <Col>Version<Form.Control placeholder="0" name="version" value={this.state.version} onChange={(e) =>this.handleChange(e)} /></Col>
                    <Col>Alpha <Form.Control placeholder=".15" name="alpha"  value={this.state.alpha} onChange={(e) =>this.handleChange(e)} /> </Col>
                    <Col>Epsilon<Form.Control  placeholder="1e-5" name="epsilon"  value={this.state.epsilon} onChange={(e) =>this.handleChange(e)} /></Col>
                    <Col>Top k<Form.Control  placeholder="10" name="topk"  value={this.state.topk} onChange={(e) =>this.handleChange(e)} /></Col>
                </Row>

               
            </div>
        </div>
                <textarea className="form-control" rows="4" value={JSON.stringify(this.state.result)} readOnly/>
        <Button className="form-control" variant="primary" onClick={(e) =>this.handleSubmit(e)} >Submit</Button>

        </Form>

    );
  }
}

class DescriptionPanel extends React.Component {
  constructor(props) {
    super(props);
  }
  
  render(){
    return(
        <></>
    );
  }
  
}

class App extends React.Component {
    constructor(props){
        super(props);
        this.state={
        }
    }
    
    
    render(){
        return(
        <div>
     
            <div className="card rwrPanel">
                <QueryForm />
            </div>
        
            <div className="card versionPanel">
                <VersionList/>
            </div>
            <div className="card descriptionPanel">
                <DescriptionPanel/>
            </div>
        </div>
        );
    }
    
}

ReactDOM.render(
<App />,
document.getElementById('root')
);
