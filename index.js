/*
*
Server
*/

const http = require('http');
const https = require('https');
const url = require("url");
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./lib/config');
const fs = require('fs');
const handlers = require('./lib/handlers');
const helpers = require('./lib/helpers');

//Instantiate HTTP server
const httpServer = http.createServer((req,res) => {
    unifiedServer(req,res);  
});
//Start HTTP server
httpServer.listen(config.httpPort,() => {
    console.log("Server listening at port "+config.httpPort);
});

const httpsServerOptions = {
    'key' : fs.readFileSync('./https/key.pem'),
    'cert' : fs.readFileSync('./https/cert.pem')
};
//Instantiate HTTPS server
const httpsServer = https.createServer(httpsServerOptions,(req,res) => {
    unifiedServer(req,res);  
});
//Start HTTPS server
httpsServer.listen(config.httpsPort,() => {
    console.log("Server listening at port "+config.httpsPort);
});

const unifiedServer = (req,res) => {

    //get string and parse
    const parsedUrl = url.parse(req.url,true);

    //get the path
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g,'');

    //Get the query string 
    const queryStringObject = parsedUrl.query;

    //Get the method
    const method = req.method.toLowerCase();

    //Get the headers
    const headers = req.headers;
    

    //Get the payload
    const decoder = new StringDecoder('utf-8');
    let buffer = '';
    req.on('data',(data) => {
        buffer += decoder.write(data);
    });
    req.on('end',() => {
        buffer += decoder.end();

        const chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

        const data = {
            'trimmedPath' : trimmedPath,
            'queryStringObject' : queryStringObject,
            'method' : method,
            'headers' : headers,
            'payload' : helpers.parsedJsonToObject(buffer)
        };

        chosenHandler(data,(statusCode,payload) => {
            //Use status code called back by handler, or default to 200
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

            //Use payload called back by handler, or default it to empty object
            payload = typeof(payload) == 'object' ? payload : {};

            //Convert payload into string
            const payloadString = JSON.stringify(payload);

            //Return the respose
            res.setHeader('content-type','application/json');
            res.writeHead(statusCode);
            res.end(payloadString);

            //Log to console
            console.log('Returning the respose: ',statusCode,payloadString);
        });
    });

};


//Router
const router = {
    'ping' : handlers.ping,
    'users' : handlers.users,
    'tokens' : handlers.tokens,
    'checks' : handlers.checks
};