
/** @scratch /panels/piechart/0
 * == piechart
 * Status: *Stable*
 *
 * The piechart panel is used for displaying piechart based on remote API
 *
 */
define([
        'angular',
        'app',
        'jquery',
        'kbn',
        'require',
        'underscore'
    ],
    function (angular, app, $, kbn, require, _) {
        'use strict';

        var module = angular.module('kibana.panels.piechart', []);
        app.useModule(module);

        module.controller('piechart', function ($scope) {

            $scope.panelMeta = {
                description: "A Pie chart module panel to display PIE Charts"
            };

            // Set and populate defaults
            var _d = {
                url: "", // 'API URL'
                dataField: "data",
                labelField: "label"
            };

            _.defaults($scope.panel, _d);

            $scope.init = function () {
                $scope.initBaseController(this, $scope);

                $scope.ready = false;
            };

            $scope.render = function () {
                $scope.$emit('render');
            };

            $scope.openEditor = function () {
                //$scope.$emit('open-modal','paneleditor');
                console.log('scope id', $scope.$id);
            };

        });

        module.directive('pieGraph', function ($rootScope) {
            return {
                restrict: 'A',
                template: '<div></div>',
                link: function (scope, element) {
                    scope.$on('render', function () {
                        render_panel();
                    });

                    scope.$on('refresh',function() {
                        if (shouldAbortRender()) { return; }
                        render_panel();
                    });

                    function setElementHeight() {
                        try {
                            var height = scope.height || scope.panel.height || scope.row.height;
                            if (_.isString(height)) {
                                height = parseInt(height.replace('px', ''), 10);
                            }

                            height = height - 32; // subtract panel title bar

                            element.css('height', height + 'px');

                            return true;
                        } catch(e) { // IE throws errors sometimes
                            return false;
                        }
                    }

                    function shouldAbortRender() {
                        if ($rootScope.fullscreen && !scope.fullscreen) {
                            return true;
                        }

                        return !setElementHeight();
                    }

                    function render_panel() {
                        if (shouldAbortRender()) {
                            return;
                        }

                        var formatter = kbn.getFormatFunction('short', 1);

                        var options = {
                            series: {
                                pie: {
                                    innerRadius: 0.3,
                                    show: true,
                                    label: {
                                        show: true,
                                        threshold: 0.1,
                                        formatter: function (label, series) {
                                            var line = '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">';
                                            line = line + label + '&nbsp;' + Math.round(series.percent);
                                            line = line + '%<br/>' + formatter(series.data[0][1]) + '</div>';
                                            return line;
                                        }
                                    }
                                }
                            },
                            legend: {
                                show: false
                            }
                        };

                        $.ajax(scope.panel.url, {dataType: 'JSON', cache: false}).done(function(rawData) {

                            var data = [];

                            if ($.isArray(rawData)) {
                                var sumOfData = 0;
                                $.each(rawData, function(position, val) {
                                    var dt = val[scope.panel.dataField];
                                    sumOfData += dt;

                                    data.push({label : val[scope.panel.labelField], data: dt});
                                });

                                element.html('');

                                $.plot(element, data, options);

                                scope.$apply(function() {
                                    scope.panel.total = formatter(sumOfData);
                                });
                            }
                        });
                    }

                    render_panel();
                }
            };
        });
    });
