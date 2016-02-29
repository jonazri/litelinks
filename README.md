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
heroku create
heroku addons:create mongolab
git push heroku master
heroku ps:scale web=1
```
