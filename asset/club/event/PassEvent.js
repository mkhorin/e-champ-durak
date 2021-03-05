/**
 * @copyright Copyright (c)2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Club.DurakPassEvent = class DurakPassEvent extends Club.DurakEvent {

    process () {
        this.player.setTurned(true);
        this.play.updatePlayerMessages();
        this.finish();
    }
};