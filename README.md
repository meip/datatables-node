## DataTables.net and Node.js with Bootstrap

This example is an example data provider implementation for datatables.net server-side processing.
It works like the [existing php data provider](http://www.datatables.net/examples/data_sources/server_side.html)
It uses the following components:
  * [datatables.net](http://datatables.net/)
  * [Bootstrap](http://twitter.github.com/bootstrap/)
  * [Node.js](http://nodejs.org/)
  ** [Node-mysql](https://github.com/felixge/node-mysql)
  ** [Express](http://expressjs.com/)

## Setup
  * Clone the repo and setup the environment
    $ git clone git://github.com/meip/datatables-node.git
  * This examples used [bootstrap as a git-submodule](http://martinbrochhaus.com/2013/01/bootstrap.html)
    $ cd cd static/css/libs/bootstrap/
    $ ln -s ../../../../bootstrap/less/* .

## Quick Start
  * Install dependencies for node
    $ cd nodejs
    $ npm install

  * Install [datatables.net MySQL sample database](https://github.com/DataTables/DataTables/blob/master/examples/examples_support/data.sql)
  * Configure the database connection in server.js
  * Run the server 
    $ node server.js
  * Open server_node.html in your browser (may use Google Chrome to prevent cross-domain problems)

