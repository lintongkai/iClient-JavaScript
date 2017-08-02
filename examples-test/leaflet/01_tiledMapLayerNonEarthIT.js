var commonTools = require('../base/commonTools');
module.exports = {
    'leaflet_01_tiledMapLayerNonEarth': function (browser) {
        var type = 'leaflet';
        var exampleName = '01_tiledMapLayerNonEarth';
        commonTools.openExampleAndLoadMap(browser, type, exampleName);
        //commonTools.getStdTile(browser, type, exampleName, 256, 256);
        commonTools.cmpTestTileWithStdTile(browser, type, exampleName, 256, 256);
        browser.end();
    }
};
