﻿/**
 * Class: SuperMap.ServiceBase
 * Core服务基类
 */

SuperMap.ServiceBase = SuperMap.Class({

    /**
     * Constant: EVENT_TYPES
     * {Array(String)}
     * 此类支持的事件类型
     * - *processCompleted* 服务端返回信息成功触发该事件 。
     * - *processFailed* 服务端返回信息失败触发该事件 。
     */
    EVENT_TYPES: ["processCompleted", "processFailed"],

    /**
     * APIProperty: events
     * {<SuperMap.Events>} 处理所有事件的对象，支持 processCompleted 、processFailed 两种事件
     * 服务端成功返回地图信息结果时触发 processCompleted 事件，服务端返回信息结果时触发 processFailed 事件。
     */
    events: null,

    /**
     * APIProperty: eventListeners
     * {Object} 听器对象，在构造函数中设置此参数（可选），对 MapService 支持的两个事件 processCompleted 、processFailed 进行监听，
     * 相当于调用 SuperMap.Events.on(eventListeners)。
     */
    eventListeners: null,

    /**
     * APIProperty: url
     * {String|Array} 服务访问地址或者服务访问地址数组。
     *
     ** Examples:
     * (start code)
     * var url1 = "http://localhost:8090/iserver/services/map-world/rest/maps/World";
     * var url2 = ["http://192.168.17.168:8090/iserver/services/map-world/rest/maps/World",
     *            "http://192.168.17.169:8091/iserver/services/map-world/rest/maps/World"];
     * (end)*
     */
    url: null,

    /**
     * Property: urls
     * {Array} 服务访问地址数组。
     */
    urls: null,

    /**
     * Property: token
     * {Array} 服务访问token。
     */
    token: null,


    /**
     * Property: index
     * {Int} 服务访问地址在数组中的位置。
     */
    index: null,

    /**
     * Property: length
     * {String} 服务访问地址数组长度。
     */
    length: null,

    /**
     * Property: options
     * {Object} 请求参数。
     */
    options: null,

    /**
     * Property: totalTimes
     * {Int} 实际请求失败次数。
     */
    totalTimes: null,

    /**
     * Property: POLLING_TIMES
     * {Int} 默认请求失败次数。
     */
    POLLING_TIMES: 3,

    /**
     * Property: _processSuccess
     * {Function} 请求参数中成功回调函数。
     */
    _processSuccess: null,

    /**
     * Property: _processFailed
     * {Function} 请求参数中失败回调函数。
     */
    _processFailed: null,


    /**
     * Property: isInTheSameDomain
     * {Boolean}
     */
    isInTheSameDomain: null,

    initialize: function (url, options) {
        if (!url) {
            return false;
        }
        var me = this;

        if (SuperMap.Util.isArray(url)) {
            me.urls = url;
            me.length = url.length;
            me.totalTimes = me.length;
            if (me.length == 1) {
                me.url = url[0];
            } else {
                me.index = parseInt(Math.random() * me.length);
                me.url = url[me.index];
            }
        } else {
            me.totalTimes = 1;
            me.url = url;
        }

        if (SuperMap.Util.isArray(url) && !me.isServiceSupportPolling()) {
            me.url = url[0];
            me.totalTimes = 1;
        }

        options = options || {};

        if (options) {
            SuperMap.Util.extend(this, options);
        }

        me.isInTheSameDomain = SuperMap.Util.isInTheSameDomain(me.url);

        me.events = new SuperMap.Events(me, null, me.EVENT_TYPES, true);
        if (me.eventListeners instanceof Object) {
            me.events.on(me.eventListeners);
        }
    },

    /**
     * APIMethod: destroy
     * 释放资源，将引用的资源属性置空。
     */
    destroy: function () {
        var me = this;
        if (SuperMap.Util.isArray(me.urls)) {
            me.urls = null;
            me.index = null;
            me.length = null;
            me.totalTimes = null;
        }
        me.url = null;
        me.token = null;
        me.options = null;
        me._processSuccess = null;
        me._processFailed = null;
        me.isInTheSameDomain = null;

        me.EVENT_TYPES = null;
        if (me.events) {
            me.events.destroy();
            me.events = null;
        }
        if (me.eventListeners) {
            me.eventListeners = null;
        }
    },

    /**
     * APIMethod: request
     * 该方法用于向服务发送请求。
     *
     * Parameters:
     * options - {Object} 参数。
     *
     * Allowed options properties:
     * method - {String} 请求方式，包括GET，POST，PUT， DELETE。
     * url - {String}  发送请求的地址。
     * params - {Object} 作为查询字符串添加到url中的一组键值对，
     *     此参数只适用于GET方式发送的请求。
     * data - {String } 发送到服务器的数据。
     * success - {Function} 请求成功后的回调函数。
     * failure - {Function} 请求失败后的回调函数。
     * scope - {Object} 如果回调函数是对象的一个公共方法，设定该对象的范围。
     * isInTheSameDomain - {Boolean} 请求是否在当前域中。
     */
    request: function (options) {
        var me = this;
        options.url = options.url || me.url;
        options.isInTheSameDomain = me.isInTheSameDomain;
        //为url添加安全认证信息片段
        if (me.token) {
            //当url中含有?，并且?在url末尾的时候直接添加token *网络分析等服务请求url会出现末尾是?的情况*
            //当url中含有?，并且?不在url末尾的时候添加&token
            //当url中不含有?，在url末尾添加?token
            var endStr = options.url.substring(options.url.length - 1, options.url.length);
            if (options.url.indexOf("?") > -1 && endStr === "?") {
                options.url += me.createUrlTokenParameter();
            } else if (options.url.indexOf("?") > -1 && endStr !== "?") {
                options.url += "&" + me.createUrlTokenParameter();
            } else {
                options.url += "?" + me.createUrlTokenParameter();
            }
        }
        me.calculatePollingTimes();
        me._processSuccess = options.success;
        me._processFailed = options.failure;
        options.scope = me;
        options.success = me.getUrlCompleted;
        options.failure = me.getUrlFailed;
        me.options = options;
        SuperMap.Util.committer(me.options);
    },

    /**
     * Method: getUrlTokenParameter
     * url中添加token。
     */
    createUrlTokenParameter: function () {
        return (this.token) ? "token=" + this.token : "";
    },

    /**
     * Method: getUrlCompleted
     * 请求成功后执行此方法。
     *
     * Parameters:
     * result - {Object} 服务器返回的结果对象。
     */
    getUrlCompleted: function (result) {
        var me = this;
        me._processSuccess(result);
    }
    ,

    /**
     * Method: getUrlFailed
     * 请求失败后执行此方法。
     *
     * Parameters:
     * result - {Object} 服务器返回的结果对象。
     */
    getUrlFailed: function (result) {
        var me = this;
        if (me.totalTimes > 0) {
            me.totalTimes--;
            me.ajaxPolling();
        } else {
            me._processFailed(result);
        }
    }
    ,

    /**
     * Method: ajaxPolling
     * 请求失败后，如果剩余请求失败次数不为0，重新获取url发送请求
     */
    ajaxPolling: function () {
        var me = this,
            url = me.options.url,
            re = /^http:\/\/([a-z]{9}|(\d+\.){3}\d+):\d{0,4}/;
        me.index = parseInt(Math.random() * me.length);
        me.url = me.urls[me.index];
        url = url.replace(re, re.exec(me.url)[0]);
        var isInTheSameDomain = SuperMap.Util.isInTheSameDomain(url);
        if (isInTheSameDomain) {
            if (url.indexOf(".jsonp") > 0) {
                url = url.replace(/.jsonp/, ".json");
            }
        } else {
            if (!(url.indexOf(".jsonp") > 0)) {
                url = url.replace(/.json/, ".jsonp");
            }
        }
        me.options.url = url;
        me.options.isInTheSameDomain = isInTheSameDomain;
        SuperMap.Util.committer(me.options);
    }
    ,

    /**
     * Method: calculatePollingTimes
     * 计算剩余请求失败执行次数。
     */
    calculatePollingTimes: function () {
        var me = this;
        if (me.times) {
            if (me.totalTimes > me.POLLING_TIMES) {
                if (me.times > me.POLLING_TIMES) {
                    me.totalTimes = me.POLLING_TIMES;
                } else {
                    me.totalTimes = me.times;
                }
            } else {
                if (me.times < me.totalTimes) {
                    me.totalTimes = me.times;
                }
            }

        } else {
            if (me.totalTimes > me.POLLING_TIMES) {
                me.totalTimes = me.POLLING_TIMES;
            }
        }
        me.totalTimes--;
    }
    ,

    /**
     * Method: isServiceSupportPolling
     * 判断服务是否支持轮询。
     */
    isServiceSupportPolling: function () {
        var me = this;
        return !(
            me.CLASS_NAME == "SuperMap.REST.ThemeService" ||
            me.CLASS_NAME == "SuperMap.REST.EditFeaturesService"
        );
    },

    /**
     * Method: serviceProcessCompleted
     * 状态完成，执行此方法。
     *
     * Parameters:
     * result - {Object} 服务器返回的结果对象。
     */
    serviceProcessCompleted: function (result) {
        result = SuperMap.Util.transformResult(result);
        this.events.triggerEvent("processCompleted", {result: result});
    },

    /**
     * Method: serviceProcessFailed
     * 状态失败，执行此方法。
     *
     * Parameters:
     * result - {Object} 服务器返回的结果对象。
     */
    serviceProcessFailed: function (result) {
        result = SuperMap.Util.transformResult(result);
        var error=result.error||result;
        this.events.triggerEvent("processFailed", {error: error});
    },
    CLASS_NAME: "SuperMap.ServiceBase"
})
;

module.exports = function (url, options) {
    return new SuperMap.ServiceBase(url, options);
};