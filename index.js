// Library to send signal to Q keyboards
const q = require('daskeyboard-applet');
// Library to send request to API
const request = require('request-promise');
// Library to convert to Base64
const btoa = require('btoa');

const logger = q.logger;

const baseUrl1 = 'https://';
const baseUrl2 = '.mydonedone.com/issuetracker/api/v2'

// Get the current time
function getTime() {
  var now =  new Date().getTime()/1000;
  var nowWithoutDot = `${now}`.replace('.','');
  return nowWithoutDot;
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
    // run every 30 sec
    this.pollingInterval = 30 * 1000;
  }

  async applyConfig() {

    logger.info("monday initialisation.")

    this.subdomain = this.config.subdomain;
    this.username = this.config.username;
    
    if(this.subdomain){

      // Create and initialize time variable
      this.now = getTime();

      this.baseUrl = baseUrl1 + this.subdomain + baseUrl2;
      this.params = `${this.config.username}:${this.authorization.apiKey}`;
      this.paramsBase64Encoded = btoa(this.params);
    
      this.serviceHeaders = {
        "Authorization": `Basic ${this.paramsBase64Encoded}`,
      }

      // Get the user ID
      await request.get({
        url: `${this.baseUrl}/people/me.json`,
        headers: this.serviceHeaders,
        json: true
      }).then((body) => {
        this.userId = body.id;
        logger.info("Got monday userID: "+ this.userId);
      })
      .catch(error => {
        logger.error(
          `Got error sending request to service: ${JSON.stringify(error)}`);
      });
    }else{
      logger.info("Subdomain is undefined. Configuration is not done yet");
    }

  }

  // call this function every pollingInterval
  async run() {
    let signal = null;
    let triggered = false;
    let message = [];
    let url;
    let issueState;

    try {
      const body = await request.get({
        url: `${this.baseUrl}/issues/all.json`,
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
        
        // Extract the issues from the response
        for (let issue of body.issues) {

          // If there is an update on a issue AND the user is not the updater.
          if( (issue.last_updated_on.slice(6,18) > this.now) && (issue.last_updater.id != this.userId) ){

            // Check which kind of update is it
            if(issue.last_updated_on == issue.created_on){
              issueState = "created";
              logger.info("Get issue created");
            }else{
              issueState = "updated";
              logger.info("Get issue udpated");
            }

            // Update signal's message
            message.push(`${issue.title} issue has been ${issueState}. Check ${issue.project.name} project.`);

            // Check if a signal is already set up
            // in order to change the url
            if(triggered){
              url = `https://${this.subdomain}.mydonedone.com/issuetracker`
            }else{
              url = `https://${this.subdomain}.mydonedone.com/issuetracker/projects/${issue.project.id}/issues/${issue.order_number}`
            }

            // Need to send a signal
            triggered = true;

          }
        }

        // If we need to send a signal with one or several updates.
        if(triggered){

          // Updated time
          this.now = getTime();

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