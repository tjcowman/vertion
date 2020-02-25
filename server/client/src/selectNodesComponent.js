import React from 'react';

import BootstrapTable from 'react-bootstrap-table-next';
import paginationFactory from 'react-bootstrap-table2-paginator';
import filterFactory, { textFilter } from 'react-bootstrap-table2-filter';

function getColumns(){
    let col = [
        {
            dataField: "name",
            text: "name",
             filter: textFilter()
        },
        {
            dataField: "labelsNames",
            text: "labels",
             filter: textFilter()
        },
//         {
//             dataField: "value",
//             text: "value"
//         }
//     
    ]   

    return col;
}

const selectRow = {
    mode: 'checkbox',
//     onSelect={}
    
    onSelect: (row, isSelect, rowIndex,e) => {
//         console.log(props)
         this.props.selectNodes();
// //         console.log(row, isSelect, rowIndex, e)
//         
    },
    //   selected: [1],
    clickToSelect: true
};


//{{mode: 'checkbox', onSelect: (row, isSelect, rowIndex,e) => {this.props.selectNodes(row.id)} }}

class SelectNodesComponent extends React.Component{ 

    constructor(props){
        super(props)
    }
    
    render(){
//         console.log("AN", this.props.allNodes)
        return(
            <div>
            
            <BootstrapTable  
                rowClasses="nodeSelectItem" 
                selectRow={{
                    mode: 'checkbox',  
                    clickToSelect: true, 
                    hideSelectAll: true,
                    onSelect: (row, isSelect, rowIndex,e) => {
//                          console.log(row, isSelect, rowIndex, e)
                        if(isSelect){
//                             console.log("add")
                            this.props.selectNodes(row.id)
//                             
                        }
                        else{
//                             console.log("rem")
                            this.props.unSelectNodes(row.id)
                        }
                        
                    } 
                }}  
                striped  
                keyField='id' 
                data={ this.props.allNodes} 
                columns={getColumns()}  
                pagination={ paginationFactory()}
                filter={ filterFactory() }   
            /> 
            </div>
        );
    }
}

export default SelectNodesComponent;
