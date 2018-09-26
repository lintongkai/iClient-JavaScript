import ol from 'openlayers';
import {Mapv} from '../../../src/openlayers/overlay/Mapv';
import {TileSuperMapRest} from '../../../src/openlayers/mapping/TileSuperMapRest';
import {utilCityCenter, DataSet} from 'mapv';

var url = GlobeParameter.ChinaURL;
describe('openlayers_MapV', () => {
    var originalTimeout;
    var testDiv, map, mapVSource;
    beforeAll(() => {
        testDiv = document.createElement("div");
        testDiv.setAttribute("id", "map");
        testDiv.style.styleFloat = "left";
        testDiv.style.marginLeft = "8px";
        testDiv.style.marginTop = "50px";
        testDiv.style.width = "500px";
        testDiv.style.height = "500px";
        document.body.appendChild(testDiv);
        map = new ol.Map({
            target: 'map',
            view: new ol.View({
                center: ol.proj.transform([105.403119, 38.028658], 'EPSG:4326', 'EPSG:3857'),
                zoom: 4,
                projection: 'EPSG:3857'
            })
        });
        map.addLayer(new ol.layer.Tile({
            source: new TileSuperMapRest({
                url: url,
                attributions: new ol.Attribution({
                    html: "Map Data © <a href='https://www.supermapol.com/' target='_blank'> SuperMap Online</a>"
                })
            })
        }));
        var randomCount = 300;
        var data = [];
        var citys = ["北京", "天津", "上海", "重庆", "石家庄", "太原", "呼和浩特", "哈尔滨", "长春", "沈阳", "济南", "南京", "合肥", "杭州", "南昌", "福州", "郑州", "武汉", "长沙", "广州", "南宁", "西安", "银川", "兰州", "西宁", "乌鲁木齐", "成都", "贵阳", "昆明", "拉萨", "海口"];
        // 构造数据
        while (randomCount--) {
            var cityCenter = utilCityCenter.getCenterByCityName(citys[parseInt(Math.random() * citys.length)]);
            data.push({
                geometry: {
                    type: 'Point',
                    coordinates: ol.proj.transform([cityCenter.lng - 2 + Math.random() * 4, cityCenter.lat - 2 + Math.random() * 4], 'EPSG:4326', 'EPSG:3857')
                },
                count: 30 * Math.random()
            });
        }
        var dataSet = new DataSet(data);
        var mapvOptions = {
            fillStyle: 'rgba(55, 50, 250, 0.8)',
            shadowColor: 'rgba(255, 250, 50, 1)',
            shadowBlur: 20,
            max: 100,
            size: 50,
            label: {
                show: true,
                fillStyle: 'white'
            },
            globalAlpha: 0.5,
            gradient: {0.25: "rgb(0,0,255)", 0.55: "rgb(0,255,0)", 0.85: "yellow", 1.0: "rgb(255,0,0)"},
            draw: 'honeycomb'
        };
        var options = {
            map: map, dataSet: dataSet, mapvOptions: mapvOptions
        };
        mapVSource = new Mapv(options);
        map.addLayer(new ol.layer.Image({
            source: mapVSource
        }));
    });
    beforeEach(() => {
        originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 50000;
    });
    afterEach(() => {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
    });
    afterAll(() => {
        document.body.removeChild(testDiv);
        map = null;
    });

    it('initialize', (done) => {
        //判断是否返回期望的maplayer
        setTimeout(() => {
            expect(mapVSource).not.toBeNull();
            expect(mapVSource.mapvOptions.shadowBlur).toBe(20);
            expect(mapVSource.mapvOptions.draw).toBe("honeycomb");
            expect(mapVSource.layer).not.toBeNull();
            expect(mapVSource.layer.canvasLayer.context).toBe("2d");
            expect(mapVSource.layer.canvasLayer.paneName).toBe("mapPane");
            expect(mapVSource.layer.canvasLayer.zIndex).toEqual(2);
            done();
        }, 5000)
    });

    it('addData', () => {
        var data = [{
            geometry: {
                type: 'Point',
                coordinates: [109, 32]
            },
            count: 111
        }];
        var dataset = new DataSet(data);
        var tempoption = {
            shadowBlur: 30
        }
        mapVSource.addData(dataset, tempoption);
        expect(mapVSource.dataSet).not.toBeNull();
        expect(mapVSource.dataSet._data[1000].count).toEqual(111);
        expect(mapVSource.dataSet._data[1000].geometry.coordinates[0]).toEqual(109);
        expect(mapVSource.dataSet._data[1000].geometry.coordinates[1]).toEqual(32);
        expect(mapVSource.mapVOptions.shadowBlur).toEqual(30);
    });

    it('getData', () => {
        var dataset = mapVSource.getData();
        expect(dataset._data.length).toEqual(1000);
    });

    //删除数据
    it('removeData', (done) => {
        var filter = (data) => {
            if (mapVSource.dataSet._data.indexOf(data) === 2) {
                return true
            }
            return false;
        }
        mapVSource.removeData(filter);
        setTimeout(() => {
            expect(mapVSource.dataSet._data.length).toEqual(999);
            done();
        }, 6000);
    });

    it('update', () => {
        var data = [{
            geometry: {
                type: 'Point',
                coordinates: [109, 32]
            },
            count: 111
        }];
        var dataset = new DataSet(data);
        var tempoption = {
            shadowBlur: 40
        }
        var opt = {data: dataset, options: tempoption};
        mapVSource.update(opt);
        expect(mapVSource.dataSet._data.length).toEqual(1);
        expect(mapVSource.dataSet._data[0].count).toEqual(111);
        expect(mapVSource.dataSet._data[0].geometry.coordinates[0]).toEqual(109);
        expect(mapVSource.dataSet._data[0].geometry.coordinates[1]).toEqual(32);
        expect(mapVSource.mapVOptions.shadowBlur).toEqual(40);
    });

    it('clearData', () => {
        mapVSource.clearData();
        expect(mapVSource.dataSet._data.length).toEqual(0);
    });

    it('draw, redraw', () => {
        mapVSource.draw();
        expect(mapVSource.canvas.width).toEqual(500);
        expect(mapVSource.canvas.style.width).toBe('500px');
        mapVSource.redraw();
        expect(mapVSource.canvas.width).toEqual(500);
        expect(mapVSource.canvas.style.width).toBe('500px');
    });

    it('setZIndex', () => {
        mapVSource.setZIndex(2);
        expect(mapVSource.canvas.style.zIndex).toEqual('2');
    });

    it('getCanvas', () => {
        var canvas = mapVSource.getCanvas();
        expect(canvas).not.toBeNull();
        expect(mapVSource.canvas.width).toEqual(500);
        expect(mapVSource.canvas.height).toEqual(500);
    });

    it('getContainer', () => {
        var container = mapVSource.getContainer();
        expect(container).not.toBeNull();
    });

    it('getTopLeft', () => {
        var topLeft = mapVSource.getTopLeft();
        expect(topLeft).not.toBeNull();
     /*   expect(topLeft.lng).toEqual(87.01171875);
        expect(topLeft.lat).toEqual(48.63290858589535);*/
    });

});
