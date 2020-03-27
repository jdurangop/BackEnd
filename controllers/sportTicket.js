const jwt = require("jsonwebtoken");
const SportTicket = require("../models/sportTicket");
const Match = require("../models/match");
const User = require("../models/user");
const GlobalBalance = require("../models/globalBalance");

exports.createSportTicket = async (req, res) => {
    try {
        const { userId, betValue, matchBets } = req.body;

        // Se verifica que apueste para al menos 5 partidos
        if (matchBets.length < 5) {
            return res.status(406).json({
                message: "Es necesario registrar al menos 5 apuestas"
            });
        }

        // Se encuentra la fecha del último partido
        const ids = matchBets.map(matchBet => matchBet.match);
        const matches = await Match.find().where('_id').in(ids).exec();
        const dates = matches.map(match => new Date(match.matchDate));
        const closingDate = new Date(Math.max.apply(null, dates));
        // closingDate = new Date(Math.max.apply(null, match))

        // Se verifica que el usuario tenga suficiente dinero y se le resta del balance
        const user = await User.findById(userId);
        if (user.balance < betValue) {
            return res.status(401).json({
                message: "El usuario no tiene suficiente saldo para realizar esta apuesta"
            });
        } else {
            const newUserBalance = user.balance - betValue;
            const result1 = await User.updateOne({ _id: userId }, { balance: newUserBalance });
            if (result1.n <= 0) {
                return res.status(401).json({
                    message: "Ocurrió un error al restar el valor del saldo del usuario"
                });
            }
            const result2 = await GlobalBalance.update({}, { $inc: { value: betValue } });
            if (result2.n <= 0) {
                return res.status(401).json({
                    message: "Ocurrió un error al ajustar el balance global"
                });
            }

            // Se crea la apuesta deportiva
            const sportTicket = new SportTicket({ user: userId, betValue, matchBets, closingDate, creationDate: new Date(), checked: false });
            const result = await sportTicket.save();
            res.status(201).json({
                message: "Apuesta deportiva creada satisfactoriamente",
                result: result
            });
        }
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

//Se establecen los ganadores
exports.setSportWinners = async (req, res) => {
    try {
        const today = new Date();
        //lista de los tiquetes que no han sido evaluados, o sea, si se determinó si es ganador o no
        const spTickets = await SportTicket.find({checked: false});

        spTickets.forEach(async (spTicket) => {
            //se verifica si el tiquete no se hayan evaluado y que ya esté cerrado
            if (today >= spTicket.closingDate) {
                let areCorrect = 0;

                //se cuentan los aciertos en el tiquete
                spTicket.matchBets.forEach(async (bet) => {
                    const match = await Match.findById(bet.match);
                    const userScore = bet.scoreBoard;

                    if (userScore === match.finalScoreBoard) {
                        areCorrect = areCorrect + 1;
                    }
                });

                //userProfit es el porcentaje de la ganancia
                let userProfit = 0;
                if (areCorrect >= 5) {
                    //determina cuánto es el porcentaje de la ganancia
                    if (areCorrect === 5) {
                        userProfit = 8;
                    } else if (areCorrect === 6) {
                        userProfit = 8.5;
                    } else if (areCorrect === 7) {
                        userProfit = 9;
                    } else if (areCorrect === 8) {
                        userProfit = 12;
                    } else if (areCorrect === 9) {
                        userProfit = 17;
                    } else {
                        userProfit = 25;
                    }
                    
                    const winnings = spTicket.betValue * userProfit;
                    const userUpdate = await User.updateOne({ _id: spTicket.user }, { $inc: { balance: winnings } });
                    const globalBalanceUpdate = await GlobalBalance.updateOne({}, { $inc: { value: -winnings } });
                    
                    // Todo esto es un poco ineficiente. Podría irse metiendo los usuarios en un array e 
                    // ir sumando al total y abajo hacer un updateMany con esos arrays y el return.status.json
                    //se actualiza el tiquete: si ganó o no, cuántas acertó y el porcentaje que ganó
                    const resultUpdate = await SportTicket.updateOne({ _id: spTicket._id }, {checked: true, isWinner: true, correct: areCorrect, profit: userProfit, awarded: true });
                } else {
                    //si no ganó, no se guarda el atributo awarded
                    const resultUpdate = await SportTicket.updateOne({ _id: spTicket._id }, {checked: true, isWinner: false, correct: areCorrect, profit: userProfit });
                }
            }
        });

        if (resultUpdate) {
            if(resultUpdate.n > 0){
                res.status(200).json({ message: 'Los ganadores deportivos fueron determinados, Tickets actualizados correctamente' });
            } else {
                res.status(401).json({ message: "Error al actualizar tickets deportivos" });
            }
        } else{
            res.status(200).json({ message: 'No hay tickets deportivos por actualizar' });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: err });
    }
};
