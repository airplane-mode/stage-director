/* global describe:false, it:false */

const assert = require("assert");
const StageDirector = require("../lib/stage-director").default;


const DIRECTOR_NAME = "test";

const director = new StageDirector(DIRECTOR_NAME, {
  update: (state, { value }) => ({
    ...state,
    value
  })
});


describe("Stage Director", () => {
  it("should produce well-formed synchronous actions", () => {
    const UPDATE_VALUE = "updated";

    const action = director.actions.update({ value: UPDATE_VALUE });
    assert.ok(action);
    assert.equal(action.value, UPDATE_VALUE);
    assert.equal(action.type, `${DIRECTOR_NAME}:update`);
  });
});
