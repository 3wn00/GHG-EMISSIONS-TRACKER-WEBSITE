// D3.js Visualization Script

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const visualization = document.getElementById('visualization');
    const countrySelect = document.getElementById('countrySelect');
    const yearRange = document.getElementById('yearRange');
    const selectedYear = document.getElementById('selectedYear');
    const lineChartBtn = document.getElementById('lineChartBtn');
    const barChartBtn = document.getElementById('barChartBtn');
    const chartTitle = document.getElementById('chartTitle');
    const insights = document.getElementById('insights');
    const tooltip = document.getElementById('tooltip');
    const tooltipContent = document.getElementById('tooltipContent');
    
    // If not on visualization page, exit
    if (!visualization) return;
    
    // State variables
    let data = [];
    let selectedCountries = ['World', 'China', 'United States'];
    let currentYear = 2018;
    let chartType = 'line';
    
    // SVG dimensions
    const margin = {top: 40, right: 40, bottom: 60, left: 80};
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    // Create SVG
    const svg = d3.select('#visualization')
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Load data
    d3.csv('data/ALL GHG_historical_emissions.csv').then(function(csvData) {
        data = csvData;
        
        // Process data
        const countries = [...new Set(data.map(d => d.Country))];
        
        // Populate country select
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country;
            option.textContent = country;
            if (selectedCountries.includes(country)) {
                option.selected = true;
            }
            countrySelect.appendChild(option);
        });
        
        // Draw initial chart
        updateChart();
        
        // Update insights
        updateInsights();
    });
    
    // Event listeners
    countrySelect.addEventListener('change', function() {
        selectedCountries = Array.from(this.selectedOptions).map(option => option.value);
        updateChart();
        updateInsights();
    });
    
    yearRange.addEventListener('input', function() {
        currentYear = parseInt(this.value);
        selectedYear.textContent = currentYear;
        if (chartType === 'bar') {
            updateChart();
        }
        updateInsights();
    });
    
    lineChartBtn.addEventListener('click', function() {
        chartType = 'line';
        this.classList.add('active');
        barChartBtn.classList.remove('active');
        updateChart();
    });
    
    barChartBtn.addEventListener('click', function() {
        chartType = 'bar';
        this.classList.add('active');
        lineChartBtn.classList.remove('active');
        updateChart();
    });
    
    // Update chart based on current state
    function updateChart() {
        // Clear previous chart
        svg.selectAll('*').remove();
        
        if (chartType === 'line') {
            drawLineChart();
        } else {
            drawBarChart();
        }
    }
    
    // Draw line chart
    function drawLineChart() {
        // Filter data for selected countries
        const filteredData = data.filter(d => selectedCountries.includes(d.Country));
        
        // Get years (columns) from data
        const years = Object.keys(filteredData[0])
            .filter(key => !isNaN(parseInt(key)) && parseInt(key) >= 1990 && parseInt(key) <= 2018)
            .sort((a, b) => parseInt(a) - parseInt(b));
        
        // Set up scales
        const xScale = d3.scaleLinear()
            .domain([parseInt(years[0]), parseInt(years[years.length - 1])])
            .range([0, width]);
        
        const yScale = d3.scaleLinear()
            .domain([0, d3.max(filteredData, d => {
                return d3.max(years, year => parseFloat(d[year]) || 0);
            })])
            .range([height, 0]);
        
        // Create line generator
        const line = d3.line()
            .x(d => xScale(parseInt(d.year)))
            .y(d => yScale(parseFloat(d.value) || 0));
        
        // Draw axes
        svg.append('g')
            .attr('class', 'axis')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale).tickFormat(d3.format('d')));
        
        svg.append('g')
            .attr('class', 'axis')
            .call(d3.axisLeft(yScale));
        
        // Add axis labels
        svg.append('text')
            .attr('class', 'axis-label')
            .attr('text-anchor', 'middle')
            .attr('x', width / 2)
            .attr('y', height + margin.bottom - 10)
            .text('YEAR');
        
        svg.append('text')
            .attr('class', 'axis-label')
            .attr('text-anchor', 'middle')
            .attr('transform', 'rotate(-90)')
            .attr('x', -height / 2)
            .attr('y', -margin.left + 20)
            .text('GHG EMISSIONS (MtCO₂e)');
        
        // Draw lines for each country
        const colorScale = d3.scaleOrdinal()
            .domain(selectedCountries)
            .range(['#FFFFFF', '#CCCCCC', '#999999', '#666666', '#333333']);
        
        filteredData.forEach((countryData, i) => {
            // Restructure data for line
            const countryLineData = years.map(year => ({
                year: year,
                value: parseFloat(countryData[year]) || 0
            }));
            
            // Draw line
            svg.append('path')
                .datum(countryLineData)
                .attr('class', 'line')
                .attr('d', line)
                .attr('stroke', colorScale(countryData.Country))
                .attr('stroke-width', 2)
                .attr('fill', 'none');
            
            // Add data points
            svg.selectAll(`.point-${i}`)
                .data(countryLineData)
                .enter()
                .append('circle')
                .attr('class', `point-${i}`)
                .attr('cx', d => xScale(parseInt(d.year)))
                .attr('cy', d => yScale(d.value))
                .attr('r', 4)
                .attr('fill', colorScale(countryData.Country))
                .attr('stroke', '#000000')
                .attr('stroke-width', 1)
                .on('mouseover', function(event, d) {
                    const countryName = countryData.Country;
                    const yearValue = d.year;
                    const emissionValue = d.value.toFixed(2);
                    
                    tooltipContent.innerHTML = `
                        <strong>${countryName}</strong><br>
                        Year: ${yearValue}<br>
                        Emissions: ${emissionValue} MtCO₂e
                    `;
                    
                    tooltip.style.opacity = 1;
                    tooltip.style.left = (event.pageX + 10) + 'px';
                    tooltip.style.top = (event.pageY - 28) + 'px';
                    
                    d3.select(this)
                        .attr('r', 6)
                        .attr('stroke-width', 2);
                })
                .on('mouseout', function() {
                    tooltip.style.opacity = 0;
                    
                    d3.select(this)
                        .attr('r', 4)
                        .attr('stroke-width', 1);
                });
        });
        
        // Add legend
        const legend = svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${width - 120}, 0)`);
        
        selectedCountries.forEach((country, i) => {
            const legendRow = legend.append('g')
                .attr('transform', `translate(0, ${i * 20})`);
            
            legendRow.append('rect')
                .attr('width', 10)
                .attr('height', 10)
                .attr('fill', colorScale(country));
            
            legendRow.append('text')
                .attr('x', 15)
                .attr('y', 10)
                .attr('text-anchor', 'start')
                .style('font-size', '10px')
                .text(country);
        });
        
        // Update chart title
        chartTitle.textContent = 'GHG EMISSIONS BY COUNTRY (1990-2018)';
    }
    
    // Draw bar chart
    function drawBarChart() {
        // Filter data for selected countries
        const filteredData = data.filter(d => selectedCountries.includes(d.Country));
        
        // Get data for the current year
        const yearData = filteredData.map(d => ({
            country: d.Country,
            value: parseFloat(d[currentYear]) || 0
        }));
        
        // Sort data by value
        yearData.sort((a, b) => b.value - a.value);
        
        // Set up scales
        const xScale = d3.scaleBand()
            .domain(yearData.map(d => d.country))
            .range([0, width])
            .padding(0.2);
        
        const yScale = d3.scaleLinear()
            .domain([0, d3.max(yearData, d => d.value)])
            .range([height, 0]);
        
        // Draw axes
        svg.append('g')
            .attr('class', 'axis')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale))
            .selectAll('text')
            .attr('transform', 'rotate(-45)')
            .attr('text-anchor', 'end')
            .attr('dx', '-.8em')
            .attr('dy', '.15em');
        
        svg.append('g')
            .attr('class', 'axis')
            .call(d3.axisLeft(yScale));
        
        // Add axis labels
        svg.append('text')
            .attr('class', 'axis-label')
            .attr('text-anchor', 'middle')
            .attr('x', width / 2)
            .attr('y', height + margin.bottom - 10)
            .text('COUNTRY');
        
        svg.append('text')
            .attr('class', 'axis-label')
            .attr('text-anchor', 'middle')
            .attr('transform', 'rotate(-90)')
            .attr('x', -height / 2)
            .attr('y', -margin.left + 20)
            .text('GHG EMISSIONS (MtCO₂e)');
        
        // Draw bars
        svg.selectAll('.country-bar')
            .data(yearData)
            .enter()
            .append('rect')
            .attr('class', 'country-bar')
            .attr('x', d => xScale(d.country))
            .attr('y', d => yScale(d.value))
            .attr('width', xScale.bandwidth())
            .attr('height', d => height - yScale(d.value))
            .attr('fill', '#FFFFFF')
            .attr('stroke', '#000000')
            .attr('stroke-width', 1)
            .on('mouseover', function(event, d) {
                tooltipContent.innerHTML = `
                    <strong>${d.country}</strong><br>
                    Year: ${currentYear}<br>
                    Emissions: ${d.value.toFixed(2)} MtCO₂e
                `;
                
                tooltip.style.opacity = 1;
                tooltip.style.left = (event.pageX + 10) + 'px';
                tooltip.style.top = (event.pageY - 28) + 'px';
                
                d3.select(this)
                    .attr('fill', '#CCCCCC');
            })
            .on('mouseout', function() {
                tooltip.style.opacity = 0;
                
                d3.select(this)
                    .attr('fill', '#FFFFFF');
            });
        
        // Add value labels
        svg.selectAll('.value-label')
            .data(yearData)
            .enter()
            .append('text')
            .attr('class', 'value-label')
            .attr('x', d => xScale(d.country) + xScale.bandwidth() / 2)
            .attr('y', d => yScale(d.value) - 5)
            .attr('text-anchor', 'middle')
            .style('font-size', '10px')
            .text(d => d.value.toFixed(0));
        
        // Update chart title
        chartTitle.textContent = `GHG EMISSIONS BY COUNTRY (${currentYear})`;
    }
    
    // Update insights based on current data
    function updateInsights() {
        if (!data.length) return;
        
        // Filter data for selected countries
        const filteredData = data.filter(d => selectedCountries.includes(d.Country));
        
        // Get years (columns) from data
        const years = Object.keys(filteredData[0])
            .filter(key => !isNaN(parseInt(key)) && parseInt(key) >= 1990 && parseInt(key) <= 2018)
            .sort((a, b) => parseInt(a) - parseInt(b));
        
        // Calculate insights
        let insightsHTML = '<ul>';
        
        // Total emissions for current year
        const totalEmissions = filteredData.reduce((sum, d) => sum + (parseFloat(d[currentYear]) || 0), 0);
        insightsHTML += `<li>Total GHG emissions in ${currentYear}: ${totalEmissions.toFixed(2)} MtCO₂e</li>`;
        
        // Highest emitter
        const highestEmitter = filteredData.reduce((max, d) => 
            (parseFloat(d[currentYear]) || 0) > (parseFloat(max[currentYear]) || 0) ? d : max
        , filteredData[0]);
        insightsHTML += `<li>Highest emitter in ${currentYear}: ${highestEmitter.Country} (${parseFloat(highestEmitter[currentYear]).toFixed(2)} MtCO₂e)</li>`;
        
        // Growth rates
        if (years.length > 1) {
            const firstYear = years[0];
            const lastYear = years[years.length - 1];
            
            insightsHTML += '<li>Emission changes from 1990 to 2018:</li><ul>';
            
            filteredData.forEach(d => {
                const startValue = parseFloat(d[firstYear]) || 0;
                const endValue = parseFloat(d[lastYear]) || 0;
                const changePercent = ((endValue - startValue) / startValue * 100).toFixed(2);
                const changeDirection = endValue > startValue ? 'increase' : 'decrease';
                
                insightsHTML += `<li>${d.Country}: ${Math.abs(changePercent)}% ${changeDirection}</li>`;
            });
            
            insightsHTML += '</ul>';
        }
        
        insightsHTML += '</ul>';
        
        // Update insights element
        insights.innerHTML = insightsHTML;
    }
});