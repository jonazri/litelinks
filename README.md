# litelinks
A lightweight url shortener

### Frameworks & Hosting
* Hosted on Heroku (note Procfile and .env): https://devcenter.heroku.com/categories/nodejs
* Database: mongoose, hosted by MongoLab: https://elements.heroku.com/addons/mongolab

### How it works
The request hostname and pathname are searched for in Mongo. If there's a match, the server will redirect to the stored URL. If there's not a match, the server will redirect to the default URL. When the request has URL params, those will be merged with any params in the stored URL. Hashes will be ignored.

###Installation
Install the Heroku Toolkit. Then, in your `bash` shell:
```bash
heroku login
git clone https://github.com/jonazri/litelinks.git
npm install
heroku create
heroku addons:create mongolab
heroku addons:create papertrail
git push heroku master
heroku ps:scale web=1
```
Once installed, the database of URL rewrites can be administered from the Heroku UI (or from the MongoDB CLI).

### Database Schema
Database records ("Documents") follow the following schema:
```javascript
{
	requestURL: { type: String, unique: true, sparse: true },
	destinationURL: { type: String }
}
```
For example,
```javascript
{
    "requestURL": "myshortlink.com/awesomepromo",
    "destinationURL": "www.example.com/promo/page.html?utm_source=promos&utm_medium=social&utm_campaign=Awesome+Promo#signup"
	
}
```
