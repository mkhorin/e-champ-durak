/**
 * @copyright Copyright (c)2021 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = {
    
    label: 'Standard',
    solver: {
        Class: require('../bot/StandardSolver'),
    },
    translations: {
        'ru': {
            label: 'Стандартный'
        }
    }
};