function Day(name, date, icon, minTemperature, maxTemperature, windDirection, windSpeed) {
    this.data = {
        name,
        date,
        icon,
        maxTemperature,
        minTemperature,
        windDirection,
        windSpeed
    }
}

const fetchWeather = (latitude, longitude) => fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min,winddirection_10m_dominant,windspeed_10m_max&current_weather=true&windspeed_unit=ms&timeformat=unixtime&timezone=auto`);
const fetchCity = (latitude, longitude) => fetch(`https://geocode.maps.co/reverse?lat=${latitude}&lon=${longitude}`);

const getDays = (data) => {
    const days = [];

    const getDay = (date) => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
    const getFormattedDateFromTimestamp = (date) => {
        // MMM DD
        return `${date.toLocaleString('default', { month: 'short' })} ${date.getDate()}`;
    }

    for (let i = 0; i < 7; i++) {
        const date = new Date(data.daily.time[i] * 1000);
        days.push(new Day(
            getDay(date),
            getFormattedDateFromTimestamp(date),
            data.daily.weathercode[i],
            data.daily.temperature_2m_min[i],
            data.daily.temperature_2m_max[i],
            data.daily.winddirection_10m_dominant[i],
            data.daily.windspeed_10m_max[i]
        ));
    }

    return days;
}

const getIconFromCode = (code) => {
    const icons = [
        { numbers: [0], icon: 'sun-fill.svg', filter: 'invert(86%) sepia(45%) saturate(6054%) hue-rotate(4deg) brightness(98%) contrast(92%)' }, // Clear
        { numbers: [1,2,3], icon: 'cloud-sun-fill.svg', filter: 'invert(60%) sepia(10%) saturate(537%) hue-rotate(167deg) brightness(88%) contrast(90%)' }, // Cloudy
        { numbers: [45, 48], icon: 'cloud-fog.svg', filter: 'invert(58%) sepia(0%) saturate(1%) hue-rotate(37deg) brightness(97%) contrast(89%)' }, // Foggy
        { numbers: [51, 53, 55, 61, 63, 65, 80, 81, 82], icon: 'cloud-rain-fill.svg', filter: 'invert(16%) sepia(70%) saturate(2152%) hue-rotate(230deg) brightness(94%) contrast(95%)' }, // Rain and drizzle
        { numbers: [56, 57, 66, 67, 71, 73, 75, 77, 85, 86], icon: 'cloud-snow-fill.svg', filter: 'invert(58%) sepia(0%) saturate(1%) hue-rotate(37deg) brightness(97%) contrast(89%)' }, // Snow, freezing rain and freezing drizzle
        { numbers: [95, 96, 99], icon: 'cloud-lightning.svg', filter: 'invert(16%) sepia(35%) saturate(4144%) hue-rotate(230deg) brightness(101%) contrast(94%)'} // Lightning / thunder
    ];
    return icons.find(icon => icon.numbers.includes(code));
}

const changeLoadingBar = (percentage, text) => {
    document.getElementById('loading_bar').style.setProperty('--percentage', `${percentage}%`);
    document.getElementById('loading_status').innerText = text ? text : `Loading...`;
    document.getElementById("loading").classList.toggle('hidden', percentage >= 100);
}

async function DayElement(day) {
    const element = document.createElement('div');
    element.id = day.data.name;
    element.classList.add('day-card');

    const dayContainer = document.createElement('div');

    const dayName = document.createElement('h2');
    dayName.innerText = day.data.name;
    dayContainer.appendChild(dayName);

    const dayDate = document.createElement('h3');
    dayDate.innerText = day.data.date;
    dayContainer.appendChild(dayDate);

    element.appendChild(dayContainer);

    const maxTempContainer = document.createElement('div');

    const dayIcon = document.createElement('img');
    console.log(day.data);
    dayIcon.src = `assets/${getIconFromCode(day.data.icon).icon}`;
    dayIcon.style.filter = getIconFromCode(day.data.icon).filter;
    maxTempContainer.appendChild(dayIcon);

    const dayMaxTemperature = document.createElement('span');
    dayMaxTemperature.innerText = day.data.maxTemperature + '°';
    dayMaxTemperature.style.filter = getIconFromCode(day.data.icon).filter;
    dayMaxTemperature.classList.add('max-temperature');
    maxTempContainer.appendChild(dayMaxTemperature);

    element.appendChild(maxTempContainer);

    const windContainer = document.createElement('div');

    const windIcon = document.createElement('img');
    windIcon.src = 'assets/wind-fill.svg';
    windContainer.appendChild(windIcon);

    const windDirection = document.createElement('img');
    windDirection.src = `assets/wind-direction.svg`;
    windDirection.style.transform = `rotate(${day.data.windDirection}deg)`;
    windDirection.classList.add('wind-direction');
    windContainer.appendChild(windDirection);

    const windSpeed = document.createElement('span');
    windSpeed.innerText = day.data.windSpeed + 'm/s';
    windSpeed.classList.add('wind-speed');
    windContainer.appendChild(windSpeed);

    element.appendChild(windContainer);

    const dayMinTemperature = document.createElement('span');
    dayMinTemperature.innerText = day.data.minTemperature + '°';
    dayMinTemperature.classList.add('min-temperature');
    element.appendChild(dayMinTemperature);

    return element;
}

const loadVariables = () => {
    changeLoadingBar(10, 'Getting location... (Allow location access if stuck)');
    navigator.geolocation.getCurrentPosition(async (position) => {
        changeLoadingBar(20, 'Getting weather...');
        const weather = await (await fetchWeather(position.coords.latitude, position.coords.longitude)).json();
        changeLoadingBar(40, 'Getting city...');
        const city = await (await fetchCity(position.coords.latitude, position.coords.longitude)).json();
        changeLoadingBar(70, 'Sorting information...');
        const days = getDays(weather);
    
        const daysContainer = document.getElementById('days_container');
        daysContainer.innerHTML = '';
        days.forEach(async (day) => daysContainer.appendChild(await DayElement(day)));
        changeLoadingBar(90, 'Rendering information...');
    
        document.getElementById('location').innerText = `${city.address.city == 'undefined' ? '' : city.address.city + ', '}${city.address.country}`;
        document.getElementById('banner_icon').src = `assets/${getIconFromCode(weather.current_weather.weathercode).icon}`;
        document.getElementById('banner_icon').style.filter = getIconFromCode(weather.current_weather.weathercode).filter;
        document.getElementById('current_temperature').innerText = weather.current_weather.temperature + '°';
        document.getElementById('feels_like').innerText = 'Feels like ' + weather.current_weather.temperature + '°';
    
        document.getElementById('last_updated').innerText = 'Last updated ' + new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
        changeLoadingBar(100, 'Done!');
    });
}

document.getElementById('refresh').addEventListener('click', () => {
    loadVariables();
});

loadVariables();