 
//TODO: Implement some sort of customizable legend 
 
    let size_score = [
        {
            selector: 'node[scoreNorm]',
            style: {
                'height': 'data(scoreNorm)',
                'width': 'data(scoreNorm)'
            }
        }
    ]
 
    let color_auto = [
        {
            selector: 'edge',
            style: {
                'line-color' : 'data(color_auto)',
                'source-arrow-color' : 'data(color_auto)'  
            }
        },
        {
            selector: 'node',
            style: {
                'background-color' : 'data(color_auto)',
            }
        }
    ]

   
    
    let color_monochrome =  [
        {
            selector: 'edge',
            style: {
                'line-color' : 'gray'  //'mapData(edgeType, 0, 8, red, blue)'
            }
        },
        {
        selector: 'node',
            style: {
                'background-color' : 'gray',
            }
        }
    ]
    
    let color_direction = [    
        {
            legendName: "Increased",
            selector: "node[direction = 0 ]",
                style: {
                    'background-color' : 'green'
                }
        },
        {
            legendName: "Decreased",
            selector: "node[direction = 1 ]",
                style: {
                    'background-color' : 'red'
                }
        },
        {
            legendName: "Both",
            selector: "node[direction = 2 ]",
                style: {
                    'background-color' : 'orange'
                }
        },
    ]
    
    let label_uniprot = [
        {
            selector: 'node',
            style: {
                'label': 'data(label)',
            }
        
        }
        
    ]
    
    let label_proteinName = [
        {
            selector: 'node',
            style: {
                'label': 'data(label)',
            }
        
        },
        {
            selector: 'node[pLabel]',
            style:{
                'label': 'data(pLabel)',
            }
        }
    ]
    
    export let color_union = [
        {
            legendName: "Kinase 1",
            selector: "[origin = 'l']",
            style: {
                'background-color': 'blue',
                'line-color': 'blue',
                'source-arrow-color' : 'blue'
            }
        },
        {
            legendName: "Kinase 2",
            selector: "[origin = 'r']",
            style: {
                'background-color': 'yellow',
                'line-color': 'yellow',
                'source-arrow-color' : 'yellow'
            }
        },
        {
            legendName: "Both",
            selector: "[origin = 'b']",
            style: {
                'background-color': 'green',
                'line-color': 'green',
                'source-arrow-color' : 'green'
            }
        },
    ]
    
    export let colors = { none: color_monochrome, auto: color_auto, direction: color_direction
        
    }
    
    export let labels = { none: [], uniprot : label_uniprot, proteinName : label_proteinName
        
    }
    
    export let sizes = { constant: [], score : size_score
        
    }
    
    export let base = [
        {
            selector: 'edge[edgeType = "Phosphorylation"]',
            style: {
//                 'line-color' : 'orange',
                'curve-style': 'bezier',
                 'source-arrow-shape': 'triangle'
            }
        
        }
    ]
    
    
// }
