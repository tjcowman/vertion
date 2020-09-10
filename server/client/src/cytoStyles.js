 
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
            selector: 'edge[color_auto]',
            style: {
                'line-color' : 'data(color_auto)',
                'target-arrow-color' : 'data(color_auto)'  
            }
        },
        {
            selector: 'node[color_auto]',
            style: {
                'background-color' : 'data(color_auto)',
            }
        }
    ]

   
    
    let color_monochrome =  [
        {
            selector: 'edge',
            style: {
                'line-color' : 'gray',  //'mapData(edgeType, 0, 8, red, blue)'
                'target-arrow-color' : 'gray'
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
    
    
    const kc1= "#CD853F";
    const kc2= "#DC143C" ;
    const bc = "#008B8B";
    
    export let color_integration = [
        {
            selector: "node",
            style:{
                'border-color' : 'black',
                'border-width' : '2',
                'background-color' : 'gray'
            }
        },
        
        {
            selector: "edge",
            style:{
                'width' : '3',
                'line-color' : 'gray',
                'target-arrow-color' : 'gray'
            }
        },
        
        {
            selector: "edge[edgeType = 'Harboring']",
            style:{
                'width' : '3',
                'line-style':'dashed'

            }
        },
        {
            selector: "node[nodeType = 'Site']",
            style:{
                shape: 'square',
                'width' : '20',
                'height' : '20'
            }
        },
        {
            selector: "node[nodeType = 'Kinase']",
            style:{
                shape: 'hexagon',
            }
        },
        
        
        {
            legendNameBasic: "Kinase 1",
            selector: "[origin = 'l']",
            style: {
                'background-color': kc1,
                'line-color': kc1,
                'target-arrow-color' : kc1
            }
        },
        {
            legendNameBasic: "Kinase 2",
            selector: "[origin = 'r']",
            style: {
                'background-color': kc2,
                'line-color': kc2,
                'target-arrow-color' : kc2
            }
        },
        {
            legendNameBasic: "Both",
            selector: "[origin = 'b']",
            style: {
                'background-color': bc,
                'line-color': bc,
                'target-arrow-color' : bc
            }
        },
        {
     
            selector: "[queryClass = 'sourceKinase']",
            style: {
            'border-color' : 'black',
            'border-width' : '2',
            'width' : '50',
            'height' : '50',
            'background-color': 'black'
            }
            
        },
        {
     
            selector: "[queryClass = 'sinkProtein']",
            style: {
                'border-color' : 'black',
                'border-style' : 'double',
                'border-width' : '4'
            }
            
        }
    ]
    

    
    export let themes = { None: color_monochrome, auto: color_auto, direction: color_direction
        
    }
    
    export let colors = { None: color_monochrome, auto: color_auto, direction: color_direction
        
    }
    
    export let labels = { None: [], 'Uniprot ID': label_uniprot, 'Protein Name' : label_proteinName
        
    }
    
    export let sizes = { Constant: [], 'Node Score' : size_score
        
    }
    
    
/*    
    export let addHighlight=[{
        css: {
            'overlay-color': 'blue',
            'overlay-opacity': 0.5,
            'overlay-padding': 5,
        }
    }]*/
    
    export let base = [
        {
            selector: "node",
            style: {
                'width':'30',
                'height': '30'
            }
            
        },
    
        {
            selector: 'edge[edgeType = "Phosphorylation"]',
            style: {
//                 'line-color' : 'orange',
                    'curve-style': 'bezier',
                 'target-arrow-shape': 'triangle'
            }
        
        },
//         {
//             selector: ':selected',
//             css: {
//                 'overlay-color': 'blue',
//                 'overlay-opacity': 0.5,
//                 'overlay-padding': 5,
//             }
// 
//         },
        {
            selector: '[highlight]',
            css: {
                'overlay-color': 'data(highlight)',
                'overlay-opacity': 0.5,
                'overlay-padding': 5,
            }

        }
    ]
    
    
// }
