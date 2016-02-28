var http = require("http");
var url = require("url");
var qs = require('query-string');
var mongoose = require('mongoose');

const PORT = process.env.PORT || 5000;
const MONGODBURI = process.env.MONGOLAB_URI || "mongodb://heroku_761b3pmd:q6r73gmqgklehem4hco9p1haiv@ds019058.mlab.com:19058/heroku_761b3pmd";
const DEFAULTURL = process.env.DEFAULT_REDIRECT_URL || "www.jewelry.com";
const PROTOCOL = process.env.LANDING_PROTOCOL || "http:";

mongoose.connect(MONGODBURI);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'db connection error:'));

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
	Link.findOne({ requestURL: hostname + pathname })
		.select('dest').lean()
		.exec(function(err, result) {
			if (err) throw err;
			result = result || {};
			result.search = mergeParams(search, result.search || "");
			result.protocol = PROTOCOL;
			var urlOut = {
				protocol: result.protocol,
				hostname: result.hostname || DEFAULTURL,
				pathname: result.pathname || "",
				search: result.search || "",
				hash: result.hash || ""
			};
			// console.log(url.format(urlOut));
			res.end(url.format(urlOut));
		});
}

var server = http.createServer(function(req, res) {
	var url_parts = url.parse(req.url);
	handleURL(url_parts.hostname, url_parts.pathname, url_parts.search, res);
	
	// res.writeHead(301, {
// 		"Location": out
// 	});

	// res.end("ok");
}).listen(PORT);
