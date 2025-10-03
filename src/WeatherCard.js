import React from 'react';
const formatTemp = (temp) => `${Math.round(temp)}`; 
function WeatherCard({ currentWeatherData, unit }) {
    if (!currentWeatherData) {
        return null;
    }
    const { name, main, weather, wind, dt } = currentWeatherData; 
    const iconUrl = `https://openweathermap.org/img/w/${weather[0].icon}.png`;
    const tempSymbol = unit === 'metric' ? '°C' : '°F';
    const windUnit = unit === 'metric' ? 'm/s' : 'mph';
    const lastUpdated = new Date(dt * 1000).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true, 
    });
    return (
        <div className="weather-content-wrapper">
            <div className="weather-card main-card">
                <h2>{name}</h2>
                <p className="last-updated">Last Updated: {lastUpdated}</p>                
                <div className="weather-icon-container">
                    <img src={iconUrl} alt={weather[0].description} className="weather-icon" />
                    <p className="description">{weather[0].description}</p>
                </div>
                <p className="temp">
                    <span className="temp-number">{formatTemp(main.temp)}</span>
                    <span className="temp-unit">{tempSymbol}</span>
                </p>
                <div className="details">
                    <p>Feels like: {formatTemp(main.feels_like)}{tempSymbol}</p>
                    <p>Min Temp: {formatTemp(main.temp_min)}{tempSymbol}</p>
                    <p>Max Temp: {formatTemp(main.temp_max)}{tempSymbol}</p>
                    <p>Pressure: {main.pressure} hPa</p>
                </div>
            </div>
            <div className="highlights-card">
                <h3>Today's Highlights</h3>
                <div className="details highlights-grid">
                    <div className="highlight-item">
                        <p className="highlight-title">Humidity</p>
                        <p className="highlight-value">{main.humidity}%</p>
                    </div>
                    <div className="highlight-item">
                        <p className="highlight-title">Wind Speed</p>
                        <p className="highlight-value">{wind.speed} {windUnit}</p>
                    </div>
                    <div className="highlight-item">
                        <p className="highlight-title">Visibility</p>
                        <p className="highlight-value">{Math.round(currentWeatherData.visibility / 1000)} km</p>
                    </div>
                    <div className="highlight-item">
                        <p className="highlight-title">Cloudiness</p>
                        <p className="highlight-value">{currentWeatherData.clouds.all}%</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default WeatherCard;