var afb = new AFB("api", "mysecret");
var ws;
var evtIdx = 0;
var count = 0;


//**********************************************
// Logger
//**********************************************
var log = {
  command: function (api, verb, query) {
    console.log("subscribe api=" + api + " verb=" + verb + " query=", query);
    var question = urlWS + "/" + api + "/" + verb + "?query=" + JSON.stringify(query);
    log._write("question", count + ": " + log.syntaxHighlight(question));
  },

  event: function (obj) {
    console.log("gotevent:" + JSON.stringify(obj));
    log._write("outevt", (evtIdx++) + ": " + JSON.stringify(obj));
  },

  reply: function (obj) {
    console.log("replyok:" + JSON.stringify(obj));
    log._write("output", count + ": OK: " + log.syntaxHighlight(obj));
  },

  error: function (obj) {
    console.log("replyerr:" + JSON.stringify(obj));
    log._write("output", count + ": ERROR: " + log.syntaxHighlight(obj));
  },

  _write: function (element, msg) {
    var el = document.getElementById(element);
    el.innerHTML += msg + '\n';

    // auto scroll down
    setTimeout(function () {
      el.scrollTop = el.scrollHeight;
    }, 100);
  },

  syntaxHighlight: function (json) {
    if (typeof json !== 'string') {
      json = JSON.stringify(json, undefined, 2);
    }
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
      var cls = 'number';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'key';
        } else {
          cls = 'string';
        }
      } else if (/true|false/.test(match)) {
        cls = 'boolean';
      } else if (/null/.test(match)) {
        cls = 'null';
      }
      return '<span class="' + cls + '">' + match + '</span>';
    });
  },
};

//**********************************************
// Generic function to call binder
//***********************************************
function callbinder(api, verb, query) {
  log.command(api, verb, query);

  // ws.call return a Promise
  return ws.call(api + '/' + verb, query)
    .then(function (res) {
      log.reply(res);
      count++;
      return res;
    })
    .catch(function (err) {
      log.reply(err);
      count++;
      throw err;
    });
};

//**********************************************
//
//**********************************************
/*
var topo = null;

function getTopo() {
  callbinder('supervisor', 'list', null)
    .then(list => {
      var reqs = [];
      for (pid in list.response) {
        this.pid = pid;
        reqs.push(
          callbinder('supervisor', 'config', {
            "pid": pid
          })
          .then((res) => {
            return {
              'pid': this.pid,
              'ws_servers': res.response.ws_servers,
              'ws_clients': res.response.ws_clients
            }
          })
        );
      };
      return Promise.all(reqs);
    })
    .then(daemons => {
      console.log("daemons count ", daemons.length);
      daemons.forEach(dd => {
        console.log(dd);
      });
      topo = daemons;
    })
    .catch(err => {
      console.log()
    });
};
*/




//**********************************************
// Init - establish Websocket connection
//**********************************************
function init(elemID, api, verb, query) {

  function onopen() {
    // Request initial authorization
    callbinder('xds', 'auth', '');

    document.getElementById("main").style.visibility = "visible";
    document.getElementById("connected").innerHTML = "Binder WS Active";
    document.getElementById("connected").style.background = "lightgreen";
    ws.onevent("*", log.event);
  }

  function onabort() {
    document.getElementById("main").style.visibility = "hidden";
    document.getElementById("connected").innerHTML = "Connected Closed";
    document.getElementById("connected").style.background = "red";
  }

  ws = new afb.ws(onopen, onabort);
}
