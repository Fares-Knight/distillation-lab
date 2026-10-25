import test from 'node:test';
import assert from 'node:assert/strict';
import { DURATION, EVENTS, STAGES, stateAt } from '../src/scenario.js';

const near = (actual, expected, tolerance = 1e-12) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≈ ${expected}`);
const intensities = ['heat', 'coolant', 'boiling', 'vapor', 'condensing', 'collecting'];
const fractions = ['transfer', 'flaskFraction', 'receiverFraction'];

test('initial and final states match the teaching scenario', () => {
  assert.equal(DURATION, 90);
  const initial = stateAt(0);
  assert.equal(initial.stageId, 'initial');
  assert.equal(initial.seconds, 0);
  assert.equal(initial.flaskFraction, 0.58);
  assert.equal(initial.receiverFraction, 0);
  for (const key of intensities) assert.equal(initial[key], 0, key);

  const final = stateAt(1);
  assert.equal(final.stageId, 'final');
  assert.equal(final.seconds, DURATION);
  assert.equal(final.transfer, 1);
  near(final.flaskFraction, 0.30);
  near(final.receiverFraction, 0.28);
  for (const key of intensities) assert.equal(final[key], 0, key);
});

test('seeking 80 → 20 → 80 returns exactly the direct state', () => {
  const direct = stateAt(0.8);
  stateAt(0.8);
  stateAt(0.2);
  const returned = stateAt(0.8);
  assert.deepEqual(returned, direct);
  assert.equal(JSON.stringify(returned), JSON.stringify(direct));
  assert.notEqual(returned, direct, 'calls return independent immutable snapshots');
  assert.equal(Object.isFrozen(returned), true);
});

test('input bounds are safe and deterministic', () => {
  for (const value of [-1, -Infinity, NaN, undefined, null, '0.8']) assert.deepEqual(stateAt(value), stateAt(0));
  for (const value of [2, Infinity]) assert.deepEqual(stateAt(value), stateAt(1));
});

test('stage boundaries are exact and immutable', () => {
  for (let i = 0; i < STAGES.length; i += 1) {
    const stage = STAGES[i];
    assert.equal(stateAt(stage.progress).stageId, stage.id);
    assert.equal(stateAt(stage.progress).stageLabel, stage.label);
    if (i > 0) assert.equal(stateAt(stage.progress - 1e-9).stageId, STAGES[i - 1].id);
    assert.ok(Object.isFrozen(stage));
    assert.ok(stage.summary.length > 20);
  }
});

test('1001 forward and reverse samples conserve graphical quantity and stay bounded', () => {
  const states = Array.from({ length: 1001 }, (_, index) => stateAt(index / 1000));
  let previous = states[0];
  for (const state of states) {
    for (const key of [...intensities, ...fractions]) {
      assert.ok(Number.isFinite(state[key]), key);
      assert.ok(state[key] >= 0 && state[key] <= 1, `${key} at ${state.progress}`);
    }
    near(state.flaskFraction + state.receiverFraction, 0.58);
    assert.ok(state.flaskFraction >= 0.2999999999999, 'never distil to dryness');
    assert.ok(state.transfer >= previous.transfer);
    assert.ok(state.receiverFraction >= previous.receiverFraction);
    assert.ok(state.flaskFraction <= previous.flaskFraction);
    assert.ok(state.status.length > 20);
    previous = state;
  }
  for (let index = 1000; index >= 0; index -= 1) {
    assert.deepEqual(stateAt(index / 1000), states[index], `reverse at ${index / 1000}`);
  }
});

test('vapor starts before condensation and condensation before collection', () => {
  assert.ok(EVENTS.vaporStart < EVENTS.condensationStart);
  assert.ok(EVENTS.condensationStart < EVENTS.collectionStart);
  for (let i = 0; i <= 1000; i += 1) {
    const state = stateAt(i / 1000);
    if (state.progress <= EVENTS.vaporStart) assert.equal(state.vapor, 0);
    if (state.progress <= EVENTS.condensationStart) assert.equal(state.condensing, 0);
    if (state.progress <= EVENTS.collectionStart) {
      assert.equal(state.collecting, 0);
      assert.equal(state.transfer, 0);
      assert.equal(state.receiverFraction, 0);
    }
    if (state.condensing > 0) assert.ok(state.coolant > 0, 'cooling is running during condensation');
    if (state.progress >= EVENTS.heatOff) assert.equal(state.heat, 0);
    if (state.progress >= EVENTS.vaporEnd) assert.equal(state.vapor, 0);
    if (state.progress >= EVENTS.condensationEnd) assert.equal(state.condensing, 0);
    if (state.progress >= EVENTS.collectionEnd) {
      assert.equal(state.collecting, 0);
      assert.equal(state.transfer, 1);
    }
  }
});

test('collection activity agrees with the rate of the graphical transfer', () => {
  const totalArea = (EVENTS.collectionFull - EVENTS.collectionStart) / 2
    + EVENTS.collectionFade - EVENTS.collectionFull
    + (EVENTS.collectionEnd - EVENTS.collectionFade) / 2;
  const h = 1e-6;
  for (let i = 1; i < 1000; i += 1) {
    const p = i / 1000;
    const derivative = (stateAt(p + h).transfer - stateAt(p - h).transfer) / (2 * h);
    near(derivative, stateAt(p).collecting / totalArea, 1e-7);
  }
});

test('all event neighborhoods are stable when revisited in either direction', () => {
  for (const boundary of Object.values(EVENTS)) {
    for (const p of [boundary - 1e-8, boundary, boundary + 1e-8]) {
      const expected = stateAt(p);
      stateAt(1);
      stateAt(0);
      assert.deepEqual(stateAt(p), expected);
      near(expected.flaskFraction + expected.receiverFraction, 0.58);
    }
  }
});
