# The night city

The page stands in a real city, at night, and the scroll is the camera.

This is the technique of [Location Scout](https://tools.oyasumi-gamedev.com/rokehan/)
(どこでもロケハン): a place is turned into a 3D model from OpenStreetMap's own
building footprints and its own streets, and then looked at from a distance, at
street level, or anywhere between. We did not copy its pictures. We took its
method and pointed it at Bangkok.

## What it is made of

Every wall on screen is an OpenStreetMap building footprint in the city's own
coordinates. Every street is an OpenStreetMap way. There is no art in it: the
outline of that block is the outline of that block, and the camera's last
frame stands on a real pavement looking down a real road, because the model
knows where the roads are.

The city is drawn in greyscale with white lights — one dot per lit window,
decided by a hash of the building, so the same windows are lit on every
visit. The greyscale is the point: the site's own colours (coral, yellow,
teal) are the only colour on the page and they carry against it.

## The camera

| progress | the camera |
|---|---|
| top of the page | above the city, tilted down at the skyline, the sky still in the frame |
| middle | directly above the street it will land on, looking straight down |
| foot of the page | on the pavement, looking along the road |

Three keys, interpolated: it descends from above the buildings and lands. It
never flies through one.

## The files

- `scripts/build_city_model.mjs` — fetches the model from Overpass and bakes
  it. `npm run data:city` rebuilds every city; `npm run data:city -- bangkok`
  rebuilds one.
- `public/data/city/<slug>.json` — the baked model: footprints, heights, the
  streets, and the camera's three keys.
- `src/components/CityLayer.tsx` — the renderer. A canvas, a camera, and a
  scroll.
- `src/components/CityToggle.tsx` — the city control in the masthead, and the
  choice that is remembered.

## Building a model

```sh
npm run data:city -- bangkok
```

Overpass needs an identifying User-Agent: a browser-shaped one is refused
with 406, which is Overpass refusing to be scraped by a page rather than
refusing to answer. The script sends its own.

Heights come from the tags where they exist (`height`, then `building:levels`
at 3.2m a floor) and from the building's type where they do not. Rings are
simplified to about a metre and dropped if they are slivers.

The data is © OpenStreetMap contributors, licensed ODbL, and the site says so
in the footer.

## What it costs

One canvas, fixed behind the work, at about 24ms a frame at 1440px. It takes
no clicks. A reader who asked for less motion gets one still frame and no
movement.

The model is fetched after the page is up, never before it, and it is a
separate file per city so the reader pays for the city they are standing in.

## The one thing to know

The city is a backdrop. The work sits above it in the site's own surfaces, and
the reading surfaces stay paper white, because a ledger read over a busy
night city is a ledger nobody reads.
