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


class monday extends q.DesktopApp {

  constructor() {
    super();
    // run every 20 sec
    this.pollingInterval = 20 * 1000;
  }

  async applyConfig() {
    logger.info("monday.com initialisation.");
    this.now = getUtcTime();
  }

  // call this function every pollingInterval
  async run() {
    let signal = null;
    let triggered = false;
    let urlAlreadyChanged = false;
    let message = [];
    let url;

    try {
      const body = await request.get({
        url: baseUrl + `/v1/boards.json?api_key=${this.authorization.apiKey}`,
        json: true
      });

      logger.info("monday.com running.");

      // Test if there is something inside the response
      var isBodyEmpty = isEmpty(body) || (body === "[]");
      if (isBodyEmpty) {
        logger.info("Response empty when getting all boards.");
      }
      else {
        
        // Extract the boards from the response
        for (let board of body) {

          logger.info("This is a board: "+JSON.stringify(board));

          if(board.updated_at>this.now){
            logger.info("Got update on "+board.name);
            // Update signal's message
            message.push(`<b>${board.name}</b> has been updated.`);
            // Check if a signal is already set up
            // in order to change the url
            if(triggered){
              if(!urlAlreadyChanged){
                // Removed "/board/boardID" to go to the main page
                url = `${board.url}`.substring(0,url.length-16);
                urlAlreadyChanged=true;
              }
            }else{
              url = `${board.url}`;
            }
            // Need to send a signal
            triggered = true;
            }
        }

        // If we need to send a signal.
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
      return q.Signal.error([
        'The monday service returned an error. Please check your API key and account.',
        `Detail: ${error.message}`
      ]);
    }

  }

}

module.exports = {
  monday: monday,
};

const doneDone = new monday();