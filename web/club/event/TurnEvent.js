/**
 * @copyright Copyright (c)2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Club.DurakTurnEvent = class DurakTurnEvent extends Club.DurakEvent {

    static PROCESS_DELAY = 250;

    processNormal () {
        this.execute();
        this.play.showTurn();
        this.finishAfterMotion(this.constructor.PROCESS_DELAY);
    }

    processHidden () {
        this.execute();
        this.finish();
    }

    execute () {
        this.play.setAttacker(this.getPlayer(this.data.attacker));
        this.play.setDefender(this.getPlayer(this.data.defender));
        this.play.updateTurnedPlayers();
        this.play.updatePlayerMessages();
    }
};