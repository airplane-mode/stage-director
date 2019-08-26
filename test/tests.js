/* global describe:false, it:false */

const assert = require("assert");
const StageDirector = require("../lib/stage-director").default;


const director = new StageDirector("test", {
  update: (state, { value }) => ({
    ...state,
    value
  })
});


describe("Stage Director", () => {
  it("should produce an action when an action creator is called", () => {
    const action = director.actions.update({ value: "initial" }, { value: "updated" });
    assert.ok(action);
  });
});
