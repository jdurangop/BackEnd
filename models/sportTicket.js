const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const Match = require("./match.js");
const User = require("./user");

const sportTicketSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    betValue: { type: Number, required: true },
    matchBets: [{
        match: { type: mongoose.Schema.Types.ObjectId, ref: "Match", required: true },
        scoreBoard: { type: String, required: true }
    }],
    closingDate: { type: Date, required: true },
    creationDate: { type: Date, required: true },
    isWinner: {type: Boolean, required: false},
    correct: {type: Number, required: false},
    profit: {type: Number, required: false},
    //awarded es para ver si el premio ya se le entregó al ganador
    awarded: {type: Boolean, required: false},
    prize: {type: Number, required: false},
    //checked es para cuando se evalúa si es ganador o no
    checked: {type: Boolean, required: true}
});

sportTicketSchema.plugin(uniqueValidator);

module.exports = mongoose.model("SportTicket", sportTicketSchema, "sportTickets");