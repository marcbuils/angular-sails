(function (angular, io) {
'use strict'/*global angular */
angular.module('ngSails', ['ng']);

(function (angular, io) {
    'use strict'/*global angular */
    angular.module('ngSails', ['ng']);

    /*jslint sloppy:true*/
    /*global angular, io */
    angular.module('ngSails').provider('$sails', function () {
        var provider = this,
            httpVerbs = ['get', 'post', 'put', 'delete'],
            eventNames = ['on', 'once'];

        this.url = undefined;
        this.interceptors = [];

        this.$get = ['$q', '$timeout', function ($q, $timeout) {
            var socket = io.connect(provider.url),
                defer = function () {
                    var deferred = $q.defer(),
                        promise = deferred.promise;

                    promise.success = function (fn) {
                        promise.then(fn);
                        return promise;
                    };

                    promise.error = function (fn) {
                        promise.then(null, fn);
                        return promise;
                    };

                    return deferred;
                },
                resolveOrReject = function (deferred, data) {
                    // Make sure what is passed is an object that has a status and if that status is no 2xx, reject.
                    if (data && angular.isObject(data) && data.statusCode && Math.floor(data.statusCode / 100) !== 2) {
                        deferred.reject(data.body);
                    } else {
                        deferred.resolve(data.body);
                    }
                },
                angularify = function (cb, data) {
                    $timeout(function () {
                        cb(data);
                    });
                },
                promisify = function (methodName) {
                    socket['legacy_' + methodName] = socket[methodName];
                    socket[methodName] = function (url, data, cb) {
                        var deferred = defer();
                        if (cb === undefined && angular.isFunction(data)) {
                            cb = data;
                            data = null;
                        }
                        deferred.promise.then(cb);
                        socket['legacy_' + methodName](url, data, function (result, infos) {
                            resolveOrReject(deferred, infos);
                        });
                        return deferred.promise;
                    };
                },
                wrapEvent = function (eventName) {
                    socket['legacy_' + eventName] = socket[eventName];
                    socket[eventName] = function (event, cb) {
                        if (cb !== null && angular.isFunction(cb)) {
                            socket['legacy_' + eventName](event, function (result, infos) {
                                angularify(cb, infos);
                            });
                        }
                    };
                };

            angular.forEach(httpVerbs, promisify);
            angular.forEach(eventNames, wrapEvent);

            return socket;
        }];
    });
}(angular, io));}(angular, io));