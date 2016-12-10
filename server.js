// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");

// Note and Article models
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");

// Scraping tools
var request = require("request");
var cheerio = require("cheerio");

// Set up promises
var Promise = require("bluebird");

mongoose.Promise = Promise;

// Initialize Express
var app = express();

// Use morgan and body parser
app.use(logger("dev"));
app.use(bodyParser.urlencoded({
    extended: false
}))

// Public static dir
app.use(express.static("public"));

// Database configuration with mongoose
var AWS = require('aws-sdk');
AWS.config.secretAccessKey = process.env['MONGODB_URI']
var s3 = new AWS.S3();

mongoose.connect(process.env.s3 || "mongodb://localhost/week18hw");
var db = mongoose.connection;

// Show mongoose errors
db.on("error", function(error) {
    console.log("Mongoose Error: ", error);
});

// db login through mongoose success message
db.once("open", function() {
    console.log("Mongoose connection successful.");
});


// Routes
// ======

//Index route
app.get("/", function(req, res) {
    res.send(index.html)
});

// Get request to scrape a website
app.get("/scrape", function(req, res) {
    // Get the body of the html with request
    request("http://www.theonion.com/section/local/", function(error, response, html) {
        // load that into cheerio and save it to $ for a shorthand selector
        var $ = cheerio.load(html);
        $("div .info").each(function(i, element) {

            // Save an empty result object
            var result = {};
            // Add the text and href of every link, and save them as properties of the result object
            result.title = $(this).find("h2").text().trim();
            result.image = $(this).find("figure").find("img").attr("src");
            result.link = $(this).find("a").attr("href");

            console.log(result);

            // Using our Article model, create a new entry
            // This effectively passes the result object to the entry (and the title and link)
            var entry = new Article(result);

            // Save the entry to the db
            entry.save(function(err, doc) {
                if (err) {
                    console.log(err);
                } else {
                    console.log(doc);
                }
            });
        });
    });
    res.send("Scrape Complete");
});

// get the articles from mongoDB
app.get("/articles", function(req, res) {
    // Grab every doc in the Articles array
    Article.find({}, function(error, doc) {
        if (error) {
            console.log(error);
        } else {
            // send the doc to the browser as a json object
            res.json(doc);
        }
    });
});

// grab an article by it's ObjectId
app.get("/articles/:id", function(req, res) {
    // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
    Article.findOne({ "_id": req.params.id })
        // ..and populate all of the notes associated with it
        .populate("note")
        // now, execute our query
        .exec(function(error, doc) {
            if (error) {
                console.log(error)
            }
            // Otherwise, send the doc to the browser as a json object
            else {
                res.json(doc);
            }
        });
});


// Create a note or replace an existing note
app.post("/articles/:id", function(req, res) {
    // Create a new note and pass the req.body to the entry
    var newNote = new Note(req.body);

    // And save the new note to the db
    newNote.save(function(error, doc) {
        if (error) {
            console.log(error);
        } else {
            //Use the article id to find an update it's note
            Article.findOneAndUpdate({ "_id": req.params.id }, { "note": doc._id })
                //Execute the above query
                .exec(function(err, doc) {
                    if (err) {
                        console.log(err);
                    } else {
                        res.send(doc);
                    }
                });
        }
    });
});




// Listen on port 3000
app.listen(3000, function() {
    console.log("App running on port 3000!");
});
