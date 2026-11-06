import assert from 'node:assert/strict';
import { explicitHeight, isBuildingWay, readCityModel } from '../src/lib/city-model.ts';

assert.equal(explicitHeight({ building: 'office' }).height, null);
assert.equal(explicitHeight({ 'building:levels': 30 }).height, null, 'levels must not become invented metres');
assert.equal(explicitHeight({ height: '18 m' }).height, 18);
assert.equal(explicitHeight({ height: "100 ft" }).height, 30.48);
assert.equal(explicitHeight({ height: "7'4\"" }).height, 2.2352);
for (const height of ['20;30', '12 bananas', '-20', 'Infinity', '6000', '3 - 5']) {
  assert.equal(explicitHeight({ height }).height, null, height);
}
const geometry = [{ lat: 13, lon: 100 }, { lat: 13.001, lon: 100 }, { lat: 13, lon: 100.001 }, { lat: 13, lon: 100 }];
assert.equal(isBuildingWay({ type: 'way', tags: { highway: 'primary' }, geometry }), false, 'a road must not become a building');
assert.equal(isBuildingWay({ type: 'way', tags: { building: 'yes' }, geometry: geometry.slice(0, 3) }), false, 'open ways are not footprints');
assert.equal(isBuildingWay({ type: 'way', tags: { building: 'yes' }, geometry }), true);
const model = {
  slug: 'bangkok', origin: [13, 100], radius: 1500,
  camera: { from: { eye: [0, 0, 300], look: [10, 10, 0] }, to: { eye: [0, 0, 2], look: [10, 10, 2] } },
  buildings: [{ r: [[0, 0], [10, 0], [10, 10]], h: 18, l: 0.5, s: 1 }], roads: [],
};
assert.equal(readCityModel(model, 'bangkok').buildings[0].h, 0, 'legacy heights without evidence stay flat');
const tagged = structuredClone(model);
Object.assign(tagged.buildings[0], { osm_id: 123, height_source: { tag: 'height', value: '18 m' } });
assert.equal(readCityModel(tagged, 'bangkok').buildings[0].h, 18);
tagged.buildings[0].h = 90;
assert.equal(readCityModel(tagged, 'bangkok').buildings[0].h, 0, 'source and displayed height must agree');
assert.equal(readCityModel({ ...model, buildings: [null] }, 'bangkok'), null);
assert.equal(readCityModel({ ...model, roads: [{ r: [[0, 0], [NaN, 1]], w: 8 }] }, 'bangkok'), null);
assert.equal(readCityModel(model, 'tokyo'), null, 'a late model cannot masquerade as a different city');
console.log('✓ city boundary: explicit heights, closed building ways, legacy flattening, safe geometry');
