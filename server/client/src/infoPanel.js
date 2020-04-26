import {} from 'react-bootstrap'
import React from 'react';
import Axios from 'axios';

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ComposedChart, Line, Scatter } from 'recharts';
//const {ComposedChart, Line, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend} = Recharts;
import {Card, ListGroup, Button} from 'react-bootstrap';

import './infoPanel.css';
//tmp const data = [







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

const NodePlot=(props)=>{
  return(
    <div>
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
            <Bar dataKey="mean"  fill="#8884d8" barSize={20} />
          </BarChart>
      </div>,
      <div>
          {[...props.potentialNodeDisplayLabels].map((label,i)=>(
            <Button key={i}>{props.labelsUsed.nameLookupNode(label)}</Button>
          ))}
      </div>
    </div>

  )
}


//Takes a data [ {measure,value}]
const Plot1=(props)=>{
  return(

    <ComposedChart width={600} height={300} data={props.data} margin={{
          top: 20, right: 20, bottom: 20, left: 20
        }}
    >
      {console.log("pprops",props)}

        <XAxis dataKey="name" stroke="#8884d8" type='category'/>
        <YAxis yAxisId="left" orientation="left"  />
        <YAxis yAxisId="right" orientation="right" allowDecimals={false}/>
        <Legend />
        <Tooltip />
        <CartesianGrid stroke="#ccc" />
        <Bar dataKey="mean" yAxisId="left"  fill="#8884d8" barSize={20} />
        <Scatter type='monotone' yAxisId="right" dataKey='number' />

    </ComposedChart>
  )
}

class InfoPanel extends React.Component {
  constructor(props){
    super(props);

    this.state={
      plotDisplayIVs :new Set(),
      nodeDisplayLabels : new Set(),
      edgeDisplayLabels : new Set()
    };


  }

  handleVersionClick=(versionId)=>{
    let plotDisplayIVs = this.state.plotDisplayIVs;
    if(plotDisplayIVs.has(versionId))
      plotDisplayIVs.delete(versionId)
    else {
      plotDisplayIVs.add(versionId)
    }
    this.setState({plotDisplayIVs: plotDisplayIVs});

    //calculate the potential nodeLabels that could be plotted
    let potentialNodeDisplayLabels = new Set();
    this.getPlottedCards().forEach((c)=> c.nodes.forEach((n)=>
        potentialNodeDisplayLabels.add(n.labels)
      )
    )
    this.setState({potentialNodeDisplayLabels: potentialNodeDisplayLabels});

  }

  //calculate the potential nodeLabels that could be plotted
  /*
  let potentialNodeDisplayLabels = new Set();
  this.getPlottedCards().forEach((c)=> c.nodes.forEach((n)=>
      potentialNodeDisplayLabels.add(n.labels)
    )
  )
  this.setState({potentialNodeDisplayLabels: potentialNodeDisplayLabels});
*/

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
                        handleClickVersionCard = {this.handleVersionClick }

                    />

                </Card>
                {/*}<Button onClick={this.handlePlot}>Generate Plot</Button>*/}
                </Card.Body>

                <NodePlot data={this.getPlottedCards().map((c,i)=>(
                  {name:'set '+i, nodes :c.nodes}
                  ))}
                  labelsUsed={this.props.labelsUsed}
                  potentialNodeDisplayLabels ={this.props.versionCardsO.getSummaryLabelsUsed('nodes','any',this.state.plotDisplayIVs)}

                />

                {/*<Plot1
                  data = { this.getPlottedCards().map((c,i) => ({name:'set '+i, mean:c.components.mean,  number:c.components.num})) }
                />*/}


            </>


        );
    }
}

export {InfoPanel};
