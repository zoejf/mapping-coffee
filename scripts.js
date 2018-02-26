$(function() {
  let mymap;
  $.ajax({
    type: 'GET', 
    url: 'https://gist.githubusercontent.com/lbud/35e4847d13e5524d08d3e547318cf689/raw/d44940c13e70b2bb683345c511f85d249ee5ccfc/starbucks.csv', 
    async: false,
    datatype: 'jsonp', 
    crossdomain: true
  })
  .done(function (res) {
    const coffeeData = parseResponse(res);
    initializeMap(coffeeData.averageLatitude, coffeeData.averageLongitude);
    placeMarkersOnMap(coffeeData.resultsArray);

    //For now, show test results in console
    runTests();
  })
  .fail(function (err) {
    throw new Error('Something went wrong getting the data: ', err);
  });

  function parseResponse (data) {
    const lines = data.split('\n');
    const headings = lines[0].split(',');
    lines.shift();

    let resultsArray = [];
    let totalLat = 0;
    let totalLong = 0;
    lines.forEach(function (line) {
      let values;
      let locationObject = {};
      if (line.match(/"*"/g)) {
        values = parseLineWithQuotedSection(line);
      } else {
        values = line.split(',');
      }
      if (values.length === headings.length) {
        values.forEach(function (val, index) {
          locationObject[headings[index]] = val;
        });
        resultsArray.push(locationObject);
        totalLat += parseFloat(locationObject['Latitude']);
        totalLong += parseFloat(locationObject['Longitude']);
      }
    });

    return {
      resultsArray: resultsArray,
      averageLatitude: totalLat / resultsArray.length || null,
      averageLongitude: totalLong / resultsArray.length || null
    };
  }

  function parseLineWithQuotedSection (string) {
    const DELIMITER = ',';
    const EXCEPTION = '"';
    let valuesArray = [];
    let valueString = '';
    let insideQuotes = false;
    for(let i = 0; i < string.length; i++) {
      const char = string.charAt(i);
      if (char === EXCEPTION) {
        insideQuotes = !insideQuotes;
      }
      if (char !== EXCEPTION && (char !== DELIMITER || char === DELIMITER && insideQuotes)) {
        valueString += char;
      }
      // if you get to a comma, not inside quotes, or end of line
      // add string to array and reset string to collect next value
      if ((char === DELIMITER && !insideQuotes) || i === string.length - 1) {
        valuesArray.push(valueString);
        valueString = '';
      }
    }
    return valuesArray;
  }

  function placeMarkersOnMap (locationList) {
    locationList.forEach(function (location) {
      const lat = parseFloat(location['Latitude']);
      const long = parseFloat(location['Longitude']);
      const marker = L.marker([lat,long]).addTo(mymap);
      marker.bindPopup("<b>" + location['Name']+ "</b><br>" + location['Street Combined']);
    });
  }

  function initializeMap (latitude, longitude) {
    const accessToken = 'pk.eyJ1Ijoiem9lamYiLCJhIjoiYzZkYzk3YTg0NjlhMWMzN2YxMzE3MjRlYjdhYTY2NTcifQ.4o17DQScL_qZlKTOYSXrXQ';
    mymap = L.map('mapid').setView([latitude,longitude], 12.5);
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=' + accessToken, {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox.streets',
        accessToken: accessToken
    }).addTo(mymap);
  }

  function runTests () {
    console.log('TEST 1: parseResponse with complete CSV');
    const testCompleteCSV = 'Country,Store ID,Name,Ownership Type,Latitude,Longitude\n' +
      'US,8919,14th & Sixth,Starbucks,123,-456\n' +
      'US,8920,"57th & Seventh",Starbucks,234,-457\n' +
      'US,8923,90th & First,Starbucks,129,-451\n' +
      'US,,90th & First,Starbucks,221,-453\n';
    const test1result = parseResponse(testCompleteCSV);
    console.log('result: ', test1result);
    if (test1result.resultsArray.length == 4 &&
      test1result.averageLatitude === 176.75 && test1result.averageLongitude === -454.25) {
      console.log('PASSED');
    } else {
      console.log('FAILED');
    }
    console.log('TEST 2: parseResponse with incomplete CSV');
    const testIncompleteCSV = 'Country,Store ID,Name,Ownership Type,Latitude,Longitude\n' +
      'US,8920,57th & Seventh\n';
    const test2result = parseResponse(testIncompleteCSV);
    console.log('result: ', test2result);
    if (test2result.resultsArray.length == 0 &&
      !test2result.averageLatitude && !test2result.averageLongitude) {
      console.log('PASSED');
    } else {
      console.log('FAILED');
    }

    console.log('TEST 3: parseLineWithQuotedSection');
    const testLineWithQuotes = 'US,8920,"57th, and Seventh",Starbucks,234,-457'
    const test3result = parseLineWithQuotedSection(testLineWithQuotes);
    console.log('result: ', test3result);
    if (test3result.length == 6 &&
      test3result[2] === '57th, and Seventh' && test3result[5] === '-457') {
      console.log('PASSED');
    } else {
      console.log('FAILED');
    }
  }
})
