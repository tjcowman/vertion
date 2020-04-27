import {} from 'react-bootstrap'
import React from 'react';
import Axios from 'axios';

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ComposedChart, Line, Scatter } from 'recharts';
//const {ComposedChart, Line, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend} = Recharts;
import {Card, ListGroup, Button} from 'react-bootstrap';

import './infoPanel.css';
//tmp const data = [


import * as setLib from './setLib.js'




class GraphViewDisplay extends React.Component{

    render(){
        return(
            <div className="graphViewContainer ">

                {console.log("HCV", this),

                  this.props.versionCardsO.cards.map((e,i) =>(
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
const NodePlot=(props)=>{
    //console.log("PLT", props)
  return(
      <div>
          <BarChart
            width={600} height={300} data={props.data}
          >
            {console.log("pprops",props)}
            <XAxis dataKey="name" stroke="#8884d8" type='category'/>
            <YAxis />
            <Legend />
            <Tooltip />
            <CartesianGrid stroke="#ccc" />
            {[...props.nodeDisplayLabels ].map((e,i)=>
                <Bar dataKey={e}  fill={COLORS[i % COLORS.length]} barSize={20} />
            )}
          </BarChart>
      </div>
  )
}

const EdgePlot=(props)=>{
  return(
      <div>
          <BarChart
            width={600} height={300} data={props.data}
          >
            {console.log("pprops",props)}
            <XAxis dataKey="name" stroke="#8884d8" type='category'/>
            <YAxis />
            <Legend />
            <Tooltip />
            <CartesianGrid stroke="#ccc" />
            {[...props.edgeDisplayLabels ].map((e,i)=>
                <Bar dataKey={e}  fill={COLORS[i % COLORS.length]} barSize={20} />
            )}
          </BarChart>
      </div>
  )
}

/*
{ //console.log(nodes.count),
  [...props.potentialNodeDisplayLabels].map((label) =>(
  <Bar dataKey="nodes.count"  fill="#8884d8" barSize={20} />
))}
*/


class InfoPanel extends React.Component {
  constructor(props){
    super(props);

    this.state={
      plotDisplayIVs :new Set(),
      potentialNodeDisplayLabels : new Set(),
      nodeDisplayLabels : new Set(),
      potentialEdgeDisplayLabels : new Set(),
      edgeDisplayLabels : new Set()
    };


  }

  componentDidUpdate(prevProps, prevState){
  //  console.log("CDUO",prevProps, prevState);

      let potentialNodeDisplayLabels = new Set();
      let potentialEdgeDisplayLabels = new Set();
    //  console.log("PLOTCWRDS",  this.getPlottedCards());
      this.getPlottedCards().forEach((c)=> c.nodes.forEach((n)=>
          potentialNodeDisplayLabels.add(this.props.labelsUsed.nameLookupNode(n.labels).join(':'))
        )
      )

      this.getPlottedCards().forEach((c)=> c.edges.forEach((e)=>
          potentialEdgeDisplayLabels.add(this.props.labelsUsed.nameLookupEdge(e.labels).join(':'))
        )
      )

      //potentialEdgeDisplayLabels = setLib.intersection(potentialNodeDisplayLabels, )

      //console.log("potSet:", potentialEdgeDisplayLabels);
      //if(typeof(prevProps.potentialNodeDisplayLabels) != 'undefined')
        if( !setLib.equals(prevState.potentialNodeDisplayLabels,potentialNodeDisplayLabels))
        {
      //    console.log("set state called")
        let nodeDisplayLabels = setLib.intersection(potentialNodeDisplayLabels, prevState.nodeDisplayLabels);

          this.setState({potentialNodeDisplayLabels: potentialNodeDisplayLabels, nodeDisplayLabels: nodeDisplayLabels});
        }
        if( !setLib.equals(prevState.potentialEdgeDisplayLabels,potentialEdgeDisplayLabels))
        {
            let edgeDisplayLabels = setLib.intersection(potentialEdgeDisplayLabels, prevState.edgeDisplayLabels);

            this.setState({potentialEdgeDisplayLabels: potentialEdgeDisplayLabels, edgeDisplayLabels: edgeDisplayLabels});
        }
  //  }

  }

  checkNodeLabelToggle=(name)=>{
    return this.state.nodeDisplayLabels.has(name);
  }

  handleNodeLabelToggle=(name)=>{
  //  console.log("NL",this.state.nodeDisplayLabels)

    let nodeDisplayLabels= this.state.nodeDisplayLabels;

    if(!this.checkNodeLabelToggle(name))
      nodeDisplayLabels.add(name);
    else
      nodeDisplayLabels.delete(name);

    this.setState({nodeDisplayLabels:nodeDisplayLabels});
  }

  checkEdgeLabelToggle=(name)=>{
    return this.state.edgeDisplayLabels.has(name);
  }

  handleEdgeLabelToggle=(name)=>{
    let edgeDisplayLabels= this.state.edgeDisplayLabels;

    if(!this.checkEdgeLabelToggle(name))
      edgeDisplayLabels.add(name);
    else
      edgeDisplayLabels.delete(name);

    this.setState({edgeDisplayLabels:edgeDisplayLabels});
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

    //Gets the versionCards that should be plotted
    getPlottedCards=()=>{
  //    console.log( "vercard",this.props.versionCardsO.cards)
      return this.props.versionCardsO.cards.filter((vc,i)=>this.state.plotDisplayIVs.has(i) && vc.summary ).map((vc) => vc.summary);
    }



    formatNodeSummarys=()=>{
      let formattedSummarys=[];
      //console.log("FNS", this.getPlottedCards())
      let cards = this.getPlottedCards();

      for (let ci=0; ci<cards.length; ++ci){
        formattedSummarys.push({name: cards[ci].name});
    //    console.log("ci",ci);
        for(let ni=0; ni<cards[ci].nodes.length; ++ni ){
          let name =this.props.labelsUsed.nameLookupNode(cards[ci].nodes[ni].labels);
          //console.log("n",name)
          formattedSummarys[ci][name] = cards[ci].nodes[ni].count;
        }


      }
      return(formattedSummarys);
    }


    formatEdgeSummarys=()=>{
      let formattedSummarys=[];
      //console.log("FNS", this.getPlottedCards())
      let cards = this.getPlottedCards();

      for (let ci=0; ci<cards.length; ++ci){
        formattedSummarys.push({name: cards[ci].name});
    //    console.log("ci",ci);
        for(let ni=0; ni<cards[ci].edges.length; ++ni ){
          let name =this.props.labelsUsed.nameLookupEdge(cards[ci].edges[ni].labels);
          //console.log("n",name)
          formattedSummarys[ci][name] = cards[ci].edges[ni].count;
        }


      }
      return(formattedSummarys);
    }


    render(){
        return(
//             console.log("rendering main", this.props),
//this.formatNodeSummarsy(),
            <>
                <Card.Body>
                <Card>
                <Card.Header>Integrated Networks</Card.Header>


                    <GraphViewDisplay
                        versionCardsO={this.props.versionCardsO}
                        activeVersionCard={this.props.versionCardsO.activeCard}
                        displayVersions= {this.state.plotDisplayIVs}
                        handleClickVersionCard = {this.handleVersionClick }

                    />

                </Card>
                {/*}<Button onClick={this.handlePlot}>Generate Plot</Button>*/}
                </Card.Body>

                <div>
                    {[...this.state.potentialNodeDisplayLabels].map((label,i)=>(
                      <Button onClick={()=>this.handleNodeLabelToggle(label)} className = {this.checkNodeLabelToggle(label) ? "active btn " : "btn " } key={i}>{label}</Button>
                    ))}
                </div>

                <NodePlot data={this.formatNodeSummarys()}
                  potentialNodeDisplayLabels ={this.state.potentialNodeDisplayLabels}
                  nodeDisplayLabels = {this.state.nodeDisplayLabels}
                />


                <div>
                    {[...this.state.potentialEdgeDisplayLabels].map((label,i)=>(
                      <Button onClick={()=>this.handleEdgeLabelToggle(label)} className = {this.checkEdgeLabelToggle(label) ? "active btn " : "btn " } key={i}>{label}</Button>
                    ))}
                </div>

                <EdgePlot data={this.formatEdgeSummarys()}
                  potentialEdgeDisplayLabels ={this.state.potentialEdgeDisplayLabels}
                  edgeDisplayLabels = {this.state.edgeDisplayLabels}
                />

                {/*<Plot1
                  data = { this.getPlottedCards().map((c,i) => ({name:'set '+i, mean:c.components.mean,  number:c.components.num})) }
                />*/}


            </>


        );
    }
}

export {InfoPanel};
