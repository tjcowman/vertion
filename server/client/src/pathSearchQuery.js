import React from 'react';
import {Button, Card, Tab, Tabs} from 'react-bootstrap'

// import Cytoscape from 'cytoscape';
// import CytoscapeComponent from 'react-cytoscapejs';

// import fcose from 'cytoscape-fcose';

import { YAxis, XAxis, Line, ScatterChart, Scatter, LineChart,ReferenceLine} from 'recharts';
import DefaultTooltipContent from 'recharts/lib/component/DefaultTooltipContent';

import Axios from 'axios';
import {CytoscapeCustom} from './cytoscapeCustom.js'
import {RolloverPanel, QuerySettingsBar} from './rolloverPanel.js'
import * as cstyle from './cytoStyles.js'

import './pathSearchQuery.css'



class Settings extends React.Component{
    render(){
        return(
            <>
                <Card style={{/*marginBottom: '10px'*/}}>
                    <Card.Header>Input</Card.Header>
                    <Card.Body>
                        Kinase 1
                        <input autoComplete="off" value={this.props.kinaseText1} className="inputKinase form-control" name="kinaseText1"  onChange={this.props.handleChange} ></input>
                        Kinase 2
                        <input autoComplete="off" value={this.props.kinaseText2} className="inputKinase form-control" name="kinaseText2"  onChange={this.props.handleChange} ></input>
                        Sites
                        <textarea autoComplete="off" value={this.props.siteText} className="inputSites form-control" name="siteText"   onChange={this.props.handleChangeSites} ></textarea>
                      {/*  <Button className="form-control" variant="primary" onClick={(e) =>this.handleSubmit(e)} >Submit</Button>*/}
                    </Card.Body>
                </Card>
                
                <Card>
                    <Card.Header>Settings</Card.Header>
                    <Card.Body>
                        Minimum Weight
                        <input className="form-control" value={this.props.minWeight} name="minWeight" onChange={this.props.handleChange}></input>
                        Mechanistic Ratio
                        <input className="form-control" value={this.props.mechRatio} name="mechRatio" onChange={this.props.handleChange}></input>
                    </Card.Body>
                </Card>
            </>
        );
    }
}


class PathQueryComponent extends React.Component{
    constructor(props){
        super(props);
        
        this.state={
            versionIndex: "T",
            
            lastKinases: [],
            kinaseText1: "P00533",
            kinaseText2: "P15056",
            
            siteText: "Q15459	359	-1.3219\nQ15459	451	0.5352\nP28482	185	4.4463\nP28482	187	4.4195\nQ8N3F8	273	-0.3219",
            minWeight: 0,
            mechRatio: 10,
        }
    }
    
    
    parseKinase=()=>{
//         let k = [];
//         if(this.state.lastKinase[0] !== this.state.kinaseText1)
//             k.push(this.state.kinaseText1);
//         
//         if(this.state.lastKinase[1] !== this.state.kinaseText2)
//             k.push(this.state.kinaseText2);
//         
        return this.kinaseArrayFormat().filter((e,i) => this.state.lastKinases[i] !== e);
        
//         return k;
    }
    
    parseSites=()=>{
        return this.state.siteText.split("\n").map((r) => (r.split("\t")) ).map((e) => [e[0], Number(e[1]), Number(e[2])]).filter(e => {return e[2] !== 0});
    }
    
    handleChange=(event)=>{
        let name = event.target.name;
        let value= event.target.value;

        this.setState({
            [name]: value,
        })

    }
    
    handleChangeSites=(event)=>{
        let name = event.target.name;
        let value= event.target.value;

        this.setState({
            [name]: value,
            lastKinases : [] //need to reset kinases if the sites have changed
        })

    }
    
    kinaseArrayFormat=()=>{
        return [this.state.kinaseText1, this.state.kinaseText2];
    }
    
    computeKinaseMask=()=>{
        let m = [];
        let A = this.kinaseArrayFormat();
        for(let i=0; i<A.length; ++i)
            if(A[i] !== this.state.lastKinases[i])
                m.push(i);
            
//         return this.kinaseArrayFormat().map((e,i) => e !== this.state.lastKinases[i] );
            
//             else
//                 m.push(0);
        return m;
    }
    
    handleSubmit=()=>{
//         console.log(this.state);
        
        let versionDef = this.props.versionCards.getVersionDefinition(this.state.versionIndex);
        let command = {cmd:"pths",
             ...versionDef, 
            minWeight: Number(this.state.minWeight),
            kinase: this.parseKinase(),
            mechRatio: Number(this.state.mechRatio),
            sites: this.parseSites()
        };
        
        let mask=this.computeKinaseMask();
        console.log(mask)
        //Determine whether to query kinase or not
        if(command.kinase.length> 0)
            Axios.post('http://'+this.props.backAddr, JSON.stringify(command)).then((response)=>{
                console.log(response);
            
                
                this.setState({lastKinases : this.kinaseArrayFormat()});
            
            

//                 let distFn = []
//                 response.data.trees.forEach(tree=> 
//                 
//                 )
                
                
                
                let responseeTrees = new Map(response.data.trees.map((tree,i) => ([mask[i], tree])));
                this.props.getResponse(responseeTrees);

            });
        
    }
    
    handleVersionChange=(event)=>{
        this.setState({versionIndex: event.value})
    }
    
    render(){
        return(
            <QuerySettingsBar 
                handleVersionChange={this.handleVersionChange} 
                versionCards={this.props.versionCards} 
                handleRun={this.handleSubmit} 
                component={<Settings 
                    minWeight={this.state.minWeight} 
                    handleChange={this.handleChange} 
                     handleChangeSites={this.handleChangeSites} 
                    siteText={this.state.siteText}
                    kinaseText1={this.state.kinaseText1}
                    kinaseText2={this.state.kinaseText2}
                    mechRatio={this.state.mechRatio}
                />} 
            />
        )
    }
}

class CutoffManagerComponent extends React.Component{
    constructor(props){
        super(props);
        
        this.state=({
            minWeightDisplay:0,
             minPathScore: 0
        });
        
    }
    
    handleChange=(event)=>{
        let name = event.target.name;
        let value= event.target.value;

        this.setState({
            [name]: value,
        })

    }
    
    handleChangeTopK=(event)=>{
        if(event.target.value > 50){
            event.target.value=50;
            
        }else if(event.target.value < 0){
            event.target.value=0;
        }
        
        this.props.handleSetTopk(event.target.value);
    }
    
    handleSetMinPathScore=(event)=>{
        this.props.handleSetMinPathScore(event.target.value);
    }

    render(){
        let numScores = this.props.terminalScores.scores.length;
        let scoreMax = this.props.terminalScores.scores[numScores-1];
        
        return(
            <div className="container" >
                    <div style={{display:'inline-block',/*, backgroundColor:'green'*/}}>
                        <Card className="rounded-0">
                            <Card.Body>
                        
                                <div className="border" >
                                    <LineChart
                                        margin={{top:0,right:0,bottom:0, left:0}}
                                        width={200} height={100} data={this.props.terminalScores.scores.map((s, i) => ({rank: i*this.props.terminalScores.sparseFactor, score : s} ))}
                                    >
                                        <YAxis hide={true} type="number" domain={[0, 'dataMax']} />
                                        <Line  dot={false} type='monotone' dataKey="score" stroke='#8884d8' strokeWidth={3} />
                                        <ReferenceLine  y={this.state.minPathScore}/>
                                    </LineChart>
                                </div>
                    
                                <input type="range" name="minPathScore" className="range-pathDisplayMinWeight" min="0" max={ numScores === 0 ? 0 : scoreMax}
                                        value={this.state.minPathScore} 
                                        step={ isNaN(scoreMax) ? 0 : scoreMax/100} 
                                        id="customRange2"
                                        onChange={ this.handleChange}
                                        onMouseUp={this.handleSetMinPathScore} >
                                </input>
                                    
                                <div>Score Cutoff = {Number(this.state.minPathScore).toPrecision(5)}</div>
                        
                                
                            </Card.Body>
                        </Card>
                        
                        
                        <Card className="rounded-0">
                            <Card.Body>
                                    <div>Top K</div>
                                    <input type="number" className="form-control" style={{width:'200px'}} name="topk" autoComplete="off" value={this.props.topk} onChange={this.handleChangeTopK}></input>
                            </Card.Body>
                        </Card>
                        
                    </div>
            </div>
        );
    }
}

class ResultDisplay extends React.Component{
     constructor(props){
        super(props)
     }
     
     render(){
        return(
            <>
         
                 
            <div >
                <CytoscapeCustom 
                    cstyle={{colors: {...cstyle.colors, integration :cstyle.color_integration}  , labels: cstyle.labels, sizes :cstyle.sizes}}
                    elements={this.props.displayElements} 
                    
                />
            </div>
           
            </>
        );
     }
    
}

const responseParser=(props)=>{

    
}

export {PathQueryComponent,CutoffManagerComponent, ResultDisplay}

