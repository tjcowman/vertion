import React from 'react';
import {Card} from 'react-bootstrap'
import { YAxis, Line, LineChart,ReferenceLine} from 'recharts';


import Axios from 'axios';
import {CytoscapeCustom} from './cytoscapeCustom.js'
import { QuerySettingsBar} from './rolloverPanel.js'
import * as cstyle from './cytoStyles.js'

import './pathSearchQuery.css'




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
     render(){
        return(
            <>


            <div >
                <CytoscapeCustom
                    cstyle={{colors: {...cstyle.colors, integration :cstyle.color_integration}  , labels: cstyle.labels, sizes :cstyle.sizes}}
                    elements={this.props.displayElements}
                    cy={(cy) => {this.cy = cy}}
                    handleSubmitDensePath={this.props.handleSubmitDensePath}
                    handleSubmit_siteEstimation={this.props.handleSubmit_siteEstimation}
                    handleSubmit_crossPaths={this.props.handleSubmit_crossPaths}
                    handleResetMainView={this.props.handleResetMainView}
                    getElementsFromPath={this.props.getElementsFromPath}
                    subPath={this.props.subPath}
                />
            </div>

            </>
        );
     }

}

export {CutoffManagerComponent, ResultDisplay}
