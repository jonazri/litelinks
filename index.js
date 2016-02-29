var http = require("http");
var url = require("url");
var qs = require('query-string');
var mongoose = require('mongoose');

const PORT = process.env.PORT || 5000;
const DBURL = process.env.MONGOLAB_URI || "mongodb://heroku_761b3pmd:q6r73gmqgklehem4hco9p1haiv@ds019058.mlab.com:19058/heroku_761b3pmd";
const DEFAULTURL = process.env.DEFAULT_REDIRECT_URL;
const PROTOCOL = process.env.LANDING_PROTOCOL || "http:";

mongoose.connect(DBURL);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'db connection error:'));

db.once("open", function() {
	console.log(`Connected to Mongo.`);
});

var linkSchema = new mongoose.Schema({
	requestURL: { type: String, unique: true, sparse: true },
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
			var out = doc ? doc.dest : { hostname: DEFAULTURL };
			out.search = mergeParams(search, out.search || "");
			out.protocol = PROTOCOL;
			res.writeHead(301, {"Location": url.format(out)});
			res.end();
		});
}

var server = http.createServer(function(req, res) {

		var url_parts = url.parse("http://" + req.headers.host + req.url);
		handleURL(url_parts.hostname, url_parts.pathname, url_parts.search, res);
	
}).listen(PORT);
