// jshint esnext: true

var http = require("http");
var url = require("url");
var qs = require('query-string');
var mongoose = require('mongoose');

const PORT = process.env.PORT || 5000;
const DBURL = process.env.MONGOLAB_URI;
const DEFAULTURL = process.env.DEFAULT_REDIRECT_URL || "www.google.com";
const PROTOCOL = process.env.LANDING_PROTOCOL || "http:";

mongoose.connect(DBURL);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'DB Connection Error:'));
db.once("open", function() { console.log('Connected to Mongo.'); });

var linkSchema = new mongoose.Schema({
	requestURL: { type: String, unique: true, sparse: true },
	destinationURL: { type: String }
});
var Link = mongoose.model('Link', linkSchema);

function mergeParams(userParams, dbParams) {
	var u = qs.parse(userParams);
	var d = qs.parse(dbParams);
	for (var val in u) { d[val] = d[val] || u[val]; }
	return qs.stringify(d);
}

function handleURL(hostname, pathname, search, res) {
	Link.findOne({ "requestURL": hostname + pathname }).lean()
		.exec(function(err, doc) {
			if (err) throw err;
			var out = doc ? url.parse(PROTOCOL + "//" + doc.destinationURL) : { "hostname": DEFAULTURL, "protocol": PROTOCOL };
			out.search = mergeParams(search, out.search || "");
			res.writeHead(301, {"Location": url.format(out)});
			res.end();
		});
}

var server = http.createServer(function(req, res) {
		var url_parts = url.parse(PROTOCOL + "//" + req.headers.host + req.url);
		handleURL(url_parts.hostname, url_parts.pathname, url_parts.search, res);
}).listen(PORT);
