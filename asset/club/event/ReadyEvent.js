/**
 * @copyright Copyright (c)2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Club.DurakReadyEvent = class DurakReadyEvent extends Club.DurakEvent {

    process () {
        this.player.deactivate();
        this.player.setTurned(true);
        this.player.setMessage(Club.Durak.MESSAGE_READY);
        this.finish();
    }
};