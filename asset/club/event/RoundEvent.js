/**
 * @copyright Copyright (c)2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Club.DurakRoundEvent = class DurakRoundEvent extends Club.DurakEvent {

    process () {
        this.play.events.clearBeforeCursor();
        this.play.startRound(this.data);
        this.finish();
    }
};