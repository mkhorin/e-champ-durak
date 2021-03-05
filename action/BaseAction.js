/**
 * @copyright Copyright (c)2021 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('e-champ/arena/Action');

module.exports = class BaseAction extends Base {

    constructor (config) {
        super(config);
        this.hand = this.play.hands[this.player.pos];
    }

    validateBase () {
        return this.validatePlayer() && this.validateActiveRound() && this.validateTurned();
    }

    validateActiveRound () {
        return this.play.finished
            ? this.setError('Round is over now')
            : true;
    }

    validateTurned () {
        return this.hand.turned
            ? this.setError('Player has already acted')
            : true;
    }
};