import {} from 'react-bootstrap'
import React from 'react';
import Axios from 'axios';

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ComposedChart, Line } from 'recharts';

import {Card, ListGroup, Button} from 'react-bootstrap';

import './infoPanel.css';
//tmp const data = [{name: 'Page A', uv: 400, pv: 2400, amt: 2400}];

class GraphViewDisplay extends React.Component{

    render(){
        return(
            <div className="graphViewContainer ">

                {this.props.versionCardsO.cards.map((e,i) =>(
                  <div key={i}
                    onClick={()=>(
                        this.props.handleClickVersionCard(i)
                    )}
                    className={this.props.displayVersions.has(i) ?
                        " border border-primary graphViewElementBase activeGraphViewElement" :
                        " border  graphViewElementBase"
                    }>

                    <div className="border bg-light  gveHeader">
                    </div>
                    <div className=" text-secondary gveBody">
                      {i}
                    </div>
                  </div>

                  ))}
            </div>
        );
    }
}


//Takes a data [ {measure,value}]
const Plot1=(props)=>{
  return(

    <ComposedChart width={600} height={300} data={props.data} margin={{
          top: 20, right: 20, bottom: 20, left: 20
        }}
    >
      {console.log("pprops",props)}

        <XAxis dataKey="cardId" stroke="#8884d8" />
        <YAxis />
        <Legend />
        <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
        <Bar dataKey="components" fill="#8884d8" barSize={30} />
        <Line type='monotone' dataKey='components.num'/>

    </ComposedChart>
  )
}

class InfoPanel extends React.Component {
  constructor(props){
    super(props);

    this.state={plotDisplayIVs :new Set()};

  }

  //Updates the set of integrated versions slated for plotting
  handleVersionClick=(versionId)=>{
    let plotDisplayIVs = this.state.plotDisplayIVs;
    if(plotDisplayIVs.has(versionId))
      plotDisplayIVs.delete(versionId)
    else {
      plotDisplayIVs.add(versionId)
    }
    this.setState({plotDisplayIVs: plotDisplayIVs});
  }

  //Update the stale verison summaries
  handlePlot=()=>{
    console.log(this.props.versionCardsO.cards)
    for (let id in this.props.versionCardsO.cards){
    //  console.log(id)
      this.handleUpdate(id);
    }

  }

    handleUpdate=(id)=>{

        if(this.props.versionCardsO.cards[id].isStale){
            let command = {
                cmd: 'lsv',
                versions:  [...this.props.versionCardsO.cards[id].versions_s],
                vertexLabels: [...this.props.versionCardsO.cards[id].labelsV_s],
                edgeLabels: [...this.props.versionCardsO.cards[id].labelsE_s],
            }
            console.log("command",command)

            Axios.post('http://'+this.props.backAddr, JSON.stringify(command)).then((response)=>{
                console.log("DR", response);

                this.props.handleUpdateCardSummary(id, response.data);
            });
        }
    }

    //Gets the versionCards that should be plotted
    getPlottedCards=()=>{
      return this.props.versionCardsO.cards.filter((vc,i)=>this.state.plotDisplayIVs.has(i)).map((vc) => vc.summary);
    }

    render(){
        return(
//             console.log("rendering main", this.props),
            <>
                <Card.Body>
                <Card>
                <Card.Header>Integrated Networks</Card.Header>


                    <GraphViewDisplay
                        versionCardsO={this.props.versionCardsO}
                        activeVersionCard={this.props.versionCardsO.activeCard}
                        displayVersions= {this.state.plotDisplayIVs}
                        handleClickVersionCard = {this.handleVersionClick}

                    />

                </Card>
                {/*}<Button onClick={this.handlePlot}>Generate Plot</Button>*/}
                </Card.Body>


                <Plot1
                  data = { this.getPlottedCards()}

                />


            </>


        );
    }
}

export {InfoPanel};
