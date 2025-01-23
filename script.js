// Updated script.js with new features
const userTab = document.querySelector("[data-userWeather]");
const searchTab = document.querySelector("[data-searchWeather]");
const userContainer = document.querySelector(".weather-container");
const grantAccessContainer = document.querySelector(".grant-location-container");
const searchForm = document.querySelector("[data-searchForm]");
const loadingScreen = document.querySelector(".loading-container");
const userInfoContainer = document.querySelector(".user-info-container");
const apiErrorContainer = document.querySelector(".api-error-container");
const apiErrorImg = document.querySelector("[data-notFoundImg]");
const apiErrorMessage = document.querySelector("[data-apiErrorText]");
const retry = document.querySelector(".ahaan");
const travelSuggestionsContainer = document.querySelector(".travel-suggestions-container");
const moodPlaylistsContainer = document.querySelector(".mood-playlists-container");
const clothingAdviceContainer = document.querySelector(".clothing-advice-container");

let currentTab = userTab;
const API_KEY = "31235ba6d2f1bfb1a6829db700aa244c";
const AMADEUS_API_KEY = "1ps5kLmhLIecm3ynDhQ77NTspXoTjGKo";
const AMADEUS_API_SECRET = "MmYzwhaPR7fJaNAG";
const AMADEUS_API_URL = "https://test.api.amadeus.com/v1/reference-data/recommended-locations";

getfromSessionStorage();

currentTab.classList.add("current-tab");

function switchTab(clickedTab) {
    if (currentTab != clickedTab) {
        currentTab.classList.remove("current-tab");
        currentTab = clickedTab;
        currentTab.classList.add("current-tab");

        if (!searchForm.classList.contains("active")) {
            userInfoContainer.classList.remove("active");
            grantAccessContainer.classList.remove("active");
            searchForm.classList.add("active");
        } else {
            searchForm.classList.remove("active");
            userInfoContainer.classList.remove("active");
            getfromSessionStorage();
        }
    }
}

userTab.addEventListener("click", () => {
    switchTab(userTab);
});

searchTab.addEventListener("click", () => {
    switchTab(searchTab);
});

function getfromSessionStorage() {
    const localCoordinates = sessionStorage.getItem("user-coordinates");
    if (!localCoordinates) {
        grantAccessContainer.classList.add("active");
    } else {
        const coordinates = JSON.parse(localCoordinates);
        fetchUserWeatherInfo(coordinates);
    }
}

async function fetchUserWeatherInfo(coordinates) {
    const { lat, lon } = coordinates;
    grantAccessContainer.classList.remove("active");
    loadingScreen.classList.add("active");

    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
        const data = await response.json();

        if (!data || !data.main || !data.weather) {
            throw new Error("Incomplete weather data");
        }

        loadingScreen.classList.remove("active");
        userInfoContainer.classList.add("active");

        renderWeatherInfo(data);
        await updateTravelSuggestions(data);
        updateMoodPlaylists(data);
        updateClothingAdvice(data);
    } catch (err) {
        console.error("Error fetching weather data:", err);
    }
}

function renderWeatherInfo(weatherInfo) {
    const cityName = document.querySelector("[data-cityName]");
    const countryIcon = document.querySelector("[data-countryIcon]");
    const desc = document.querySelector("[data-weatherDesc]");
    const weatherIcon = document.querySelector("[data-weatherIcon]");
    const temp = document.querySelector("[data-temp]");
    const windspeed = document.querySelector("[data-windspeed]");
    const humidity = document.querySelector("[data-humidity]");
    const cloudiness = document.querySelector("[data-cloudiness]");

    cityName.innerText = weatherInfo?.name;
    countryIcon.src = `https://flagcdn.com/144x108/${weatherInfo?.sys?.country.toLowerCase()}.png`;
    desc.innerText = weatherInfo?.weather?.[0]?.description;
    weatherIcon.src = `https://openweathermap.org/img/w/${weatherInfo?.weather?.[0]?.icon}.png`;
    temp.innerText = `${weatherInfo?.main?.temp}°C`;
    windspeed.innerText = `${weatherInfo?.wind?.speed} m/s`;
    humidity.innerText = `${weatherInfo?.main?.humidity}%`;
    cloudiness.innerText = `${weatherInfo?.clouds?.all}%`;
}

async function fetchTravelRecommendations(city) {
    try {
        const tokenResponse = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                'grant_type': 'client_credentials',
                'client_id': AMADEUS_API_KEY,
                'client_secret': AMADEUS_API_SECRET,
            }),
        });

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // Now, make your API request with the Authorization header
        // const response = await fetch(`${AMADEUS_API_URL}?cityCodes=PAR`, {
        const response = await fetch(`${AMADEUS_API_URL}?cityCodes=${city}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });
        if (!response.ok) {
            throw new Error("Failed to fetch travel recommendations.");
        }

        const data = await response.json();

        // Extract recommended destinations
        const recommendations = data?.data?.map((location) => location.name) || [];
        return recommendations;
    } catch (error) {
        console.error("Error fetching travel recommendations:", error);
        return ["Unable to fetch travel recommendations at the moment."];
    }
}

async function updateTravelSuggestions(weatherInfo) {
    const travelSuggestions = document.querySelector("[data-travelSuggestions]");
    const city = weatherInfo?.name;
    const tokenResponse = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            'grant_type': 'client_credentials',
            'client_id': AMADEUS_API_KEY,
            'client_secret': AMADEUS_API_SECRET,
        }),
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const iataResponse = await fetch(`https://test.api.amadeus.com/v1/reference-data/locations?subType=CITY&keyword=${encodeURIComponent(city)}`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    });

    const iataData = await iataResponse.json();
    const iataCode = iataData.data[0]?.iataCode;


    // Fetch travel recommendations from API
    const recommendations = await fetchTravelRecommendations(iataCode);

    // Generate HTML from recommendations
    const suggestionsHTML = recommendations
        .map((recommendation) => `<li>${recommendation}</li>`)
        .join("");

    travelSuggestions.innerHTML = `<strong>Travel Suggestions:</strong> <ul style="list-style-type:none">${suggestionsHTML}</ul>`;
    travelSuggestionsContainer.classList.add("active");
}

function updateMoodPlaylists(weatherInfo) {
    const moodPlaylists = document.querySelector("[data-moodPlaylists]");
    const weatherDesc = weatherInfo?.weather?.[0]?.main || "";

    const defaultPlaylistData = {
        title: "Default Playlist",
        platformLinks: [
            { platform: "Spotify", url: "https://open.spotify.com/playlist/37i9dQZF1DX3rxVfibe1L0" },
            { platform: "YouTube", url: "https://https://youtu.be/-1CwZ-U7UEs?si=2ZjdQdUpu80COHFr" },
            { platform: "Apple Music", url: "https://music.apple.com/us/playlist/default-vibes/pl.u-V9D7MydTVa" },
        ],
    };

    let playlistData = { ...defaultPlaylistData };

    if (weatherDesc.includes("Rain")) {
        playlistData = {
            title: "Relaxing Rainy Day Playlist",
            platformLinks: [
                { platform: "Spotify", url: "https://open.spotify.com/playlist/37i9dQZF1DXbvABJXBIyiY" },
                { platform: "YouTube", url: "https://https://youtu.be/HCWvgoTfUjg?si=Ml6gZliYz30GU-G6" },
                { platform: "Apple Music", url: "https://music.apple.com/us/playlist/relaxing-rainy-day/pl.u-BNA6ZDVsZk" },
            ],
        };
    } else if (weatherDesc.includes("Clear")) {
        playlistData = {
            title: "Sunny Day Vibes Playlist",
            platformLinks: [
                { platform: "Spotify", url: "https://open.spotify.com/playlist/37i9dQZF1DX6ALfRKlHn1t" },
                { platform: "YouTube", url: "https://https://youtu.be/UB9AvrPGT2I?si=d3Y8meb1bsORzLM0" },
                { platform: "Apple Music", url: "https://music.apple.com/us/playlist/sunny-day-vibes/pl.u-BNA6ZvKCAk" },
            ],
        };
    } else if (weatherDesc.includes("Clouds")) {
        playlistData = {
            title: "Chill and Cloudy Mix",
            platformLinks: [
                { platform: "Spotify", url: "https://open.spotify.com/playlist/37i9dQZF1DX4WYpdgoIcn6" },
                { platform: "YouTube", url: "https://youtu.be/gerbE_43WyY?si=9osdXaCSdWCqNOaB" },
                { platform: "Apple Music", url: "https://music.apple.com/us/playlist/chill-and-cloudy/pl.u-pMyljkyFzJ" },
            ],
        };
    }

    // Generate HTML for playlist with links
    const playlistHTML = `
        <strong>Mood Playlist:</strong> ${playlistData.title}
        <ul style="list-style-type:none">
            ${playlistData.platformLinks
            .map(
                (link) =>
                    `<li><a href="${link.url}" target="_blank">${link.platform}</a></li>`
            )
            .join("")}
        </ul>
    `;

    moodPlaylists.innerHTML = playlistHTML;
    moodPlaylistsContainer.classList.add("active");
}

function updateClothingAdvice(weatherInfo) {
    const clothingAdvice = document.querySelector("[data-clothingAdvice]");
    const temp = weatherInfo?.main?.temp;
    let advice = "";

    if (temp < 10) {
        advice = "Wear heavy jackets, gloves, and warm boots.";
    } else if (temp < 20) {
        advice = "A light sweater or jacket should suffice.";
    } else {
        advice = "Stay cool with shorts and t-shirts.";
    }

    clothingAdvice.innerHTML = `<strong>Clothing Advice:</strong> ${advice}`;
    clothingAdviceContainer.classList.add("active");
}

const grantAccessButton = document.querySelector("[data-grantAccess]");
grantAccessButton.addEventListener("click", getlocation);

function getlocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
    } else {
        alert("Geolocation support is not available.");
    }
}

function showPosition(position) {
    const userCoordinates = {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
    };

    sessionStorage.setItem("user-coordinates", JSON.stringify(userCoordinates));
    fetchUserWeatherInfo(userCoordinates);
}

searchForm.addEventListener("submit", (e) => {
    e.preventDefault(); // Prevent page refresh on form submit

    const searchInput = document.querySelector("[data-searchInput]");
    const cityName = searchInput.value;

    if (cityName.trim() === "") {
        alert("Please enter a city name.");
        return;
    }

    fetchSearchWeatherInfo(cityName);
});

async function fetchSearchWeatherInfo(city) {
    loadingScreen.classList.add("active");
    userInfoContainer.classList.remove("active");
    grantAccessContainer.classList.remove("active");

    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`);
        const data = await response.json();

        if (!data || !data.main || !data.weather) {
            throw new Error("City not found or incomplete data.");
        }

        loadingScreen.classList.remove("active");
        userInfoContainer.classList.add("active");

        renderWeatherInfo(data);
        await updateTravelSuggestions(data);
        updateMoodPlaylists(data);
        updateClothingAdvice(data);
    } catch (err) {
        loadingScreen.classList.remove("active");
        apiErrorContainer.classList.add("active");
        apiErrorMessage.innerText = err.message;
    }
}

retry.addEventListener("click", () => {
    apiErrorContainer.classList.remove("active");
    searchForm.classList.add("active");
});

