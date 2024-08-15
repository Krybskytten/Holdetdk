function updateRiderDataFromAPI() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("data"); // navn på dit spreadsheet.
  var statsUrl = "https://api.holdet.dk/games/705/rounds/1/statistics?appid=holdet&culture=da-DK";
  var namesUrl = "https://api.holdet.dk/tournaments/474?appid=holdet&culture=da-DK"; // API med spiller ID'er og navne
  
  var options = {
    "method": "get",
    "muteHttpExceptions": true
  };
  
  try {
    // Hent statistik data
    var response = UrlFetchApp.fetch(statsUrl, options);
    var statsData = JSON.parse(response.getContentText());
    
    // Hent navnedata
    var namesResponse = UrlFetchApp.fetch(namesUrl, options);
    var namesData = JSON.parse(namesResponse.getContentText());

    // Opret en lookup-tabel af player ID'er til person ID'er
    var playerToPersonId = {};
    var playerToName = {};
    
    // Udfyld playerToPersonId lookup fra namesData
    var players = namesData.players || [];
    for (var i = 0; i < players.length; i++) {
      var player = players[i];
      playerToPersonId[player.id] = player.person.id; // map player ID to person ID
    }
    
    // Udfyld playerToName lookup fra namesData
    var persons = namesData.persons || [];
    for (var j = 0; j < persons.length; j++) {
      var person = persons[j];
      playerToName[person.id] = person.firstname + " " + person.lastname; // map person ID to name
    }

    // Logger nøglerne i JSON-objektet
    Logger.log("Antal spillere fundet i statsData: " + statsData.length);
    Logger.log("Antal personer fundet i namesData: " + persons.length);

    // Tjek for og slet tidligere data fra scriptet
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      // Antag at data, der skal ryddes, starter på række 2
      sheet.getRange(2, 1, lastRow - 1, 4).clearContent();
    }
    
    // Indsæt kolonneoverskrifter
    sheet.getRange(1, 1).setValue("Rytternavn");
    sheet.getRange(1, 2).setValue("Værdi");
    sheet.getRange(1, 3).setValue("Popularitet");
    sheet.getRange(1, 4).setValue("Vækst");

    // Gennemgå statistik data
    var row = 2;
    for (var i = 0; i < statsData.length; i++) {
      var item = statsData[i];
      
      if (item.player && item.values) {
        var playerId = item.player.id || "Ikke tilgængelig";
        var personId = playerToPersonId[playerId] || "Ikke tilgængelig";
        var riderName = playerToName[personId] || "Navn ikke tilgængelig";
        var value = item.values.value || "Ikke tilgængelig";
        var popularity = item.values.popularity || "Ikke tilgængelig";
        var growth = item.values.growth || "Ikke tilgængelig";
        
        // Skriv data til arket
        sheet.getRange(row, 1).setValue(riderName);
        sheet.getRange(row, 2).setValue(value);
        sheet.getRange(row, 3).setValue(popularity);
        sheet.getRange(row, 4).setValue(growth);
        row++;
      } else {
        Logger.log("Data objektet mangler 'player' eller 'values' for indeks: " + i);
      }
    }
    
  } catch (e) {
    Logger.log("Fejl ved hentning af data: " + e.toString());
  }
}
