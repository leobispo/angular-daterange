'use strict';
angular.module('ngDateRange', []).directive('ngDateRange', function() {
  return {
    restrict    : 'E',
    replace     : true,
    scope       : {
      start     : '=',
      finish    : '='
    },
    transclude  : true,
    templateUrl : 'daterange.html',
    controller: function($scope) {
      $scope.apply = function() {
        $scope.start  = $scope.startDate.hour(0).minute(0).second(0).toDate();
        $scope.finish = $scope.endDate.hour(23).minute(59).second(59).toDate();
      };

      $scope.cancel = function() {
        $scope.clearRange();
      };

      $scope.clearRange = function() {
        $scope.startDate = moment.utc($scope.start).startOf('day');
        $scope.endDate   = moment.utc($scope.finish);

        if (!$scope.endDate.isSame($scope.endDate.startOf('day')))
          $scope.endDate = $scope.endDate.add(1, 'day').startOf('day');
      };

      $scope.clearRange();
    },
    link: function(scope, element, attrs) {
      if (attrs.autoApply != null) {
        var apply = function() {
          scope.start  = scope.startDate.hour(0).minute(0).second(0).toDate();
          scope.finish = scope.endDate.hour(23).minute(59).second(59).toDate();
        };

        scope.$watchCollection("startDate", apply);
        scope.$watchCollection("endDate"  , apply);
      }
    }
  };
}).directive('ngDateRangeCalendar', function() {
  var calendars = {};

  var buildCalendar = function(month, year, side) {
    var cacheKey = month + ' + ' + year;
    if (calendars[cacheKey])
      return calendars[cacheKey];

    var firstDay  = moment.utc([year, month, 1]);
    var lastMonth = moment.utc(firstDay).subtract('month', 1).month();
    var lastYear  = moment.utc(firstDay).subtract('month', 1).year();

    var daysInLastMonth = moment.utc([lastYear, lastMonth]).daysInMonth();
    var dayOfWeek       = firstDay.day();

    var calendar = [];
    var i, j;
    for (i = 0; i < 6; ++i)
      calendar[i] = [];

    var startDay = daysInLastMonth - dayOfWeek + 1;

    if (startDay > daysInLastMonth)
      startDay -= 7;

    if (!dayOfWeek)
      startDay = daysInLastMonth - 6;

    var curDate;
    if (side === 'right')
      curDate = moment.utc([lastYear, lastMonth, startDay]).endOf('day');
    else
      curDate = moment.utc([lastYear, lastMonth, startDay]).startOf('day');

    for (i = 0; i < 6; ++i)
      for (j = 0; j < 7; ++j)
        calendar[i][j] = curDate = moment.utc(curDate).add('day', 1);

    calendars[cacheKey] = calendar;
    return calendar;
  };

  return {
    restrict: 'E',
    replace: true,
    scope: {
      startDate : '=start',
      endDate   : '=finish'
    },
    templateUrl: 'calendar.html',
    controller: function($scope) {
      $scope.inRange = function(day) {
        return (day.isAfter($scope.startDate, 'day') && day.isBefore($scope.endDate, 'day')) ||
          day.isSame($scope.startDate, 'day') || day.isSame($scope.endDate, 'day');
      };

      $scope.getDayNumber = function(day) {
        return day.date();
      };

      $scope.isOff = function(day) {
        return (day.month() !== $scope.current.month()) || (!$scope.left && day.isBefore($scope.startDate, 'day'));
      };

      $scope.updateCalendar = function() {
        $scope.calendar  = buildCalendar($scope.current.month(), $scope.current.year(), 1);
        $scope.monthName = moment.utc()._lang._monthsShort[$scope.current.month()] + $scope.current.format(' YYYY');
      };

      $scope.isActive = function(day) {
        if ($scope.left)
          return day.isSame($scope.startDate, 'day');

        return day.isSame($scope.endDate, 'day');
      };

      $scope.daysOfWeek = angular.copy(moment.utc()._lang._weekdaysMin);
      $scope.daysOfWeek.push($scope.daysOfWeek.shift());
      $scope.current    = moment.utc([$scope.startDate.year(), $scope.startDate.month(), 1]);

      $scope.updateCalendar();

      $scope.pickDate = function(date) {
        if (!$scope.left && date.isBefore($scope.startDate))
          return;

        if ($scope.left && date.isAfter($scope.endDate, 'day')) {
          $scope.startDate = date;
          $scope.endDate   = $scope.startDate.clone().add(1, 'day');
        }
        $scope[$scope.left ? 'startDate' : 'endDate'] = date;
      };

      $scope.setPrevMonth = function() {
        $scope.current.subtract('month', 1);
        $scope.updateCalendar();
      };

      $scope.setNextMonth = function() {
        $scope.current.add('month', 1);
        $scope.updateCalendar();
      };
    },
    link: function(scope, element, attrs) {
      scope.left = attrs.left === '';
    }
  };
});