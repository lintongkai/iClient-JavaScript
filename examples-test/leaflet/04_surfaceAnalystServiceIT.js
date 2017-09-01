var commonTools = require('../base/commonTools');
module.exports = {
    'leaflet_04_surfaceAnalystService': function (browser) {
        var type = 'leaflet';
        var exampleName = '04_surfaceAnalystService';
        commonTools.openExampleAndLoadMap(browser, type, exampleName);
        /*check elements exist*/
        browser.expect.element('.leaflet-pane.leaflet-overlay-pane').to.be.present.before(10000);
        browser.expect.element('.leaflet-pane.leaflet-overlay-pane svg').to.be.present.before(10000);
        browser.expect.element('.leaflet-pane.leaflet-overlay-pane svg g').to.be.present.before(10000);
        browser.expect.element('.leaflet-pane.leaflet-overlay-pane svg g path').to.be.present.before(10000);
        browser.elements('tag name', 'path', function (result) {
            this.assert.equal(result.value.length, 22, "expect Number of surfaceAnalystService result to be 22, actual is " + result.value.length);
        });
        browser.pause(1000);
        browser.end();
    }
};
