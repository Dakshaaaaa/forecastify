import React from 'react';
const getDailyForecast = (forecastList) => {
    if (!forecastList) return [];
    const dailyData = {};
    const todayDate = new Date().toISOString().split('T')[0];
    forecastList.forEach(item => {
        const [date, time] = item.dt_txt.split(' ');
        const timeHour = parseInt(time.split(':')[0]);
        if (date === todayDate) return;
        if (timeHour === 12) {
             dailyData[date] = item;
        } 
        else if (timeHour === 15 && !dailyData[date]) {
             dailyData[date] = item;
        }
    });
    return Object.values(dailyData).slice(0, 5);
};
const formatTemp = (temp) => `${Math.round(temp)}`; 
function ForecastSection({ currentForecastData, unit }) {
    const tempSymbol = unit === 'metric' ? '°C' : '°F';
    const dailyForecast = getDailyForecast(currentForecastData ? currentForecastData.list : null);
    if (dailyForecast.length === 0) {
        return null;
    }
    return (
        <div className="forecast-section">
            <h3 className="forecast-title">5-Day Forecast</h3>
            <div className="forecast-grid">
                {dailyForecast.map((dayData, index) => {
                    const date = new Date(dayData.dt * 1000);
                    const dayName = index === 0 ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'short' });
                    const iconCode = dayData.weather[0].icon;
                    const forecastIconUrl = `https://openweathermap.org/img/w/${iconCode}.png`;
                    return (
                        <div key={dayData.dt} className="forecast-item">
                            <p className="day-name">{dayName}</p>
                            <img src={forecastIconUrl} alt={dayData.weather[0].main} className="forecast-icon" />
                            <p className="day-temp">{formatTemp(dayData.main.temp)}{tempSymbol}</p>
                            <p className="day-desc">{dayData.weather[0].main}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
export default ForecastSection;