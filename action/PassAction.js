/**
 * @copyright Copyright (c)2021 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./BaseAction');

module.exports = class PassAction extends Base {

    validate () {
        if (!this.validateBase()) {
            return false;
        }
        const {play} = this;
        if (this.hand === play.defender) {
            if (play.getActiveAttacker()) {
                return this.setError('Attack is not over yet');
            }
            if (!play.table.hasOpenAttack()) {
                return this.setError('No attack to pass');
            }
        }
        if (this.hand === play.attacker && play.table.isEmpty()) {
            return this.setError('Attacker cannot pass without attack');
        }
        return true;
    }

    execute () {
        const {play} = this;
        play.addEvent('pass', [this.hand.pos]);
        if (this.hand === play.defender) {
            if (play.changedDefendingCards) {
                if (!play.options.stopAttackOnPickingUp) {
                    play.updateTurnedHands();
                }
            }
        }
        this.hand.turned = true;
        play.endTurn();
    }
};