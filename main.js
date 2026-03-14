
mapboxgl.accessToken = 'pk.eyJ1IjoiYWVsa3VuY2h3YXIiLCJhIjoiY21oZWM5ZnBnMGRxNzJscHV5bmp4eXBidSJ9.lx_hyQVKP_Tj5MqbTnqwIw'; /* Replace with your token */

if (!mapboxgl.accessToken || mapboxgl.accessToken.includes('YOUR_MAPBOX_TOKEN')) {
    throw new Error('Missing Mapbox access token. Set mapboxgl.accessToken in js/main.js.');
}


const isMap1 = window.location.pathname.includes('map1');


if (isMap1) {

    const grades = [1, 10, 20, 40, 60, 80];
    const colors = [
        '#ffffb2',
        '#fecc5c',
        '#fd8d3c',
        '#f03b20',
        '#bd0026',
        '#7a0000'
    ];

    let map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/light-v10',
        center: [-96, 40],
        zoom: 4,
        projection: 'albers'
    });

    map.on('load', () => {


        map.addSource('covid-rates', {
            type: 'geojson',

            data: 'assets/us-covid-2020-rates/us-covid-2020-rates.json',
            generateId: true
        });


        map.addLayer({
            id: 'covid-rates-fill',
            type: 'fill',
            source: 'covid-rates',
            paint: {
                'fill-color': [
                    'step',
                    ['get', 'rates'],
                    colors[0],
                    grades[1], colors[1],
                    grades[2], colors[2],
                    grades[3], colors[3],
                    grades[4], colors[4],
                    grades[5], colors[5]
                ],
                'fill-opacity': 0.75
            }
        });

        map.addLayer({
            id: 'covid-rates-outline',
            type: 'line',
            source: 'covid-rates',
            paint: {
                'line-color': '#fff',
                'line-width': 0.4,
                'line-opacity': 0.5
            }
        });


        map.addLayer({
            id: 'covid-rates-highlight',
            type: 'fill',
            source: 'covid-rates',
            paint: {
                'fill-color': '#000',
                'fill-opacity': [
                    'case',
                    ['boolean', ['feature-state', 'hover'], false],
                    0.15,
                    0
                ]
            }
        });

        let hoveredId = null;

        map.on('mousemove', 'covid-rates-fill', (e) => {
            map.getCanvas().style.cursor = 'pointer';
            if (e.features.length > 0) {
                if (hoveredId !== null) {
                    map.setFeatureState(
                        { source: 'covid-rates', id: hoveredId },
                        { hover: false }
                    );
                }
                hoveredId = e.features[0].id;
                map.setFeatureState(
                    { source: 'covid-rates', id: hoveredId },
                    { hover: true }
                );
            }
        });

        map.on('mouseleave', 'covid-rates-fill', () => {
            map.getCanvas().style.cursor = '';
            if (hoveredId !== null) {
                map.setFeatureState(
                    { source: 'covid-rates', id: hoveredId },
                    { hover: false }
                );
            }
            hoveredId = null;
        });

        map.on('click', 'covid-rates-fill', (e) => {
            const props = e.features[0].properties;
            new mapboxgl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(
                    `<strong>${props.county}, ${props.state}</strong><br>
                     Rate: <strong>${Number(props.rates).toFixed(1)}</strong> per 1,000 residents`
                )
                .addTo(map);
        });

    });

    const legend = document.getElementById('legend');
    const rows = [];

    for (let i = 0; i < grades.length; i++) {
        const label = i < grades.length - 1
            ? `${grades[i]}–${grades[i + 1]}`
            : `${grades[i]}+`;
        rows.push(
            `<div class="legend-row">
                <span class="legend-swatch" style="background:${colors[i]};"></span>
                <span>${label}</span>
            </div>`
        );
    }
    rows.push(
        `<div class="legend-source">Source: <a href="https://github.com/nytimes/covid-19-data" target="_blank">NYT</a></div>`
    );

    legend.innerHTML += rows.join('');


} else {

    const grades = [1000, 10000, 100000];
    const colors = ['rgb(208,209,230)', 'rgb(103,169,207)', 'rgb(1,108,89)'];
    const radii  = [3, 10, 22];

    let map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/dark-v10',
        center: [-96, 40],
        zoom: 4,
        projection: 'albers'
    });

    map.on('load', () => {

        map.addSource('covid-counts', {
            type: 'geojson',

            data: 'assets/us-covid-2020-counts/us-covid-2020-counts.json'
        });

        map.addLayer({
            id: 'covid-counts-point',
            type: 'circle',
            source: 'covid-counts',
            paint: {

                'circle-radius': [
                    'interpolate',
                    ['linear'],
                    ['sqrt', ['to-number', ['get', 'cases']]],
                    Math.sqrt(grades[0]), radii[0],
                    Math.sqrt(grades[1]), radii[1],
                    Math.sqrt(grades[2]), radii[2]
                ],
                'circle-color': [
                    'interpolate',
                    ['linear'],
                    ['to-number', ['get', 'cases']],
                    grades[0], colors[0],
                    grades[1], colors[1],
                    grades[2], colors[2]
                ],
                'circle-stroke-color': 'white',
                'circle-stroke-width': 0.8,
                'circle-opacity': 0.7
            }
        });

        map.on('click', 'covid-counts-point', (e) => {
            if (!e.features || e.features.length === 0) return;
            const props = e.features[0].properties;
            new mapboxgl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(
                    `<strong>${props.county}, ${props.state}</strong><br>
                     Cases: <strong>${Number(props.cases).toLocaleString()}</strong>`
                )
                .addTo(map);
        });

        map.on('mouseenter', 'covid-counts-point', () => {
            map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'covid-counts-point', () => {
            map.getCanvas().style.cursor = '';
        });

    });

    const legend = document.getElementById('legend');
    const rows = [];

    for (let i = 0; i < grades.length; i++) {
        const dot_radius = 2 * radii[i];
        const label = i < grades.length - 1
            ? `${grades[i].toLocaleString()}–${grades[i + 1].toLocaleString()}`
            : `${grades[i].toLocaleString()}+`;
        rows.push(
            `<div class="legend-circle-row">
                <span class="legend-circle" style="
                    width:${dot_radius}px;
                    height:${dot_radius}px;
                    background:${colors[i]};
                "></span>
                <span>${label}</span>
            </div>`
        );
    }
    rows.push(
        `<div class="legend-source">Source: <a href="https://github.com/nytimes/covid-19-data" target="_blank">NYT</a></div>`
    );

    legend.innerHTML += rows.join('');
}
