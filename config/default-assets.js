/**
 * @copyright Copyright (c)2021 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = {

    build: [{
        Class: 'FileMerger',
        sources: [
            'club/Durak.js',
            'club/event/Event.js',
            'club/player/Player.js',
            'club'
        ],
        target: 'dist/durak.min.js',
        copyright: `/* @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com> */\n`,
        logging: true,
        shrinking: false
    }],

    deploy: {
        'vendor': 'dist/durak.min.js'
    }
};