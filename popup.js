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
  const regionsUrl = "https://api.pollenrapporten.se/v1/regions";
  try {
    console.log("Fetching regions from:", regionsUrl);
    const response = await fetch(regionsUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Received regions data:", data);
    
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
      // Load saved region after populating the dropdown
      await loadSavedRegion();
    } else {
      console.error("Unexpected data format:", data);
    }
  } catch (error) {
    console.error("Error fetching regions:", error);
    document.getElementById("data").innerHTML = 
      "<p style='color: red;'>Kunde inte ladda regioner. Vänligen försök igen senare.</p>";
  }
};

// Call populateRegions when the popup opens
document.addEventListener("DOMContentLoaded", populateRegions);

// Add change event listener to region select
document.getElementById("region-select").addEventListener("change", async (event) => {
  // Save selected region
  try {
    await chrome.storage.sync.set({ 'selectedRegion': event.target.value });
    console.log('Region saved:', event.target.value);
  } catch (error) {
    console.error("Error saving region:", error);
  }
  // Clear the current data instead of fetching new data
  document.getElementById("data").innerHTML = "<p>Ingen data än.</p>";
});

document.getElementById("fetch-data").addEventListener("click", () => {
  const selectedRegion = document.getElementById("region-select").value;
  const forecastUrl = selectedRegion === "all" 
    ? "https://api.pollenrapporten.se/v1/forecasts?current=true"
    : `https://api.pollenrapporten.se/v1/forecasts?region_id=${selectedRegion}&current=true`;
  
  const regionsUrl = "https://api.pollenrapporten.se/v1/regions";
  const pollenTypesUrl = "https://api.pollenrapporten.se/v1/pollen-types";

  let regions = {};
  let pollenTypes = {};

  // Hämta regioner
  fetch(regionsUrl)
    .then((response) => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then((data) => {
      data.items.forEach((region) => {
        regions[region.id] = region.name;
      });

      // Hämta pollentyper
      return fetch(pollenTypesUrl);
    })
    .then((response) => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then((data) => {
      // Spara alla tillgängliga pollentyper
      const allPollenTypes = [];
      data.items.forEach((pollen) => {
        pollenTypes[pollen.id] = pollen.name;
        allPollenTypes.push(pollen.name);
      });

      // Hämta prognoser
      return fetch(forecastUrl).then(response => ({
        response: response,
        allPollenTypes: allPollenTypes
      }));
    })
    .then(({response, allPollenTypes}) => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json().then(data => ({
        data: data,
        allPollenTypes: allPollenTypes
      }));
    })
    .then(({data, allPollenTypes}) => {
      const dataDiv = document.getElementById("data");
      if (data.items && data.items.length > 0) {
        // Skapa en lista för sortering
        const sortedForecasts = data.items.map((forecast) => ({
          regionName: regions[forecast.regionId] || "Okänd region",
          levels: forecast.levelSeries || []
        }));

        // Sortera listan efter regionnamn
        sortedForecasts.sort((a, b) => a.regionName.localeCompare(b.regionName));

        // Generera tabell
        let output = `
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
    })
    .catch((error) => {
      console.error("Error:", error);
      document.getElementById("data").innerHTML =
        "<p style='color: red;'>Kunde inte hämta data. Försök igen senare.</p>";
    });
});