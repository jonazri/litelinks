var http = require("http");
var url = require("url");
var qs = require('query-string');
var mongoose = require('mongoose');
var util = require('util');

const PORT = process.env.PORT || 5000;
const MONGODBURI = process.env.MONGOLAB_URI;
const DEFAULTURL = process.env.DEFAULT_REDIRECT_URL || "www.jewelry.com";
const PROTOCOL = process.env.LANDING_PROTOCOL || "http:";
const IGNOREURLS = process.env.IGNORE_URLS || ["/favicon.ico", "/robots.txt"];

mongoose.connect(MONGODBURI);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'db connection error:'));

db.once("open", function() {
	console.log(`Connected to Mongo.`);
});

var linkSchema = new mongoose.Schema({
	requestURL: String,
	dest: {
		hostname: String,
		pathname: String,
		search: String,
		hash: String
	}
});
var Link = mongoose.model('Link', linkSchema);

function mergeParams(userParams, dbParams) {
	var u = qs.parse(userParams);
	var d = qs.parse(dbParams);
	for (var val in u) {
		d[val] = d[val] || u[val];
	}
	return qs.stringify(d);
}

function handleURL(hostname, pathname, search, res) {
	Link.findOne({ "requestURL": hostname + pathname })
		.select('dest').lean()
		.exec(function(err, doc) {
			if (err) throw err;
			result = doc ? doc.dest : { hostname: DEFAULTURL };
			result.search = mergeParams(search, result.search || "");
			result.protocol = PROTOCOL;
			
			res.writeHead(301, {"Location": url.format(result)});
			res.end();
		});
}

var server = http.createServer(function(req, res) {

	if (IGNOREURLS.indexOf(url.parse(req.url).pathname) > -1) {
		res.writeHead(404, {"Content-Type": "text/plain"});
		res.end("404 Not Found");
	} else {
		// console.log("\n----NEW REQUEST----\n");
		var url_parts = url.parse("http://" + req.headers.host + req.url);
		// console.log("Request URL JSON: %j", url_parts);
		handleURL(url_parts.hostname, url_parts.pathname, url_parts.search, res);
	}
}).listen(PORT);
