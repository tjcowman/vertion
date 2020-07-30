import React from 'react';
import {Button, Card, Tab, Tabs, Form} from 'react-bootstrap'

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


export const  PathStats = (props) =>{
    return(
        <div style={{marginTop: '5px'}} className="border">
            <Card.Body>
            hi
            </Card.Body>
        </div>
    );
}

class Settings extends React.Component{
    render(){
        return(
            <>
                <Card style={{display: 'inline-block', verticalAlign:'top', marginRight: '10px'/*marginBottom: '10px'*/}}>
                    <Card.Header>Input</Card.Header>
                    
                    
                    
                    <Card.Body>
           
                        Kinase 1
                        <input autoComplete="off" value={this.props.kinaseText1} className="inputKinase form-control" name="kinaseText1"  onChange={this.props.handleChange} ></input>
                        Kinase 2
                        <input autoComplete="off" value={this.props.kinaseText2} className="inputKinase form-control" name="kinaseText2"  onChange={this.props.handleChange} ></input>
                        Sites
                        <textarea autoComplete="off" rows="5" value={this.props.siteText} className="inputSites form-control" name="siteText"   onChange={this.props.handleChangeSites} ></textarea>
                      {/*  <Button className="form-control" variant="primary" onClick={(e) =>this.handleSubmit(e)} >Submit</Button>*/}
                    </Card.Body>
                </Card>
                
                <div style={{display: 'inline-block',verticalAlign:'top'}}>
                    <Card >
                        <Card.Header>Settings</Card.Header>
                        <Card.Body>
                            Mechanistic Ratio
                            <input autoComplete="off"  className="form-control" type="number" value={this.props.mechRatio} name="mechRatio" onChange={(event)=>this.props.handleChangeRange(event,0,10000)}></input>
                            Top Weight Fraction
                            <input autoComplete="off" className="form-control" type="number" step=".1" value={this.props.minWeight} name="minWeight" onChange={(event)=>this.props.handleChangeRange(event,0,1)}></input>

                        </Card.Body>
                    </Card>
                
                    <Card style={{marginTop: '10px'}}>
                        <Card.Header>Node Lookup</Card.Header>
                        <Card.Body>
                            
                                
                            <Form.Check value="uniprot" name="idType" checked={this.props.lookupType === 'uniprot'} onChange={this.props.handleLookupType} label="Uniprot Id" /> 
                            
                            <Form.Check value="pname" name="idType" checked={this.props.lookupType === 'pname'} onChange={this.props.handleLookupType} label="Protein Name"/>
                        
                    
                        </Card.Body>
                    </Card>
                
                
                </div>
            </>
        );
    }
}


class PathQueryComponent extends React.Component{
    constructor(props){
        super(props);
        
        this.state={
            staleQuery : true,
            
            versionIndex: "T",
            
            lastKinases: [],
            kinaseText1: "P00533",
            kinaseText2: "P15056",
            lookupType: "uniprot",
            
            siteText: "Q15459	359	-1.3219\nQ15459	451	0.5352\nP28482	185	4.4463\nP28482	187	4.4195\nQ8N3F8	273	-0.3219",
            minWeight: .10,
            mechRatio: 10,
            localProximity: false,
        }
    }
    
    //NOTE: TODO: Incorporate the kinase and site text into this check (currently uses the parse functions
    componentDidUpdate(prevProps, prevState){
//         console.log("FF", 
//                     prevProps.versionCardPlainText, 
//                     this.props.versionCardPlainText
//                    );
       
        if(
            prevState.minWeight !== this.state.minWeight ||
            prevState.mechRatio !== this.state.mechRatio ||
            prevState.versionIndex !== this.state.versionIndex ||
            prevState.lookupType !== this.state.lookupType ||
            prevProps.versionCardPlainText[prevState.versionIndex] !==this.props.versionCardPlainText[this.state.versionIndex]
//             prevProps.versionCards.cards[prevState.versionIndex] !== this.props.versionCards.cards[this.state.versionIndex]
//             prevProps.versionCards.card(prevState.versionIndex).plainText() !== this.props.versionCards.card(this.state.versionIndex).plainText()
        ){
//             console.log("wut")
            //Note: need to reset the last kinases because they are no longer up to date
            this.setState({staleQuery : true, lastKinases: [] });
        }
    }
    
    handleLookupType=(event)=>{
//         console.log(event.target)
        this.setState({lookupType: event.target.value});
    }
    
    parseKinase=()=>{
        return this.kinaseArrayFormat().filter((e,i) => this.state.lastKinases[i] !== e);

    }
    
    parseSites=()=>{
        
//         try{
            let input = this.state.siteText.split("\n").map((r) => (r.match(/\S+/g)) ).filter(Boolean);
//             console.log("INPUT", input)
            if(input[0] === null)
                return [];
            
            if(input[0].length === 1){
            
            }else if(input[0].length ===2){
                input = input.filter(r => r.length ==2).map(r => [r[0], Number(r[1])]);
            }else{
                input = input.filter(r => r.length ==3).map(r => [r[0], Number(r[1]), Number(r[2])]);
            }
            
    //         input = input[0].length === 2 ? input.map(r => [r[0], Number(r[1])]) :
    //             input.map(r => [r[0], Number(r[1]), Number(r[2])])
            if(input[0].length > 1)
                input = input.filter(r => {return r[r.length-1] !== 0});
        
            return input
//         }catch(e){ //Bad input format
//             return [];
//         }
//         return this.state.siteText.split("\n").map((r) => (r.split("\t")) ).map((e) => [e[0], Number(e[1]), Number(e[2])]).filter(e => {return e[2] !== 0});
    }
    
    toggleLocalProximity=()=>{
        this.setState({localProximity : !this.state.localProximity});
    }
    
    handleChange=(event)=>{
        let name = event.target.name;
        let value= event.target.value;

        this.setState({
            [name]: value,
        })

    }
    handleChangeRange=(event,min,max)=>{
        let name = event.target.name;
        let value= event.target.value;
        
        if(value < min)
            value = min;
        else if(value > max)
            value = max;

        this.setState({
            [name]: value,
            lastKinases : [] //need to reset kinases if the sites have changed
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
            lookupType: this.state.lookupType, //pname
            weightFraction: Number(this.state.minWeight),
            kinase: this.parseKinase(),
            mechRatio: Number(this.state.mechRatio),
            sites: this.parseSites(),
            localProximity: this.state.localProximity,
            
        };
        
        let mask=this.computeKinaseMask();
//         console.log(mask)
        //Determine whether to query kinase or not 
        //TODO: This is confusing, need special case to reQuery both kinases if any of the other parmaeters hve changed
        if(command.kinase.length> 0 || this.state.staleQuery)
            Axios.post('http://'+this.props.backAddr, JSON.stringify(command)).then((response)=>{
                
                this.setState({staleQuery: false});
//                 console.log(response);
            
                
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
            <>
            <Button onClick={this.toggleLocalProximity}>{this.state.localProximity === true ? "Local" : "Global"}</Button>
            
            <QuerySettingsBar 
                handleVersionChange={this.handleVersionChange} 
                versionCards={this.props.versionCards} 
                handleRun={this.handleSubmit} 
                component={<Settings 
                    minWeight={this.state.minWeight} 
                    handleChange={this.handleChange} 
                    handleChangeRange={this.handleChangeRange}
                    handleChangeSites={this.handleChangeSites} 
                    siteText={this.state.siteText}
                    kinaseText1={this.state.kinaseText1}
                    kinaseText2={this.state.kinaseText2}
                    mechRatio={this.state.mechRatio}
                    lookupType={this.state.lookupType}
                    handleLookupType={this.handleLookupType}
                />} 
            />
            </>
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
                                    <div>Top K : [{this.props.kAvailable}]</div>
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
                    handleSubmitDensePath={this.props.handleSubmitDensePath}
                />
            </div>
           
            </>
        );
     }
    
}

const responseParser=(props)=>{

    
}

export {PathQueryComponent,CutoffManagerComponent, ResultDisplay}

