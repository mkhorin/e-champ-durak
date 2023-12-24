/**
 * @copyright Copyright (c)2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Club.DurakEndEvent = class DurakEndEvent extends Club.DurakEvent {

    process () {
        const {play} = this;
        if (play.master !== play.winner) {
            play.master.setFinisher();
        }
        const {data} = this;
        const winner = this.getPlayer(data.winner);
        const loser = this.getPlayer(data.loser);
        const draw1 = this.getPlayer(data.draw1);
        const draw2 = this.getPlayer(data.draw2);
        loser?.setLoser(data.loserCards);
        draw1?.setDraw();
        draw2?.setDraw();
        play.resolveWinner(winner);
        play.players.forEach(this.togglePlayerEnd, this);
        play.master.activate();
        play.master.toggleAction(true);
        play.toggleRoundEnd(true);
        this.finish();
    }

    togglePlayerEnd (player) {
        player.setTurned(false);
        player.setMessage(Club.Durak.MESSAGE_THINK);
    }
};