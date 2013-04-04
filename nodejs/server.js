/**
* Establish mysql connection
*/ 
var mysql = require('mysql');
var sTable = 'ajax';
var sIndexColumn = '*';
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'youruser',
  password : 'yourpassword', 
  database : 'yourdatabase',
});

function handleDisconnect(connection) {
  connection.on('error', function(err) {
    if (!err.fatal) {
      return;
    }

    if (err.code !== 'PROTOCOL_CONNECTION_LOST') {
      throw err;
    }

    console.log('mysql lost connection: ' + err.stack);

    connection = mysql.createConnection(connection.config);
    console.log('mysql reconnects');

    handleDisconnect(connection);
    connection.connect();
  });
}

handleDisconnect(connection);

/**
 * Startup express
 */
 console.log('Server initilizing...');

 var express = require('express');
 var app = express();

/**
* http://enable-cors.org/server_expressjs.html
* allow cross-domain requests (CORS)
*/
var allowCrossDomain = function(req, res, next){
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
}

/**
 * Configure express
 */
 app.configure(function() {
  app.use(allowCrossDomain);
  app.use(app.router);
});

 app.listen(8888);
 console.log('Express server started on port 8888');

 var cache_data = {};
 var aColumns = [];

/**
* Get the names for the table columns
* The names are used for the sql-statement
*/
getColumnNamesForTable();
function getColumnNamesForTable()
{
  connection.query('SHOW COLUMNS FROM ' + sTable,
    function selectCb(err, results, fields){
      if(err){
        console.log(err);
      }
      for(var i in results)
      {
        aColumns.push(results[i]['Field']);
      }
    });
}

app.get('/', function(req, res, next){
  console.log('GET request to /');
});

app.get('/datatables', function(request, res, next){
  console.log('GET request to /datatables');
  server(res, request.query);
})

function server(res, request) { 
  /**
   * Paging
   */
   var sLimit = "";
   if(request['iDisplayStart'] && request['iDisplayLength'] != -1) {
    sLimit = 'LIMIT ' +request['iDisplayStart']+ ', ' +request['iDisplayLength']
  }
  
  /**
   * Ordering
   */
   var sOrder = "";
   if(request['iSortCol_0']) {
    sOrder = 'ORDER BY ';

    for(var i = 0 ; i < request['iSortingCols']; i++) {
      if(request['bSortable_'+parseInt(request['iSortCol_'+i])] == "true") {
        sOrder += aColumns[parseInt(request['iSortCol_'+i])] +" "+ request['sSortDir_'+i] +", ";
      }
    }
    
    sOrder = sOrder.substring(0, sOrder.length -2)
    if(sOrder == 'ORDER BY') {
      console.log("sOrder == ORDER BY");
      sOrder = "";
    }
  }

  /**
   * Filtering
   */
   var sWhere = "";
   if(request['sSearch'] && request['sSearch'] != "") {
    sWhere = "WHERE (";
      for(var i=0 ; i<aColumns.length; i++) {
        sWhere += aColumns[i]+ " LIKE " +"\'%"+request['sSearch']+"%\'"+" OR ";
      }

      sWhere = sWhere.substring(0, sWhere.length -4);
      sWhere += ')';
  }

  /**
   * column filtering
   */
   for(var i=0 ; i<aColumns.length; i++) {
    if(request['bSearchable_'+i] && request['bSearchable_'+i] == "true" && request['sSearch_'+i] != '') {
      if(sWhere == "") {
        sWhere = "WHERE ";
      } else {
        sWhere += " AND ";
      }
      sWhere += " "+aColumns[i]+ " LIKE " +"\'%"+request['sSearch_'+i]+"%\'"+" ";
    }
  }
  
  /**
   * Queries
   */
   var sQuery = "SELECT SQL_CALC_FOUND_ROWS " +aColumns.join(',')+ " FROM " +sTable+" "+sWhere+" "+sOrder+" "+sLimit +"";

   var rResult = {};
   var rResultFilterTotal = {};
   var aResultFilterTotal = {};
   var iFilteredTotal = {};
   var iTotal = {};
   var rResultTotal = {};
   var aResultTotal = {};

  //Log the query for debugging
  console.log(sQuery);

  connection.query(sQuery, function selectCb(err, results, fields) {
    if(err) {
      console.log(err);
    }
    
    rResult = results;

    /**
     * Data set length after filtering
     */
     sQuery = "SELECT FOUND_ROWS()";

     connection.query(sQuery, function selectCb(err, results, fields) {
      if(err) {
        console.log(err);
      }
      rResultFilterTotal = results;
      aResultFilterTotal = rResultFilterTotal;
      iFilteredTotal = aResultFilterTotal[0]['FOUND_ROWS()'];

      /**
       * Total data set length
       */
       sQuery = "SELECT COUNT("+sIndexColumn+") FROM " +sTable;

       connection.query(sQuery, function selectCb(err, results, fields){
        if(err){
          console.log(err);
        }
        rResultTotal = results;
        aResultTotal = rResultTotal;
        iTotal = aResultTotal[0]['COUNT(*)'];

        /**
         * Create Output
         */
         var output = {};
         var temp = [];

         output.sEcho = parseInt(request['sEcho']);
         output.iTotalRecords = iTotal;
         output.iTotalDisplayRecords = iFilteredTotal;
         output.aaData = [];

         var aRow = rResult;
         var row = [];

         for(var i in aRow)
         {
          for(Field in aRow[i])
          {
            if(!aRow[i].hasOwnProperty(Field)) continue; 
            temp.push(aRow[i][Field]);
          }
          output.aaData.push(temp);
          temp = [];
        }
        
        /**
         * Send respons as json
         */
         res.json(200, output);
       });
     });
}); 
}
