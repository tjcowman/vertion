import {} from 'react-bootstrap'
import React from 'react';
import Axios from 'axios';

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

import {Card, ListGroup, Button} from 'react-bootstrap';

import './infoPanel.css';
const data = [{name: 'Page A', uv: 400, pv: 2400, amt: 2400}];

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

                {/*this.props.versionCardsO.cards.map((e,i)=>(
                    <div key={i}
                    onClick={()=>(
                        this.props.handleClickVersionCard(i)
                    )}
                    className={e.isStale ?
                        "  border border-warning graphViewElementBase staleGraphViewElement"
                        : i === this.props.versionCardsO.activeCard ? " border border-primary graphViewElementBase activeGraphViewElement": " border  graphViewElementBase"

                    } >
                        <div className="border bg-light  gveHeader">
                        </div>
                        <div className=" text-secondary gveBody">
                        {i}
                        </div>
                    </div>
                ))*/}


            </div>
        );
    }
}


//Takes a data [ {measure,value}]
const Plot1=(props)=>{
  return(
    <BarChart width={600} height={300} data={props.data}>
      <XAxis dataKey="name" stroke="#8884d8" />
      <YAxis />
      <Tooltip wrapperStyle={{ width: 100, backgroundColor: '#ccc' }} />
      <Legend width={100} wrapperStyle={{ top: 40, right: 20, backgroundColor: '#f5f5f5', border: '1px solid #d5d5d5', borderRadius: 3, lineHeight: '40px' }} />
      <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
      <Bar dataKey="components" fill="#8884d8" barSize={30} />
    </BarChart>
  )
}

class InfoPanel extends React.Component {
  constructor(props){
    super(props);

    this.state={plotDisplayIVs :new Set()};

  }

  handleVersionClick=(versionId)=>{
    let plotDisplayIVs = this.state.plotDisplayIVs;
    if(plotDisplayIVs.has(versionId))
      plotDisplayIVs.delete(versionId)
    else {
      plotDisplayIVs.add(versionId)
    }
    this.setState({plotDisplayIVs: plotDisplayIVs});
  }

  handlePlot=()=>{


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

                //nodes : {label: , count: }
                let nodes = response.data.nodes.map((e) => ({

                    labels : this.props.labelsUsed.nodeNames.bitsToNamesFlat(e.labels).join(", "),
                  //  labels: this.props.labelsUsed.nodeNames
                    count : e.count
                }));

                let edges =  response.data.edges.map((e) => ({
                    labels : this.props.labelsUsed.edgeNames.bitsToNamesFlat(e.labels).join(", "),
                    count : e.count
                }));

                let stats = {nodes: nodes, edges: edges};
                this.props.handleUpdateStats(id, stats);
                this.props.handleUpdateCardSummary(id, response.data);

                //if()
                console.log("id",id)
                  this.state.plotDisplayIVs.add(id);

            });


        }



        this.props.handleClickVersionCard(id);
    }




    renderVertexCounts(){
        return(
            <Card>
                <Card.Body>

                <ListGroup>
                    {this.props.versionCardsO.getActiveCard().stats.nodes.map((e,i)=>(
                        < ListGroup.Item key={i}>{e.labels + " : " + e.count }</ListGroup.Item>
                    ))}
                </ListGroup>


                <ListGroup>
                    {this.props.versionCardsO.getActiveCard().stats.edges.map((e,i)=>(
                        <ListGroup.Item key={i}>{e.labels + " : " + e.count}</ListGroup.Item>
                    ))}
                </ListGroup>

                </Card.Body>
            </Card>
        );
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
                <Button onClick={this.handlePlot}>Generate Plot</Button>
                </Card.Body>



                {/*<Card.Body>
                    {this.renderVertexCounts()}
                </Card.Body>
                */}

                <Plot1
                  data = {this.props.versionCardsO.cards.filter((vc,i)=>this.state.plotDisplayIVs.has(i)).map((vc,i)=> ({name: i, components : vc.summary.components.mean}) ) }
                />


            </>


        );
    }
}

export {InfoPanel};
