// Cache setup
const CACHE_DURATION = 30 * 60 * 1000; // 30 minuter (millisekunder)
const cache = {
  regions: { data: null, timestamp: 0 },
  pollenTypes: { data: null, timestamp: 0 },
  forecasts: {}  // format: { regionId: { data, timestamp } }
};

// Funktion för att kontrollera om cache är giltig
const isCacheValid = (cacheItem) => {
  return cacheItem && 
         cacheItem.data && 
         cacheItem.timestamp && 
         (Date.now() - cacheItem.timestamp < CACHE_DURATION);
};

// Load saved region and fetch data
const loadSavedRegion = async () => {
  try {
    const result = await chrome.storage.sync.get('selectedRegion');
    if (result.selectedRegion) {
      const regionSelect = document.getElementById("region-select");
      regionSelect.value = result.selectedRegion;
      // We don't auto-fetch data anymore when loading saved region
    }
  } catch (error) {
    console.error("Error loading saved region:", error);
  }
};

// Populate regions when the popup opens
const populateRegions = async () => {
  // Kontrollera om vi har giltig cache för regioner
  if (isCacheValid(cache.regions)) {
    console.log("Använder cachade regioner");
    populateRegionDropdown(cache.regions.data);
    await loadSavedRegion();
    return;
  }

  const regionsUrl = "https://api.pollenrapporten.se/v1/regions";
  try {
    console.log("Fetching regions from:", regionsUrl);
    const response = await fetch(regionsUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Received regions data:", data);
    
    // Uppdatera cache
    cache.regions = {
      data: data,
      timestamp: Date.now()
    };

    populateRegionDropdown(data);
    
    // Load saved region after populating the dropdown
    await loadSavedRegion();
  } catch (error) {
    console.error("Error fetching regions:", error);
    document.getElementById("data").innerHTML = 
      "<p style='color: red;'>Kunde inte ladda regioner. Vänligen försök igen senare.</p>";
  }
};

// Hjälpfunktion för att fylla i regioner i dropdown
function populateRegionDropdown(data) {
  const regionSelect = document.getElementById("region-select");
  
  if (data.items && Array.isArray(data.items)) {
    // Sort regions alphabetically
    data.items.sort((a, b) => a.name.localeCompare(b.name));
    
    // Clear existing options except "Alla regioner"
    while (regionSelect.options.length > 1) {
      regionSelect.remove(1);
    }
    
    // Add new options, filter out "Sverige"
    data.items.forEach((region) => {
      // Skip adding "Sverige" to the options
      if (region.name !== "Sverige") {
        const option = document.createElement("option");
        option.value = region.id;
        option.textContent = region.name;
        regionSelect.appendChild(option);
      }
    });
    
    console.log("Successfully populated regions");
  } else {
    console.error("Unexpected data format:", data);
  }
}

// Call populateRegions when the popup opens
document.addEventListener("DOMContentLoaded", populateRegions);

// Add change event listener to region select
document.getElementById("region-select").addEventListener("change", async (event) => {
  // Save selected region
  try {
    await chrome.storage.sync.set({ 'selectedRegion': event.target.value });
    console.log('Region saved:', event.target.value);
    
    // Invalidera cache för denna region när användaren byter
    if (cache.forecasts[event.target.value]) {
      delete cache.forecasts[event.target.value];
    }
  } catch (error) {
    console.error("Error saving region:", error);
  }
  // Clear the current data instead of fetching new data
  document.getElementById("data").innerHTML = "<p>Ingen data än.</p>";
});

document.getElementById("fetch-data").addEventListener("click", () => {
  const selectedRegion = document.getElementById("region-select").value;
  
  // Kontrollera om vi har giltig cache för denna regions prognos
  if (cache.forecasts[selectedRegion] && isCacheValid(cache.forecasts[selectedRegion])) {
    console.log("Använder cachad prognosdata för region:", selectedRegion);
    displayForecastData(
      cache.forecasts[selectedRegion].data,
      cache.regions.data.items,
      cache.pollenTypes.data.items,
      selectedRegion
    );
    return;
  }
  
  const forecastUrl = selectedRegion === "all" 
    ? "https://api.pollenrapporten.se/v1/forecasts?current=true"
    : `https://api.pollenrapporten.se/v1/forecasts?region_id=${selectedRegion}&current=true`;
  
  const regionsUrl = "https://api.pollenrapporten.se/v1/regions";
  const pollenTypesUrl = "https://api.pollenrapporten.se/v1/pollen-types";

  let regions = {};
  let pollenTypes = {};

  // Fetch all required data with caching
  const fetchData = async () => {
    try {
      // Fetch regions if not cached
      if (!isCacheValid(cache.regions)) {
        console.log("Hämtar regioner...");
        const regionsResponse = await fetch(regionsUrl);
        if (!regionsResponse.ok) throw new Error('Network response was not ok');
        const regionsData = await regionsResponse.json();
        cache.regions = { data: regionsData, timestamp: Date.now() };
      }

      // Fetch pollen types if not cached
      if (!isCacheValid(cache.pollenTypes)) {
        console.log("Hämtar pollentyper...");
        const pollenTypesResponse = await fetch(pollenTypesUrl);
        if (!pollenTypesResponse.ok) throw new Error('Network response was not ok');
        const pollenTypesData = await pollenTypesResponse.json();
        cache.pollenTypes = { data: pollenTypesData, timestamp: Date.now() };
      }

      // Always fetch fresh forecast data
      console.log("Hämtar pollenprognoser...");
      const forecastResponse = await fetch(forecastUrl);
      if (!forecastResponse.ok) throw new Error('Network response was not ok');
      const forecastData = await forecastResponse.json();
      
      // Cache forecast data
      cache.forecasts[selectedRegion] = { 
        data: forecastData, 
        timestamp: Date.now() 
      };

      // Process and display data
      displayForecastData(
        forecastData, 
        cache.regions.data.items, 
        cache.pollenTypes.data.items,
        selectedRegion
      );
    } catch (error) {
      console.error("Error:", error);
      document.getElementById("data").innerHTML =
        "<p style='color: red;'>Kunde inte hämta data. Försök igen senare.</p>";
    }
  };

  fetchData();
});

// Hjälpfunktion för att formatera datum
function formatDateRange(startDate, endDate) {
  // Konvertera från strängdatum till Date-objekt
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Skapa svenska datumformat
  const options = { day: 'numeric', month: 'long' };
  
  // Om år är olika, lägg till år i båda
  if (start.getFullYear() !== end.getFullYear()) {
    options.year = 'numeric';
  }
  
  const startStr = start.toLocaleDateString('sv-SE', options);
  
  // För slutdatum, alltid visa år om det är olika år
  const endOptions = {...options};
  if (start.getFullYear() !== end.getFullYear()) {
    endOptions.year = 'numeric';
  }
  
  const endStr = end.toLocaleDateString('sv-SE', options);
  
  return `${startStr} - ${endStr}`;
}

// Funktion för att visa prognosdata
function displayForecastData(forecastData, regionsData, pollenTypesData, selectedRegion) {
  const dataDiv = document.getElementById("data");
  
  // Skapa mappningar
  const regions = {};
  regionsData.forEach((region) => {
    regions[region.id] = region.name;
  });
  
  const pollenTypes = {};
  const allPollenTypes = [];
  pollenTypesData.forEach((pollen) => {
    pollenTypes[pollen.id] = pollen.name;
    allPollenTypes.push(pollen.name);
  });
  
  if (forecastData.items && forecastData.items.length > 0) {
    let output = "";
    
    // Extrahera datuminformation från första prognos
    const firstForecast = forecastData.items[0];
    if (firstForecast.startDate && firstForecast.endDate) {
      const dateRangeStr = formatDateRange(firstForecast.startDate, firstForecast.endDate);
      output += `
        <div class="forecast-date">
          <span class="date-label">Giltigt:</span> 
          <span class="date-value">${dateRangeStr}</span>
        </div>
      `;
    }
    
    // Extrahera och visa textbeskrivningen om den finns
    if (forecastData.items[0].text) {
      const forecastText = forecastData.items[0].text;
      output += `
        <div class="forecast-message">
          <div class="message-icon">ℹ️</div>
          <div class="message-text">${forecastText}</div>
        </div>
      `;
    }
    
    // Skapa en lista för sortering
    const sortedForecasts = forecastData.items.map((forecast) => ({
      regionName: regions[forecast.regionId] || "Okänd region",
      levels: forecast.levelSeries || []
    }));

    // Sortera listan efter regionnamn
    sortedForecasts.sort((a, b) => a.regionName.localeCompare(b.regionName));

    // Generera tabell
    output += `
      <table>
        <tr>
          ${selectedRegion === "all" ? '<th>Region</th>' : ''}
          <th>Pollen</th>
          <th>Nivå</th>
        </tr>
    `;

    // Used to track unique pollen entries for a region
    const processedPollen = new Set();

    sortedForecasts.forEach((forecast) => {
      forecast.levels.forEach((level) => {
        const pollenName = pollenTypes[level.pollenId] || "Okänt pollen";
        const pollenLevel = level.level;

        // Create unique key for region+pollen combination
        const uniqueKey = `${forecast.regionName}-${pollenName}`;

        // Skip if we've already processed this combination or if level is 0/invalid
        if (processedPollen.has(uniqueKey) || 
            pollenLevel === undefined || 
            pollenLevel === null || 
            pollenLevel === 0) {
          return;
        }

        // Add to processed set
        processedPollen.add(uniqueKey);

        // Matcha nivå med kort beskrivning och färgklass
        const levelMap = {
          1: { text: "Låg", class: "level-low" },
          2: { text: "Medel", class: "level-medium" },
          3: { text: "Hög", class: "level-high" },
          4: { text: "Extrem", class: "level-extreme" }
        };

        const levelInfo = levelMap[pollenLevel] || { text: "Okänd", class: "level-none" };

        output += `
          <tr>
            ${selectedRegion === "all" ? `<td>${forecast.regionName}</td>` : ''}
            <td>${pollenName}</td>
            <td class="${levelInfo.class}">${levelInfo.text}</td>
          </tr>
        `;
      });
    });

    output += "</table>";
    
    // Skapa lista över aktiva pollentyper
    const activePollenTypes = new Set();
    sortedForecasts.forEach(forecast => {
      forecast.levels.forEach(level => {
        if (level.level > 0) {
          activePollenTypes.add(pollenTypes[level.pollenId]);
        }
      });
    });

    // Lägg till information om aktiva pollentyper
    if (activePollenTypes.size > 0) {
      const activeTypesList = Array.from(activePollenTypes).sort().join(", ").toLowerCase();
      output += `
        <p style="font-size: 12px; color: #666; margin-top: 15px; font-style: italic;">
          Pollenmätningar sker just nu för: ${activeTypesList}. Övriga typer mäts när de är i säsong.
        </p>
      `;
    }
    
    dataDiv.innerHTML = output;
  } else {
    dataDiv.innerHTML = "<p>Inga aktuella pollenprognoser tillgängliga just nu.</p>";
  }
}