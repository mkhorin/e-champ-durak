/**
 * @copyright Copyright (c)2021 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./BaseAction');

module.exports = class ContinueAction extends Base {

    validate () {
        if (!this.validatePlayer() || !this.validateTurned()) {
            return false;
        }
        if (!this.play.finished) {
            return this.setError('Round is not over');
        }
        return true;
    }

    execute () {
        this.play.setHandReady(this.hand);
        for (const hand of this.play.hands) {
            if (!hand.turned) {
                return;
            }
        }
        this.play.startNextRound();
    }
};