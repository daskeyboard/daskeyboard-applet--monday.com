const assert = require('assert');
const t = require('../index');

// describe('getBoards', function () {
//   it('can get boards', function () {
//     return t.getBoards(apiKey).then((boards) => {
//       assert.ok(boards);
//       assert.ok(boards[0]);
//       assert.ok(boards[0].id);
//     }).catch((error) => {
//       assert.fail(error);
//     })
//   })
// });

// describe('getActionsForBoard', function () {
//   it('can get actions for board', function () {
//     return t.getActionsForBoard('5be9f7545b05e45e0092f4dd',
//       apiKey).then(actions => {
//       assert.ok(actions);
//       assert.ok(actions[0]);
//       assert.ok(actions[0].id);
//     }).catch(error => {
//       assert.fail(error);
//     })
//   })
// });

describe('Monday', () => {
  async function makeApp() {
    let app = new t.Monday();

    await app.processConfig({
      extensionId: 777,
      geometry: {
        width: 1,
        height: 1,
      },
      authorization: {
        apiKey: "<Your API key>"
      },
      config: {
        color:"#ff0000",
        effect: "BLINK",
        firstName: "joe",
        option: "nut"
      }
    });

    return app;
  }

  // describe('#getNewActions', () => {
  //   it("gets new actions with old timestamp", async function () {
  //     return makeApp().then(async app => {
  //       app.timestamp = new Date('2018-01-17T03:24:00').toISOString();
  //       return app.getNewActions().then(actions => {
  //         assert.ok(actions);
  //         assert.ok(actions[0]);
  //         assert.ok(actions[0].id);
  //       }).catch(error => {
  //         assert.fail(error);
  //       })
  //     })
  //   });

  //   it("doesn't return new actions with current timestamp", async function () {
  //     return makeApp().then(async app => {
  //       return app.getNewActions().then(actions => {
  //         assert.ok(actions);
  //         assert(actions.length === 0);
  //       }).catch(error => {
  //         assert.fail(error);
  //       })
  //     })
  //   });
  // });

  // describe('#generateSignal()', () => {
  //   it('generates a signal', async function () {
  //     return makeApp().then(async app => {
  //       const actions = require('./test-actions.json');
  //       const signal = app.generateSignal(actions);
  //       console.log(signal);
  //       assert.ok(signal);
  //       assert(signal.message.includes(`You have ${actions.length}`));
  //       assert(signal.link.url.includes('https://trello.com'));
  //       assert(signal.link.label.includes('Check'));
  //     }).catch((error) => {
  //       assert.fail(error)
  //     });
  //   })
  // })

  describe('#run()', () => {
    it('runs', async function () {
      return makeApp().then(async app => {
        return app.run().then((signal) => {
          assert.ok(signal);
        }).catch((error) => {
          assert.fail(error)
        });
      })
    })
  })
})