/* Clean slate: if the Sheet cannot be reached on the first load, show an empty board with the offline notice,
   never made-up sample orders. */
fallback=function(){live=false;orders=[];loaded=true;renderBoard()};
