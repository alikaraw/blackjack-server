let http = require("http");
let url = require("url");
let fs = require("fs");
let mySocket = require("./my_socket");

/**
 * Creates a server
 * @param {Array} actions an array of all the api actions the server can respond to 
 * @param {Number} port what port set the server to lisen to `(default: 8080)`
 * @param {String} fileDirectory path to the directory where all the static files are `(default: 'static_files/')`
 */
exports.createServer = (actions, port = 8080, fileDirectory = 'static_files') => {
    let server = http.createServer((req, res)=> {
        let q = url.parse(req.url, true);
        if(q.pathname.startsWith('/api')) {
            let action = q.pathname.substring(4);
            if (!actions[action]) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('no such action');
                return;
            }
            
            actions[action](req, res, q);
        } else {
            let path = q.pathname;
            if(path == "/") {
                path = "authentication.html";
            }
            
            let indexOfDot = path.lastIndexOf(".");
            if (indexOfDot == -1) {
                res.writeHead(400);
                res.end();
                return;
            }

            let extension = path.substring(indexOfDot);
            let contentTypes = {
                ".html" : "text/html",
                ".css" : "text/css",
                ".js" : "text/javascript",
                ".jpg" : "image/jpg",
                ".jpeg" : "image/jpeg",
                ".png" : "image/png",
                ".svg" : "image/svg+xml",
                ".json" : "application/json"
            }

            if(!contentTypes[extension]) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('Invalid Content Type!');
                return;
            }

            fs.readFile(`${fileDirectory}/${path}`, (err, content) => {
                if(err) {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('Can\'t find requested file.');
                    return;
                }

                res.writeHead(200, {'Content-Type': contentTypes[extension]});
                res.end(content);
            })
        }
    })
    
    mySocket.CreateSocket(server);

    server.listen(port);
}