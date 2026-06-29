export const layerNames: Record<string, string | undefined> = {
  "tempo-no2": "TEMPO NO2",
  "tempo-lite": "TEMPO NO2 (alt)",
  "aqi-layer-aqi": "Air Quality Index",
  "power-plants-heatmap": "Power Plants",
  "power-plants-layer": "Power Plants",
  "stamen-toner-lines": "Roads & Boundaries",
  "stamen-toner-labels": "Place Labels",
  "pop-dens": "Population Density",
  "land-use": "Land Use",
  "hms-fire": "Fire Detections",
  'tempo-hcho': "TEMPO HCHO",
  'tempo-o3': "TEMPO Ozone",
  "places-asthma-counties": "Asthma Prevalence (Counties)",
  "places-asthma-tracts": "Asthma Prevalence (Tracts)",
};

export const layerInfo: Record<string, string | undefined> = {
  "tempo-no2": `<h3>TEMPO Nitrogen Dioxide (NO<sub>2</sub>) Data Layer</h3>
                <br/>
                This data layer shows the amount of nitrogen dioxide (NO<sub>2</sub>) in the lower part of the Earth's atmosphere, called the troposphere. This measurement represents the total number of nitrogen dioxide molecules in a column of air above one square centimeter on the Earth's surface (molecules/cm2). NO<sub>2</sub> is an air pollutant that can affect both air quality and human health. It is produced by burning fossil fuels (ie. vehicles and power plants), fires, and even lightning.
                <br/><br/>
                TEMPO's sensor captures this data at about 2 km by 4.75 km at the center of the field of regard (FOR). The data is processed into a Level 3 product with a resolution of 0.02 by 0.02 degrees, and the imagery you see is displayed at about 2 km resolution. To ensure accuracy, the layer is filtered, and only includes high-quality data points, based on key quality checks and sunlight conditions (solar zenith angle).
                <br/><br/>
                Source: <a href="https://tempo.si.edu" target="_blank" rel="noopener noreferrer">NASA TEMPO</a>
                <br/><br/>
                Data available at NASA Earthdata GIS: <a href="https://gis.earthdata.nasa.gov/portal/home/item.html?id=0252904123a74e74a7cff652d52a5b19" target="_blank" rel="noopener noreferrer">V03 (Aug 2023–Sep 2025)</a>, <a href="https://gis.earthdata.nasa.gov/portal/home/item.html?id=854ce7aed24f43ad939353c010eddbf0" target="_blank" rel="noopener noreferrer">V04 (Sep 2025–present)</a>`,
                
  // update text
  "tempo-lite": `<h3>TEMPO Nitrogen Dioxide (NO<sub>2</sub>)—Alternate</h3>
                <br/>
                <strong>Note:</strong> This alternate version of TEMPO's NO<sub>2</sub> data is being shown because the NASA GIS service is down. This version of the data can be explored more at <a href="https://projects.cosmicds.cfa.harvard.edu/tempo-lite/" target="_blank">TEMPO-Lite</a>.
                <br/><br/>
                This data layer shows the amount of nitrogen dioxide (NO<sub>2</sub>) in the lower part of the Earth's atmosphere, called the troposphere. This measurement represents the total number of nitrogen dioxide molecules in a column of air above one square centimeter on the Earth's surface (molecules/cm2). NO<sub>2</sub> is an air pollutant that can affect both air quality and human health. It is produced by burning fossil fuels (ie. vehicles and power plants), fires, and even lightning.
                <br/><br/>
                TEMPO's sensor captures this data at about 2 km by 4.75 km at the center of the field of regard (FOR). The data is processed into a Level 3 product with a resolution of 0.02 by 0.02 degrees, and the imagery you see is displayed at about 2 km resolution. To ensure accuracy, the layer is filtered, and only includes high-quality data points, based on key quality checks and sunlight conditions (solar zenith angle).
                <br/><br/>
                Source: <a href="https://cosmicds.cfa.harvard.edu" target="_blank" rel="noopener noreferrer">CosmicDS</a>
                <br/><br/>
                Data available at <a href="https://projects.cosmicds.cfa.harvard.edu/tempo-lite/" target="_blank" rel="noopener noreferrer">TEMPO-Lite</a>`,
                
  "tempo-hcho": `<h3>TEMPO Formaldehyde (HCHO) Data Layer</h3>
                 <br/>
                 This layer shows the total amount of formaldehyde in a vertical column of Earth's atmosphere. The measurement represents the number of formaldehyde molecules in a column of air above each square centimeter of Earth's surface. Formaldehyde is a Volatile Organic Compound (VOC), a major category of air pollutant that impacts human health and is a precursor to ozone. It is produced by natural sources (trees) as well as man-made sources, such as exhaust from cars, manufacturing plants, and oil and gas extraction.
                 <br/><br/>
                 TEMPO collects this information at about 2 km by 4.75 km near the center of its viewing area. The data is processed into a Level 3 product with a resolution of 0.02 by 0.02 degrees. The imagery you see is displayed at about 2 km resolution. To ensure accuracy, the layer only includes high-quality data points, filtered using key quality checks, sunlight conditions, and cloud coverage.
                 <br/><br/>
                 Source: <a href="https://tempo.si.edu" target="_blank" rel="noopener noreferrer">NASA TEMPO</a>
                 <br/><br/>
                 Data available at NASA Earthdata GIS: <a href="https://gis.earthdata.nasa.gov/portal/home/item.html?id=474a1016d4d54f97b99e6926328e01c1" target="_blank" rel="noopener noreferrer">V03 (Aug 2023–Sep 2025)</a>, <a href="https://gis.earthdata.nasa.gov/portal/home/item.html?id=cae8430051bf4213adb14783c5cbf000" target="_blank" rel="noopener noreferrer">V04 (Sep 2025–present)</a>`,
                 
  "tempo-o3": `<h3>TEMPO Ozone (O3) Data Layer</h3>
               <br/>
               This layer shows the total amount of ozone in a vertical column of Earth's atmosphere, measured in Dobson Units (DU). In the upper atmosphere, ozone plays an important role in protecting life on Earth by absorbing harmful ultraviolet radiation, but in the troposphere ozone is an air pollutant that can affect plant, animal, and human health. Ozone in the troposphere is produced when NO<sub>2</sub> and volatile organic compounds, like HCHO interact in sunlight.
               <br/><br/>
               TEMPO collects ozone measurements at about 2 km by 4.75 km near the center of its viewing area. The data is processed into a Level 3 product with a resolution of 0.02 by 0.02 degrees, and the imagery you see is displayed at about 2 km resolution. To ensure accuracy, the layer only includes high-quality data points, filtered using sunlight conditions (solar zenith angles less than 80°).
               <br/><br/>
               Source: <a href="https://tempo.si.edu" target="_blank" rel="noopener noreferrer">NASA TEMPO</a>. 
               <br/><br/>
               Data available at NASA Earthdata GIS: <a href="https://gis.earthdata.nasa.gov/portal/home/item.html?id=6a70c1e857cf43b1a28ab8738fe47519" target="_blank" rel="noopener noreferrer">V03 (Aug 2023–Sep 2025)</a>, <a href="https://gis.earthdata.nasa.gov/portal/home/item.html?id=69379d4b54364969b8538ea72276dcfb" target="_blank" rel="noopener noreferrer">V04 (Sep 2025–present)</a>`,
               
  "hms-fire": ` <h3>NOAA Hazard Mapping System Fire And Smoke Product</h3>
                This layer displays where potential fires have been identified using data from the NOAA Hazard Mapping System. Multiple satellites are used to detect these active fires. However, these sensors are sensitive to both heat sources and reflected sunlight. Industrial sources like steel mills and reflective surfaces like solar panels may create similar signals, but are typically filtered out during data processing. Fire detections can be impacted by environmental factors including cloud cover, dense smoke, and the terrain.
                <br/><br/>
                The colors represent the fire's radiative power (FRP), which is a measure of the heat energy released by the fire, expressed in megawatts (MW). Higher FRP values often indicate more intense burning within a group of fire pixels, though these values can vary depending on imaging conditions. If FRP data isn't available for a location, a placeholder value is used.
                <br/><br/>
                Satellites: GOES/ABI, the JPSS/VIIRS and EOS/MODIS
                <br/><br/>
                Source: <a href="https://www.ospo.noaa.gov/" target="_blank" rel="noopener noreferrer">NOAA</a>. 
                <br/><br/> 
                Data available at <a href="https://www.ospo.noaa.gov/products/land/hms.html" target="_blank" rel="noopener noreferrer">Hazard Mapping System Fire And Smoke Product</a>`,
                
  "land-use": ` <h3>Sentinal-2 Land Use (2024)</h3>
                This layer shows a global map of land use and land cover (LULC) created from high-resolution Sentinel-2 satellite imagery. The annual map is generated using Impact Observatory's AI land classification model which was trained on billions of pixels each labeled by a person and provided by the National Geographic Society.
                <br/><br/>
                The land cover categories include: Water, Trees, Flooded Vegetation, Crops, Built Areas, Bare Ground, Snow/Ice, Clouds, and Rangeland.
                <br/><br/>
                Source: <a href="https://livingatlas.arcgis.com" target="_blank" rel="noopener noreferrer">ESRI Living Atlas</a> (ESA Sentinel-2, Impact Observatory)
                <br><br/>
                Data available at <a href="https://livingatlas.arcgis.com/landcoverexplorer/" target="_blank" rel="noopener noreferrer">Land Cover Explorer</a>`,
                
  "pop-dens": ` <h3>World Population Density</h3>
                This layer shows the estimates of human population density, indicated as the number of people per square kilometer, based on official national census and population data. The layer was created using data from ~13.5 million administrative units worldwide.
                 <br/><br/>
                 Source: <a href="https://ciesin.columbia.edu/content/data" target="_blank" rel="noopener noreferrer">CIESIN - Columbia University</a> (Formerly <a href="https://www.earthdata.nasa.gov/news/data-from-sedac-available-again-earthdata-search">NASA SEDAC</a>). 
                 <br/><br/>
                 Data available at <a href="https://www.arcgis.com/home/item.html?id=a9fea1ecd1ba4f7db80a0f667fbc508b" target="_blank" rel="noopener noreferrer">ArcGIS Living Atlas</a>`,
                 
  "aqi-layer-aqi": `<h3>EPA AirNow Air Quality Index</h3>
                    This layer shows the air quality index (AQI) using six color coded categories, each representing a range of values. Higher AQI values indicate higher levels of air pollution.  The AQI for each pollutant is based on health standards set for that pollutant and the scientific information that supports that standard. For ozone, the AQI is calculated on an 8-hour average while for particle pollution it uses a 24-hour average. The reported AQI is the PM2.5 AQI index (from <strong>P</strong>articulate <strong>M</strong>atter less then 2.5 micro-meters in size).
                    <br/><br/>
                    Source: <a href="https://www.airnow.gov" target="_blank" rel="noopener noreferrer">EPA AirNow</a>. 
                    <br/><br/> 
                    Data available at <a href="https://gispub.epa.gov/airnow/index.html?monitors=pm25&tab=current" target="_blank" rel="noopener noreferrer">AirNow GIS</a>`,
                    
  "power-plants-layer": `<h3> US Power Plants (as of Oct 2025) </h3>
                        This layer shows all of the operable electric power plants in the United States with a maximum combined generating capacity of at least 30 megawatts (MW) or more (anywhere from ~400-800 homes a year). They are categorized by their energy source. The layer includes plants that are currently running, on standby, or are temporarily out of service.
                         <br/><br/>
                         The three major categories for generating electricity are fossil fuels, nuclear energy, and renewable energy sources.
                         <br/><br/>
                         Source: <a href="https://www.eia.gov/electricity/data.php" target="_blank" rel="noopener noreferrer">U.S. Energy Information Administration (EIA) - Electricity Data</a>. 
                         <br/><br/>
                         Data available at <a href="https://gis-fema.hub.arcgis.com/datasets/b063316fac7345dba4bae96eaa813b2f/about" target="_blank" rel="noopener noreferrer">FEMA Geospatial Resource Center</a>. Last accessed Oct. 16, 2025`,
                         
  "places-asthma-counties": `<h3>CDC Asthma Prevelance</h3>
                          PLACES is a health data project from the CDC and its partners. It gives local estimates about health in communities across the United States, including counties, cities, neighborhoods, and ZIP Code areas.
                          <br/><br/>
                          For asthma, PLACES shows estimates of how many adults currently have asthma in each county. To make these estimates, it uses information from national health surveys and U.S. Census data.
                          <br/><br/>
                          This helps people compare asthma rates in different communities and better understand where asthma may be a bigger health concern.
                          <br/><br/>
                          Source: <a href="https://www.cdc.gov" target="_blank" rel="noopener noreferrer">CDC</a>. 
                          <br/><br/> 
                          Data available at <a href="https://www.cdc.gov/places/" target="_blank" rel="noopener noreferrer">CDC PLACES: Local Data for Better Health</a>`,
                          
  "places-asthma-tracts": `<h3>CDC Asthma Prevelance</h3>
                          PLACES is a health data project from the CDC and its partners. It gives local estimates about health in communities across the United States, including counties, cities, neighborhoods, and ZIP Code areas.
                          <br/><br/>
                          For asthma, PLACES shows estimates of how many adults currently have asthma in each census tract. To make these estimates, it uses information from national health surveys and U.S. Census data.
                          <br/><br/>
                          This helps people compare asthma rates in different communities and better understand where asthma may be a bigger health concern.
                          <br/><br/>
                          Source: <a href="https://www.cdc.gov" target="_blank" rel="noopener noreferrer">CDC</a>.
                          <br/><br/>
                          Data available at <a href="https://www.cdc.gov/places/" target="_blank" rel="noopener noreferrer">CDC PLACES: Local Data for Better Health</a>`,

};
