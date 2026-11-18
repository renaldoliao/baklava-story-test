/* Details Tolgay confirmed on Nov 16: the street address with Ste B, the six trays as the built-in menu, and the same pickup times as the order page (9:30 am to 5:30 pm every half hour, then 5:45 pm). Loaded before j5.js so it replaces the older values from j1.js and j4.js. */
ADDRESS='1830 Harrison St, Ste B';
DEFAULTS=[['SP','Small tray, Pistachio',1,27.5],['SW','Small tray, Walnut',1,27.5],['MP','Medium tray, Pistachio',1,74.5],['MW','Medium tray, Walnut',1,74.5],['LP','Large tray, Pistachio',1,107.5],['LW','Large tray, Walnut',1,107.5]];
prods=decorate(DEFAULTS.map(function(d){return {code:d[0],name:d[1],pieces:d[2],price:d[3],on:true,gone:false}}));
slotList=function(){var a=[],h;for(h=9;h<18;h++){if(h>9)a.push(pad(h)+':00');a.push(pad(h)+':30')}a.push('17:45');return a};
