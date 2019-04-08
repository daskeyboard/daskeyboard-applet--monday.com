// Library to send signal to Q keyboards
const q = require('daskeyboard-applet');
// Library to send request to API
const request = require('request-promise');

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
    logger.info("monday initialisation.");
    this.now = getUtcTime();
  }

  // call this function every pollingInterval
  async run() {
    let signal = null;
    let triggered = false;
    let message = [];
    let url;

    try {
      const body = await request.get({
        url: `${this.baseUrl}/v1/boards.json`,
        headers: this.serviceHeaders,
        json: true
      });

      logger.info("monday running.");

      // Test if there is something inside the response
      var isBodyEmpty = isEmpty(body) || (body === "[]");
      if (isBodyEmpty) {
        logger.info("Response empty when getting all issues.");
      }
      else {
        
        // Extract the boards from the response
        for (let board of body) {

          logger.info("This is a board: "+board);

          // Update signal's message
          // message.push(`${issue.title} issue has been ${issueState}. Check ${issue.project.name} project.`);

          // Check if a signal is already set up
          // in order to change the url
          // if(triggered){
          //   url = `https://${this.subdomain}.mydonedone.com/issuetracker`
          // }else{
          //   url = `https://${this.subdomain}.mydonedone.com/issuetracker/projects/${issue.project.id}/issues/${issue.order_number}`
          // }

          // Need to send a signal
          // triggered = true;

          
        }

        logger.info("This how the time looks like: "+this.now);

        // If we need to send a signal with one or several updates.
        if(triggered){

          // Updated time
          this.now = getUtcTime();

          // Create signal
          signal = new q.Signal({
            points: [[new q.Point(this.config.color, this.config.effect)]],
            name: "monday",
            message: message.join("<br>"),
            link: {
              url: url,
              label: 'Show in monday',
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