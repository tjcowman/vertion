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

export function equals(set1, set2){
  console.log("EQ TEST",set1, set2)
  if(set1.size !== set2.size){
    return false;
  }
  else {
      set1.forEach((e)=> {
        if(!set2.has(e))
          return false;
      })
  }
  //console.log("ret true")
  return true;
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
