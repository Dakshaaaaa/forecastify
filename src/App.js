import React, { useState, useEffect, useCallback } from 'react';
import './App.css'; 
import WeatherCard from './WeatherCard';
import ForecastSection from './ForecastSection';
const API_KEY = 'f87b6e463e58ae35532a308d248de87c';
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';
const FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast'; 
function App() {
    const [cityList, setCityList] = useState(['London', 'New York', 'Tokyo']);
    const [selectedCity, setSelectedCity] = useState('London');
    const [weatherDataCache, setWeatherDataCache] = useState({});
    const [forecastDataCache, setForecastDataCache] = useState({}); 
    const [cityInput, setCityInput] = useState(''); 
    const [error, setError] = useState(null); 
    const [loading, setLoading] = useState(false);
    const [geoError, setGeoError] = useState(null);
    const [unit, setUnit] = useState('metric'); 
    const fetchForecast = useCallback(async (cityName, currentUnit) => {
        try {
            const response = await fetch(`${FORECAST_URL}?q=${cityName}&appid=${API_KEY}&units=${currentUnit}`);
            const data = await response.json();
            if (response.ok) {
                setForecastDataCache(prevCache => ({
                    ...prevCache,
                    [data.city.name]: data,
                }));
            } else {
                console.error(`Failed to fetch forecast for ${cityName}:`, data.message);
            }
        } catch (err) {
            console.error(`Error fetching forecast for ${cityName}:`, err);
        }
    }, []);
    const fetchWeather = useCallback(async (cityName, currentUnit = unit, isNewCity = false) => {
        if (!cityName) return;
        const shouldSetGlobalState = cityName.toLowerCase() === selectedCity.toLowerCase();
        if (shouldSetGlobalState) {
             setLoading(true);
             setError(null);
        }
        try {
            const response = await fetch(`${BASE_URL}?q=${cityName}&appid=${API_KEY}&units=${currentUnit}`);
            const data = await response.json();
            if (response.ok) {
                const confirmedCityName = data.name;
                if (isNewCity && !cityList.includes(confirmedCityName)) {
                    setCityList(prevList => [...prevList, confirmedCityName]);
                    setSelectedCity(confirmedCityName);
                }
                setWeatherDataCache(prevCache => ({
                    ...prevCache,
                    [confirmedCityName]: data,
                }));      
                fetchForecast(confirmedCityName, currentUnit); 
            } else {
                 const errorMessage = data.message || `City not found: ${cityName}.`;     
                 if (shouldSetGlobalState) {
                     setError(errorMessage);
                 } else {
                     console.error(`Error fetching initial data for ${cityName}: ${errorMessage}`);
                     setCityList(prevList => prevList.filter(city => city !== cityName));
                 }
            }
        } catch (err) {
            if (shouldSetGlobalState) {
                setError('Failed to fetch weather data. Check your connection.');
            } else {
                console.error(`Connection error for ${cityName}`, err);
            }
        } finally {
            if (shouldSetGlobalState) {
                setLoading(false);
            }
        }
    }, [unit, selectedCity, cityList, fetchForecast]);
    const fetchWeatherByCoords = useCallback(async (lat, lon) => {
        setLoading(true);
        setError(null);
        setGeoError(null);
        try {
            const response = await fetch(`${BASE_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${unit}`);
            const data = await response.json();
            if (response.ok) {
                const geoCityName = data.name;
                if (!cityList.includes(geoCityName)) {
                    setCityList(prevList => [...prevList, geoCityName]);
                }
                setSelectedCity(geoCityName); 
                setWeatherDataCache(prevCache => ({
                    ...prevCache,
                    [geoCityName]: data,
                })); 
                fetchForecast(geoCityName, unit); 
            } else {
                setError(data.message || 'Failed to fetch weather for your location.');
            }
        } catch (err) {
            setError('Failed to fetch data. Check your connection.');
        } finally {
            setLoading(false);
        }
    }, [unit, cityList, fetchForecast]);
    useEffect(() => {
        cityList.forEach(city => {
            if (!weatherDataCache[city] || !forecastDataCache[city]) {
                 fetchWeather(city, unit);
            }
        });
        if (selectedCity && !weatherDataCache[selectedCity]) {
             fetchWeather(selectedCity, unit);
        }
    }, [cityList, fetchWeather, unit, selectedCity]);
    const handleSearch = (e) => {
        e.preventDefault(); 
        const cityToSearch = cityInput.trim();
        if (cityToSearch) {
            const existingCity = cityList.find(c => c.toLowerCase() === cityToSearch.toLowerCase()); 
            if (existingCity) {
                setSelectedCity(existingCity);
                setCityInput(''); 
                if (!weatherDataCache[existingCity]) {
                    fetchWeather(existingCity, unit);
                }
                if (!forecastDataCache[existingCity]) {
                    fetchForecast(existingCity, unit);
                }
            } else {
                setSelectedCity(cityToSearch); 
                setCityInput(''); 
                fetchWeather(cityToSearch, unit, true); 
            }
        }
    };
    const handleDeleteCity = (cityToDelete, e) => {
        e.stopPropagation(); 
        const newCityList = cityList.filter(city => city !== cityToDelete);
        setCityList(newCityList);
        setWeatherDataCache(prevCache => {
            const newCache = { ...prevCache };
            delete newCache[cityToDelete];
            return newCache;
        });    
        setForecastDataCache(prevCache => {
            const newCache = { ...prevCache };
            delete newCache[cityToDelete];
            return newCache;
        });
        if (selectedCity === cityToDelete && newCityList.length > 0) {
            setSelectedCity(newCityList[0]);
        } else if (newCityList.length === 0) {
             setSelectedCity('');
             setError(null); 
        }
        if (error && error.includes(cityToDelete)) {
             setError(null);
        }
    };
    const handleLocationClick = () => {
        setGeoError(null);
        setLoading(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
                },
                (error) => {
                    if (error.code === 1) {
                        setGeoError('Please enable location access in your browser settings.');
                    } else {
                        setGeoError('Unable to retrieve your location.');
                    }
                    setLoading(false);
                }
            );
        } else {
            setGeoError('Geolocation is not supported by your browser.');
            setLoading(false);
        }
    };
    const toggleUnit = (targetUnit) => {
        if (targetUnit === unit) return;
        const newUnit = targetUnit;
        setUnit(newUnit);
        setWeatherDataCache({});
        setForecastDataCache({});
        cityList.forEach(cityName => {
            fetchWeather(cityName, newUnit); 
        });
    };
    const getAppBackgroundClass = () => {
        const currentWeatherData = weatherDataCache[selectedCity];
        if (currentWeatherData && currentWeatherData.weather && currentWeatherData.weather.length > 0) {
            const { weather, sys } = currentWeatherData;
            const mainCondition = weather[0].main;
            const now = Date.now();
            if (sys && sys.sunrise && sys.sunset) {
                const sunrise = sys.sunrise * 1000;
                const sunset = sys.sunset * 1000;
                const isNight = now < sunrise || now > sunset;    
                if (mainCondition === 'Clear' && isNight) {
                    return 'Clear-Night-bg';
                }
            }
            return `${mainCondition}-bg`;
        }
        return 'default-bg';
    };
    const renderContent = () => {
        const currentWeatherData = weatherDataCache[selectedCity];
        const currentForecastData = forecastDataCache[selectedCity];
        if (loading && !currentWeatherData) {
            return <p className="loading-text">Loading weather data...</p>;
        }
        if (error) {
            return <p className="error-text">Error: {error}</p>;
        }
        if (!currentWeatherData) {
             return <p className="welcome-text">Select a city from the tabs or add a new one!</p>;
        }
        return (
            <>
                <WeatherCard 
                    currentWeatherData={currentWeatherData} 
                    unit={unit} 
                />
                
                <ForecastSection 
                    currentForecastData={currentForecastData} 
                    unit={unit} 
                />
            </>
        );
    };
    return (
        <div className={`App ${getAppBackgroundClass()}`}>
            <header className="App-header"></header>
            <main>
                <div className="app-title-container">
                </div>
                <div className="search-controls"> 
                    <div className="city-tabs">
                        {cityList.map(cityName => (
                            <button
                                key={cityName}
                                onClick={() => {
                                    setSelectedCity(cityName);
                                    setError(null); 
                                    if (!weatherDataCache[cityName]) {
                                        fetchWeather(cityName, unit); 
                                    }
                                }}
                                className={`city-tab-button ${selectedCity === cityName ? 'active' : ''}`}
                            >
                                <span className="city-name">{cityName}</span>
                                {cityList.length > 0 && (
                                    <span 
                                        className="delete-city-button"
                                        onClick={(e) => handleDeleteCity(cityName, e)}
                                    >
                                        &times;
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                    <div className="controls-row">
                        <div className="unit-toggle">
                            <button 
                                onClick={() => toggleUnit('metric')}
                                className={`unit-button ${unit === 'metric' ? 'active' : ''}`}
                            >
                                °C
                            </button>
                            <button 
                                onClick={() => toggleUnit('imperial')}
                                className={`unit-button ${unit === 'imperial' ? 'active' : ''}`}
                            >
                                °F
                            </button>
                        </div>
                        
                        <form onSubmit={handleSearch} className="search-form">
                            <input
                                type="text"
                                placeholder="Enter city name..."
                                value={cityInput}
                                onChange={(e) => setCityInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSearch(e); 
                                }}
                                className="city-input"
                            />
                            <button type="submit" className="search-button" disabled={loading}>
                                Add City
                            </button>
                        </form>  
                        <button 
                            onClick={handleLocationClick} 
                            className="location-button"
                            disabled={loading}
                        >
                            {loading && !weatherDataCache[selectedCity] ? 'Locating...' : 'Use My Location'}
                        </button>
                    </div>  
                    {geoError && <p className="error-text location-error">{geoError}</p>}
                </div>
                <div className="weather-container">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
}
export default App;