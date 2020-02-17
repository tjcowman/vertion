import 'bootstrap/dist/css/bootstrap.min.css';
// import { Button, ButtonToolbar, Form,Col,Row} from 'react-bootstrap';

import React from 'react';
import ReactDOM from 'react-dom'; 
// import Axios from 'axios';


import VersionList from  './infoPanel.js';
import QueryPanel from './queryPanel.js'

import './index.css';




// class DescriptionPanel extends React.Component {
//   constructor(props) {
//     super(props);
//     
//    
//   }
//   
//   render(){
//     return(
//         <></>
//     );
//   }
//   
// }

class App extends React.Component {
    constructor(props){
        super(props);
        this.state={
            versions_s : []
        }
        
         
        this.selectVersionToggle = this.selectVersionToggle.bind(this);
        this.isSelected = this.isSelected.bind(this);
        this.getSelectedVersions = this.getSelectedVersions.bind(this);
    }
    
    
    selectVersionToggle(index) {
        const versions_s = this.state.versions_s.slice();
        versions_s[Number(index)] = !versions_s[Number(index)];
        
        this.setState({
            versions_s: versions_s,
        })
            

    }
    
    isSelected(index) {
        return this.state.versions_s[index] === true;
    }
    
    getSelectedVersions(){

            let ret = [];
            for(let i in this.state.versions_s)
                if(this.state.versions_s[i])
                    ret.push(Number(i));

            return(ret);
    }

    
    render(){
        return(
        <div>
            
            <div className="card rwrPanel">
                <QueryPanel getSelectedVersions={this.getSelectedVersions}/>
            </div>
        
            <div className="card versionPanel" >
                <VersionList selectVersionToggle={this.selectVersionToggle} isSelected={this.isSelected} />
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
