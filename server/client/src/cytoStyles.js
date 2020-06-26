 
export let all = { 
    auto : [

        {
            selector: 'edge',
            style: {
                'line-color' : 'data(color)'  //'mapData(edgeType, 0, 8, red, blue)'
            }
        },
        {
        selector: 'node',
        style: {
            'label': 'data(label)',
            'background-color' : 'data(color)',
            'width': '20px',
            'height': '20px'
        }
        
        },
        {
            selector: 'node[pLabel]',
            style:{
                'label': 'data(pLabel)',
                'background-color' : 'data(color)'
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
    //                 'background-color' : 'white',
                    'border-color' : 'black',
                    'border-width' : '2'
                }
        },
        {
            selector: "node[scored = 1 ]",
                style: {
    //                 'background-color' : 'blue',
                    'border-color' : 'black',
                    'border-width' : '2'
                }
        }
    ]
    ,
    test : [
    ]
}
