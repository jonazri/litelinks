var http = require("http");
var url = require("url");
var qs = require('query-string');
var mongoose = require('mongoose');
var util = require('util');

const PORT = process.env.PORT || 5000;
const MONGODBURI = process.env.MONGOLAB_URI || "mongodb://heroku_761b3pmd:q6r73gmqgklehem4hco9p1haiv@ds019058.mlab.com:19058/heroku_761b3pmd";
const DEFAULTURL = process.env.DEFAULT_REDIRECT_URL || "www.jewelry.com";
const PROTOCOL = process.env.LANDING_PROTOCOL || "http:";
const IGNOREURLS = process.env.IGNORE_URLS || ["/favicon.ico", "robots.txt"];

mongoose.connect(MONGODBURI);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'db connection error:'));

console.log("\n\n\n------NEW INSTANCE LAUNCHED------\n\n\n");
db.once("open", function() {
	console.log(`Connected to MongoDB at ${MONGODBURI}.`);
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
			
			res.writeHead(200, {"Content-Type": "text/plain"});
			res.end(`301 would go to ${url.format(result)}.`);
		});
}

var server = http.createServer(function(req, res) {

	if (IGNOREURLS.indexOf(req.url) > -1) {
		res.writeHead(404, {"Content-Type": "text/plain"});
		res.end();
	} else {
		console.log("\n\n------NEW REQUEST MADE------\n\n");
		var url_parts = url.parse("http://" + req.headers.host + req.url);
		console.log("Parts %j", url_parts);
		handleURL(url_parts.hostname, url_parts.pathname, url_parts.search, res);
	}
}).listen(PORT);
