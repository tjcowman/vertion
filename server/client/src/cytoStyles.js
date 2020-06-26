 
//TODO: Implement some sort of customizable legend 
 
    let color_auto = [
        {
            selector: 'edge',
            style: {
                'line-color' : 'data(color_auto)'  //'mapData(edgeType, 0, 8, red, blue)'
            }
        },
        {
            selector: 'node',
            style: {
                'background-color' : 'data(color_auto)',
            }
        }
    ]

    let auto = [
        {
            selector: 'edge',
            style: {
                'line-color' : 'data(color_auto)'  //'mapData(edgeType, 0, 8, red, blue)'
            }
        },
        {
            selector: 'node',
            style: {
                'label': 'data(label)',
                'background-color' : 'data(color_auto)',
                'width': '20px',
                'height': '20px'
            }
        
        },
        {
            selector: 'node[pLabel]',
            style:{
                'label': 'data(pLabel)',
                'background-color' : 'data(color_auto)'
            }
        },
        {
            selector: 'node[nodeScore]',
            style: {
                'width' : 'data(nodeScore)',
                'height' : 'data(nodeScore)',
                }
            
        },
        {
            selector: "node[scored = 0 ]",
                style: {
                    'border-color' : 'black',
                    'border-width' : '2'
                }
        },
        {
            selector: "node[scored = 1 ]",
                style: {
                    'border-color' : 'black',
                    'border-width' : '2'
                }
        }
    ]
    
    let color_monochrome =  [
        {
            selector: 'edge',
            style: {
                'line-color' : 'black'  //'mapData(edgeType, 0, 8, red, blue)'
            }
        },
        {
        selector: 'node',
            style: {
                'background-color' : 'black',
            }
        }
    ]
    
    let regulationDirection = [
        {
            selector: 'node[nodeScore]',
            style: {
                'width' : 'data(nodeScore)',
                'height' : 'data(nodeScore)',
                }
            
        },
    
        {
            selector: "node[direction = 0 ]",
                style: {
                    'background-color' : 'green'
                }
        },
                {
            selector: "node[direction = 1 ]",
                style: {
                    'background-color' : 'red'
                }
        },
                {
            selector: "node[direction = 2 ]",
                style: {
                    'background-color' : 'orange'
                }
        },
    ]
    
    let color_direction = [    
        {
            selector: "node[direction = 0 ]",
                style: {
                    'background-color' : 'green'
                }
        },
                {
            selector: "node[direction = 1 ]",
                style: {
                    'background-color' : 'red'
                }
        },
                {
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
    
//     export let all = {
//         auto:auto, monochrome :monochrome, regulationDirection: regulationDirection
//     }
    
    export let colors = { auto: color_auto, monochrome: color_monochrome, direction: color_direction
        
    }
    
    export let labels = { uniprot : label_uniprot, proteinName : label_proteinName 
        
    }
    
    
    
// }
