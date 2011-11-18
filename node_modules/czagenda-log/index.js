var colors = require('colors');
var sys = require('sys');
var datetime = require('datetime');

function calledFrom(args, count) {
    return !args || count > 3 ? false : (args.name && args.name != 'forEach' ? args.name : calledFrom(args.caller, count ? count + 1: 1));
}


function record(level, messages, func, file) {
  if (messages.length ==0) {
    return;
  }
  var date = new Date(), 
      color, head, text, space;
  
  head = (datetime.format(date, '%D %T')+' ['+file+'] : ')
  space = (new Array(head.length)).join(' ')+' ';
  head = head.grey;
  
  switch(level) {
    case 1: color = 'red'; break;
    case 2: color = 'red'; break;
    case 3: color = 'red'; break;
    case 4: color = 'magenta'; break;
    case 5: color = 'yellow'; break;
    case 6: color = 'blue'; break;
    case 7: color = 'cyan'; break;
    default: color = 'blue';
  }
  text = [head+messages[0][color]];

  for(var i=1;i<messages.length;i++) {
    if (typeof(messages[i]) === 'number') {
      messages[i]=String(messages[i]);
    }    
    if (typeof(messages[i]) === 'string') {
      lines = messages[i].split('\n');
      for(var j=0,l=lines.length;j<l;j++) {
        text.push(space+lines[j].grey);    
      }
    }
  }
  sys.puts(text.join('\n'));
}

var Log = exports = module.exports = function Log() {
  return {
    alert    : function() { record(1,arguments, arguments.callee ? calledFrom(arguments.callee) : false); },
    critical : function() { record(2,arguments, arguments.callee ? calledFrom(arguments.callee) : false); },
    error    : function() { record(3,arguments, arguments.callee ? calledFrom(arguments.callee) : false); },
    warning  : function() { record(4,arguments, arguments.callee ? calledFrom(arguments.callee) : false); },
    notice   : function() { record(5,arguments, arguments.callee ? calledFrom(arguments.callee) : false); },
    info     : function() { record(6,arguments, arguments.callee ? calledFrom(arguments.callee) : false); },
    debug    : function() { record(7,arguments, arguments.callee ? calledFrom(arguments.callee) : false); },
  }
};


Log.from = function(path) {
  var file = path.split('/').pop().split('.')[0];
  return {
    alert    : function() { record(1,arguments, arguments.callee ? calledFrom(arguments.callee) : false, file); },
    critical : function() { record(2,arguments, arguments.callee ? calledFrom(arguments.callee) : false, file); },
    error    : function() { record(3,arguments, arguments.callee ? calledFrom(arguments.callee) : false, file); },
    warning  : function() { record(4,arguments, arguments.callee ? calledFrom(arguments.callee) : false, file); },
    notice   : function() { record(5,arguments, arguments.callee ? calledFrom(arguments.callee) : false, file); },
    info     : function() { record(6,arguments, arguments.callee ? calledFrom(arguments.callee) : false, file); },
    debug    : function() { record(7,arguments, arguments.callee ? calledFrom(arguments.callee) : false, file); },
  }
};