$(document).ready(function() {
    initMainContent();
});

function initMainContent() {
    var $root = $('main');
    
    if ($root.length == 0) {
        return false;
    }
    
    loadWeatherInfo();
    
    var $parseWeatherBtn = $root.find('#parseWeatherBtn');
    
    $parseWeatherBtn.click(function() {
        $parseWeatherBtn.addClass('process');
        
        $.get('/ajax.php', {oper: 'corsGate', url: 'https://yandex.ru/pogoda/moscow/details?ncrnd=3215'}, function(res) {
            $parseWeatherBtn.removeClass('process');
            
            if (res.state == 'ok') {
                parseWeatherHtml(res.content);
            }
        }, 'json');
    });
    
    function parseWeatherHtml(str) {
        var monthToNumber = {
            'января': '01',
            'февраля': '02',
            'марта': '03',
            'апреля': '04',
            'мая': '05',
            'июня': '06',
            'июля': '07',
            'августа': '08',
            'сентября': '09',
            'октября': '10',
            'ноября': '11',
            'декабря': '12',
        };
        
        var weatherByDate = {};
        
        var content = document.createElement('html');
            content.innerHTML = str;

        var $body = $(content).find('body');
        var $tabPaneDetailed = $body.find('.tabs-panes__pane[aria-labelledby="forecasts-tab-1"]');

        //$root.append($tabPaneDetailed);

        $tabPaneDetailed.find('dt.forecast-detailed__day').each(function(k, v) {
            var dayNumberStr = $(v).find('.forecast-detailed__day-number').contents().get(0).nodeValue;
                dayNumberStr = padNumber(dayNumberStr);
            var monthNumberStr = $(v).find('.forecast-detailed__day-month').text();
                monthNumberStr = monthNumberStr in monthToNumber ? monthToNumber[monthNumberStr] : '00';
            var dateStr = new Date().getFullYear() + '-' + monthNumberStr + '-' + dayNumberStr;
            
            weatherByDate[dateStr] = {};

            var $dayInfo = $(v).next('.forecast-detailed__day-info');
            var $weatherRows = $dayInfo.find('.weather-table__row');
            
            $weatherRows.each(function(k, v) {
                var dayTimes = {0: 'morning', 1: 'day', 2: 'evening', 3: 'night'};
                var dayTime = dayTimes[k];
                var tempStr = $(v).find('.weather-table__temp').text();
                var tempSplit = tempStr.split('…');
                var press = $(v).find('.weather-table__body-cell_type_air-pressure .weather-table__value').text();
                
                weatherByDate[dateStr][dayTime] = {
                    'temp': {
                        'from': typeof tempSplit[0] != 'undefined' ? tempSplit[0] : null,
                        'to': typeof tempSplit[1] != 'undefined' ? tempSplit[1] : null
                    },
                    'press': press
                };
            });
        });
        
        $.post('/ajax.php', {oper: 'writeInfoToFile', data: JSON.stringify(weatherByDate)}, function(res) {
            if (res.state == 'ok') {
                loadWeatherInfo();
            }
        }, 'json');
    }
    
    function loadWeatherInfo() {
        var daytimeToLiteral = {
            'morning': 'утро',
            'day': 'день',
            'evening': 'вечер',
            'night': 'ночь'
        };
        
        var $weatherInfoWrap = $root.find('#weatherInfoWrap');
        
        $weatherInfoWrap.html('<img src="/img/loading.gif">');
        
        $.get('/ajax.php', {oper: 'loadWeatherInfo'}, function(res) {
            setTimeout(function() {
                if (res.state == 'ok') {
                    var $table = $('<table class="weatherInfo"><tr><th>Время суток</th><th>Температура</th><th>Давление</th></tr></table>');

                    $weatherInfoWrap.html($table);
                    
                    for (var dateStr in res.weatherInfo) {
                        $table.append($('<tr><td colspan="3" class="dateWrap">' + dateStr.split('-').reverse().join('.') + '</td></tr>'));
                        
                        var dayTimeInfos = res.weatherInfo[dateStr];
                        
                        for (var daytime in dayTimeInfos) {
                            var dayTimeInfo = dayTimeInfos[daytime];
                            var $datetimeInfo = $('<tr class="daytimeInfo"><td class="daytime">' + daytimeToLiteral[daytime] + '</td><td class="temp">' + dayTimeInfo.temp.from + (dayTimeInfo.temp.to != null ? '&hellip;' + dayTimeInfo.temp.to : '') + '</td><td class="press">' + dayTimeInfo.press + '</td></tr>').appendTo($table);
                        }
                    }
                } else {
                    $weatherInfoWrap.html('Нет данных. Нажмите кнопку парсинга.');
                }
            }, 999);
        }, 'json');
    }
}

function padNumber(n) {
    n = parseInt(n);
    
    return ('00' + n).substr(-2, 2);
}
