exports.DiceRound = function () {
    var diceARoll = Math.floor( Math.random() * 6 ) +1;
    var diceBRoll = Math.floor( Math.random() * 6 ) +1;
    return 'You rolled a ' + diceARoll + " and " + diceBRoll;
};