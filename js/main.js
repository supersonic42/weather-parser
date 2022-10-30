$(document).ready(function() {
    initMainContent();
});

function initMainContent() {
    let $root = $('main');
    
    if ($root.length == 0) {
        return false;
    }
    
    loadWeatherInfo();
    
    let $parseWeatherBtn = $root.find('#parseWeatherBtn');
    
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
        let monthToNumber = {
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
        
        let weatherByDate = {};
        
        let content = document.createElement('html');
            content.innerHTML = str;

        let $body = $(content).find('body');
        let $tabPaneDetailed = $body.find('.b-page__container');

        //$root.append($tabPaneDetailed);

        $tabPaneDetailed.find('.card').each(function(k, v) {
            let card = $(this);
            let dayNumber = $(v).find('[class$="__day-number"]').text();

            if (dayNumber.length == 0) {
                return;
            }

            dayNumber = padNumber(dayNumber);
            
            let dayMonth = $(v).find('[class$="__day-month"]').text();
            let dateStr = dayNumber + ' ' + dayMonth + ' ' + new Date().getFullYear();

            weatherByDate[dateStr] = {};

            let $weatherRows = card.find('.weather-table__row');

            $weatherRows.each(function(k, v) {
                let dayTimes = {0: 'morning', 1: 'day', 2: 'evening', 3: 'night'};
                let dayTime = dayTimes[k];
                let tempStr = $(v).find('.weather-table__temp').text();
                let tempSplit = tempStr.split('…');
                let press = $(v).find('.weather-table__body-cell_type_air-pressure').text();
                
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
        let daytimeToLiteral = {
            'morning': 'утро',
            'day': 'день',
            'evening': 'вечер',
            'night': 'ночь'
        };
        
        let $weatherInfoWrap = $root.find('#weatherInfoWrap');
        
        $weatherInfoWrap.html('<img src="/img/loading.gif">');
        
        $.get('/ajax.php', {oper: 'loadWeatherInfo'}, function(res) {
            setTimeout(function() {
                if (res.state == 'ok') {
                    let $table = $('<table class="weatherInfo"><tr><th>Время суток</th><th>Температура</th><th>Давление</th></tr></table>');

                    $weatherInfoWrap.html($table);
                    
                    for (let dateStr in res.weatherInfo) {
                        $table.append($('<tr><td colspan="3" class="dateWrap">' + dateStr.split('-').reverse().join('.') + '</td></tr>'));
                        
                        let dayTimeInfos = res.weatherInfo[dateStr];
                        
                        for (let daytime in dayTimeInfos) {
                            let dayTimeInfo = dayTimeInfos[daytime];

                            $('<tr class="daytimeInfo"><td class="daytime">' + daytimeToLiteral[daytime] + '</td><td class="temp">' + dayTimeInfo.temp.from + (dayTimeInfo.temp.to != null ? '&hellip;' + dayTimeInfo.temp.to : '') + '</td><td class="press">' + dayTimeInfo.press + '</td></tr>').appendTo($table);
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
