var sstf = (headInitalPosition, trackSequence) => {
    let headPath = []
    headPath.push(headInitalPosition);
    let trackSequenceCopy = trackSequence.concat();
    for(let i = 0; i < trackSequence.length; i++) {
      let distance = [];
      trackSequenceCopy.forEach(key => {
          distance.push(Math.abs(key - headPath[i]));
      });
      let min = 10000000, minIndex=-1;
      for(let i=0; i< distance.length; i++) {
          if(distance[i] < min){
              min =distance[i];
              minIndex = i;
          }
      }
      headPath.push(trackSequenceCopy[minIndex]);
      trackSequenceCopy.splice(minIndex, 1);
    }
    return headPath;
}

export default sstf;