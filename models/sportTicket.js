const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const User = require("./user.js");
const Match = require("./match.js");

const sportTicketSchema = mongoose.Schema({    
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    betValue: { type: Number, required: true },
    matchBets: [{
        match: { type: mongoose.Schema.Types.ObjectId, ref: "Match", required: true },
        scoreBoard:{ type: String, required: true }
    }],
    closingDate: { type: Date, required: true },
    creationDate: { type: Date, required: true }
});

sportTicketSchema.plugin(uniqueValidator);

module.exports = mongoose.model("SportTicket", sportTicketSchema, "sportTickets");