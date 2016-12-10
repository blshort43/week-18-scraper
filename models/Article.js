//require mongoose
var mongoose = require("mongoose");
//create schema class
var Schema = mongoose.Schema;

//create article schema
var ArticleSchema = new Schema({

    title: {
        type: String,
        required: true,
        unique: true,
        drop: true
    },

    image: {
        type: String
    },

    link: {
        type: String,
        required: true
    },

    note: {
        type: Schema.Types.ObjectId,
        ref: "Note"
    }
});

//Create the Article model with the ArticleSchema
var Article = mongoose.model("Article", ArticleSchema);

// Export the model
module.exports = Article;