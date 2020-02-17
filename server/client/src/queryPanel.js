import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Form,Col,Row} from 'react-bootstrap';

import React from 'react';
import ReactDOM from 'react-dom'; 
import Axios from 'axios';
 
import BootstrapTable from 'react-bootstrap-table-next';
import paginationFactory from 'react-bootstrap-table2-paginator';
import filterFactory, { textFilter } from 'react-bootstrap-table2-filter';
    


function getColumns(data){
    let col=[]
    console.log(data[0])
    for(let e in data[0]){
        console.log(e)
        
        if(e !== "row")
            col.push({"dataField":e, "text":e});
        
        if (e ==="id")
            col[col.length-1]["filter"]=textFilter();
    }
        
        
    console.log(col);    
    return col;
}

// NOTE: This is because the default size per page renderer seems to refresh the page on clicking it
const sizePerPageRenderer = ({
  options,
  currSizePerPage,
  onSizePerPageChange
}) => (
  <div className="btn-group" role="group">
    {
      options.map(option => (
        <button
          key={ option.text }
          type="button"
          onClick={ () => onSizePerPageChange(option.page) }
          className={ `btn ${currSizePerPage === `${option.page}` ? 'btn-secondary' : 'btn-selected'}` }
        >
          { option.text }
        </button>
      ))
    }
  </div>
);

const options = {
  sizePerPageRenderer
};

class QueryPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
        versions: [],
        source: "[ ]",
        alpha: .15,
        epsilon: 1e-5,
        topk: 10,
        result: [{"row":null, "id":null, "value":null}],
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

    try{
        let versions = this.props.getSelectedVersions();
        if(versions.length === 0)
        {
            this.setState({result:  [{"row":null, "id":null, "value":null}]});
            return;
        }
            
        
        let command = {cmd:"rwr", versions:versions, alpha:Number(this.state.alpha), epsilon:Number(this.state.epsilon), topk:Number(this.state.topk), source:JSON.parse(this.state.source)}; 
        console.log(JSON.stringify(command))
        console.log(JSON.parse(this.state.source))
    
        Axios.post('http://localhost:9060', JSON.stringify(command)).then((response)=>{
            
            response.data.weights.forEach((e,i) => e["row"]=i  );
            
            this.setState({result: response.data.weights})
          console.log(this.state.result);
        });
      
    }
    catch(err){
        
    }
 
    event.preventDefault();
  }

  render() {
    return(
        <Form className="card-body">
            <div className="card">
                <div className="card-body"> 
                    <Row>
                    {/*  <Col>Version<Form.Control name="version" value={this.state.version} onChange={(e) =>this.handleChange(e)} /></Col>*/}
                        <Col>Source<Form.Control name="source" value={this.state.source} onChange={(e) =>this.handleChange(e)} /></Col>
                        <Col>Alpha <Form.Control  name="alpha"  value={this.state.alpha} onChange={(e) =>this.handleChange(e)} /> </Col>
                        <Col>Epsilon<Form.Control   name="epsilon"  value={this.state.epsilon} onChange={(e) =>this.handleChange(e)} /></Col>
                        <Col>Top k<Form.Control   name="topk"  value={this.state.topk} onChange={(e) =>this.handleChange(e)} /></Col>
                    </Row>

                
                </div>
            </div>

            <Button className="form-control" variant="primary" onClick={(e) =>this.handleSubmit(e)} >Submit</Button>

            <div  style={{ marginTop: 20 }}>
            <BootstrapTable striped condensed keyField='row' data={ this.state.result} columns={ getColumns(this.state.result)}  pagination={ paginationFactory(options)} filter={ filterFactory() }   />
            </div>
       

        </Form>

    );
  }
}


export default QueryPanel;
