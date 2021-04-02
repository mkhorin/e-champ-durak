/**
 * @copyright Copyright (c)2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Club.DurakPlayback = class DurakPlayback extends Club.Durak {

    constructor () {
        super(...arguments);
        this.on('click', '.playback-action-pause', this.onPause.bind(this));
        this.on('click', '.playback-action-play', this.onPlay.bind(this));
        this.on('click', '.playback-action-start', this.onStart.bind(this));
        this.on('click', '.playback-action-end', this.onEnd.bind(this));
        this.keepFacedCards = true;
        this.toggleClass('playback', true);
    }

    onHandledHiddenEvents () {
        this.arrange();
    }

    onHandledEvents () {
        this.togglePause(true);
    }

    start (data) {
        super.start(...arguments);
        this.page.toggleLoading(false);
        this.toggleClass('hidden', false);
        this.events.add(data.events);
        this.processEvents();
    }

    processEvents () {
        this.events.stopIndex = 2;
        this.events.process();
    }

    startPlayback () {
        this.events.process();
    }

    onPlay () {
        this.togglePause(false);
        this.events.isEnded()
            ? this.onStart()
            : this.events.continue();
    }

    onPause () {
        this.togglePause(true);
        this.events.stop();
    }

    onStart () {
        this.togglePause(false);
        this.events.reset();
        this.processEvents();
    }

    onEnd () {
        this.events.hiddenIndex = this.events.count() - 1;
        this.onPlay();
    }

    togglePause () {
        this.toggleClass('paused', ...arguments);
    }

    attachSocket () {}

    startCountdown () {}

    resolveLastHiddenEventIndex () {
        return -1;
    }
};