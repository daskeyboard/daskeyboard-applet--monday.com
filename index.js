// Library to send signal to Q keyboards
const q = require('daskeyboard-applet');
// Library to send request to API
const request = require('request-promise');
// Library to get isoUtcDateTime
var dateFormat = require('dateformat');

const logger = q.logger;

const baseUrl = 'https://api.monday.com:443';

// Get the current time
function getUtcTime() {
  var now = new Date();
  var utcTime = dateFormat(now, "isoUtcDateTime");
  return utcTime;
}

// Test if an object is empty
function isEmpty(obj) {
  for(var key in obj) {
      if(obj.hasOwnProperty(key))
          return false;
  }
  return true;
}

async function processBoardsResponse(response) {
  logger.info(`Processing monday.com boards response.`);
  const options = [];
  for( let board of response){
    options.push({
      key: board.id.toString(),
      value: board.name.toString()
    });
  }
  // Create fake id which is impossible to get from the API
  options.push({
    key: "11111111111111111111",
    value: "Conversations from all projects"
  });
  logger.info(`got ${options.length} options`);
  options.forEach(o => logger.info(`${o.key}: ${o.value}`));
  return options;
}

class monday extends q.DesktopApp {

  constructor() {
    super();
    // run every 20 sec
    this.pollingInterval = 20 * 1000;
  }

  async applyConfig() {
    logger.info("monday.com initialisation.");
    this.now = getUtcTime();
    this.boardId = this.config.boardId;
  }

  /**
  * Loads the list of repose from the monday.com API
  */
  async  loadBoards() {
    logger.info(`Loading boards.`);
    const options = {
      uri: baseUrl + `/v1/boards.json?api_key=${this.authorization.apiKey}`,
      json: true
    }
    return request.get(options);
  }

  /**
  * Called from the Das Keyboard Q software to retrieve the options to display for
  * the user inputs
  * @param {} fieldId 
  * @param {*} search 
  */
  async options(fieldId, search) {
    return this.loadBoards().then(body => {
      return processBoardsResponse(body);
    }).catch(error => {
      logger.error(`Caught error when loading options: ${error}`);
    });
  }

  // call this function every pollingInterval
  async run() {
    let signal = null;
    let message = [];
    let url;
    let triggered = false;

    logger.info("monday.com running.");

    // If configuration is the following of the posts
    if(this.boardId == "11111111111111111111"){
      try {
        const updates = await request.get({
          url: baseUrl + `/v1/updates.json?api_key=${this.authorization.apiKey}`,
          json: true
        });
    
        // Test if there is something inside the response
        var isBodyEmpty = isEmpty(updates) || (updates === "[]");
        if (isBodyEmpty) {
          logger.info("Response empty when getting conversation.");
        }
        else {
          
          // Extract the updates information
          for (let update of updates){
            if(update.updated_at>this.now){

              // Update signal's message
              if(update.updated_at==update.created_at){
                logger.info("Created new conversation");
                message.push(`${update.user.name} created a conversation!`);
              }else{
                logger.info("Got update on a post");
                message.push(`${update.user.name} conversation has been updated.`);
              }
  
              // Updated the url to the board link
              url = `${update.url}`;
              
              // Need to send a signal
              triggered = true;

            }
          }

          if(triggered){
            // Updated time
            this.now = getUtcTime();
            // Create signal
            signal = new q.Signal({
              points: [[new q.Point(this.config.color, this.config.effect)]],
              name: "monday.com",
              message: message.join("<br>"),
              link: {
                url: url,
                label: 'Show in monday.com',
              }
            });
          }

          return signal;
        }
      }
      catch (error) {
        logger.error(`Got error sending request to service: ${JSON.stringify(error)}`);
        if(`${error.message}`.includes("getaddrinfo")){
          return q.Signal.error(
            'The monday.com service returned an error. <b>Please check your internet connection</b>.'
          );
        }else{
          return q.Signal.error([
            'The monday.com service returned an error. <b>Please check your API key and account</b>.',
            `Detail: ${error.message}`
          ]);
        }
      }
    }else{
      try {
        const board = await request.get({
          url: baseUrl + `/v1/boards/${this.boardId}.json?api_key=${this.authorization.apiKey}`,
          json: true
        });
    
        // Test if there is something inside the response
        var isBodyEmpty = isEmpty(board) || (board === "[]");
        if (isBodyEmpty) {
          logger.info("Response empty when getting choosen board.");
        }
        else {
          
          // Extract the board information
  
          if(board.updated_at>this.now){
            logger.info("Got update on "+board.name);
  
            // Update signal's message
            message.push(`<b>${board.name}</b> has been updated.`);
  
            // Updated the url to the board link
            url = `${board.url}`;
            
            // Updated time
            this.now = getUtcTime();
  
            // Create signal
            signal = new q.Signal({
              points: [[new q.Point(this.config.color, this.config.effect)]],
              name: "monday.com",
              message: message.join("<br>"),
              link: {
                url: url,
                label: 'Show in monday.com',
              }
            });
          }
          
          return signal;
        }
      }
      catch (error) {
        logger.error(`Got error sending request to service: ${JSON.stringify(error)}`);
        if(`${error.message}`.includes("getaddrinfo")){
          return q.Signal.error(
            'The monday.com service returned an error. <b>Please check your internet connection</b>.'
          );
        }else{
          return q.Signal.error([
            'The monday.com service returned an error. <b>Please check your API key and account</b>.',
            `Detail: ${error.message}`
          ]);
        }
      }
    }

  }

}

module.exports = {
  monday: monday,
};

const mondayDotCom = new monday();