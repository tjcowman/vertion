//Useful functions todo: move somewhere more sensible

export function intersection(set1, set2){
//     console.log("s", set1, set2)
    
    let s = new Set();
    
    set1.forEach((e) => { 
        if (set2.has(e))
            s.add(e);
    })
    
    return s;
}

export function union(set1, set2){
//     console.log("s", set1, set2)
    
    let s = new Set();
    
    set1.forEach((e) => { 
        s.add(e);
    })
    set2.forEach((e) => {
        s.add(e)
    })
    
    return s;
}



