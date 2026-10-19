# Park art prompts

Custom art replaces each park's placeholder icon. Generate one square image per park with any AI image model,
using the shared style prompt plus that park's subject line.

## Shared style prompt

> Flat vintage WPA national-park screen-print illustration. Limited palette of 5–6 colors drawn from: cream #F6EEDC, ink #1E2A2F, deep teal #0F4C5C, sunset orange #F26B38, canyon red #C8402E, pine green #1F5A3D, sky blue #7FC8D9, gold #F2B33D, blush #F29C8F, dusk violet #6B4E8C. Bold simplified shapes, subtle paper grain, no text, no border, no people in the foreground. Single centered subject composed to read inside a circular crop. Square 1:1.

## Usage

1. Prompt: shared style prompt + "Subject: <subject line>".
2. `npm run art:add -- <id> <file>` → writes `src/assets/art/<id>.webp` (512×512 center crop).
3. `npm test`, commit, push. Parks without art keep their landscape icon.

## Subjects

| id | Park | Subject line |
| --- | --- | --- |
| acadia | Acadia | Bass Harbor Head Lighthouse on pink granite above crashing Atlantic waves |
| american-samoa | American Samoa | Pola Island's sea stack rising from turquoise water beneath green volcanic ridges |
| arches | Arches | Delicate Arch glowing orange at sunset with the La Sal Mountains behind |
| badlands | Badlands | Striped buttes at golden hour with a lone bison on the prairie |
| big-bend | Big Bend | Santa Elena Canyon's sheer walls above the Rio Grande |
| biscayne | Biscayne | Boca Chita Key lighthouse beside a coral reef full of fish |
| black-canyon-of-the-gunnison | Black Canyon of the Gunnison | The Painted Wall's pale-striped cliff plunging to the Gunnison River |
| bryce-canyon | Bryce Canyon | Thor's Hammer hoodoo against an amphitheater of orange spires |
| canyonlands | Canyonlands | Mesa Arch framing a sunrise over deep canyons |
| capitol-reef | Capitol Reef | Hickman Bridge arch with the Waterpocket Fold's domes behind |
| carlsbad-caverns | Carlsbad Caverns | Stalactites in the Big Room with a spiral of bats rising from the entrance |
| channel-islands | Channel Islands | Arch Rock off Anacapa Island with an island fox on the cliff |
| congaree | Congaree | Bald cypress knees along a boardwalk in a misty floodplain forest |
| crater-lake | Crater Lake | Wizard Island in the deep blue caldera lake ringed by cliffs |
| cuyahoga-valley | Cuyahoga Valley | Brandywine Falls tumbling over layered sandstone in autumn |
| death-valley | Death Valley | Mesquite Flat sand dunes with ridged shadows below dark mountains |
| denali | Denali | Denali's snowy massif reflected in Wonder Lake with a moose |
| dry-tortugas | Dry Tortugas | Hexagonal Fort Jefferson on a ring of turquoise water |
| everglades | Everglades | A great egret in sawgrass under a huge sunset sky |
| gates-of-the-arctic | Gates of the Arctic | The Arrigetch Peaks' granite spires above a braided river |
| gateway-arch | Gateway Arch | The stainless-steel Gateway Arch curving over the Mississippi |
| glacier | Glacier | Going-to-the-Sun Road and a mountain goat beneath jagged peaks |
| glacier-bay | Glacier Bay | Margerie Glacier's ice face calving with a humpback whale breaching |
| grand-canyon | Grand Canyon | Layered canyon walls at sunset seen from the South Rim |
| grand-teton | Grand Teton | The Moulton Barn on Mormon Row below the jagged Tetons |
| great-basin | Great Basin | An ancient twisted bristlecone pine below Wheeler Peak |
| great-sand-dunes | Great Sand Dunes | Golden dunes in front of the snowy Sangre de Cristo range |
| great-smoky-mountains | Great Smoky Mountains | Layered blue ridges fading into mist at sunrise |
| guadalupe-mountains | Guadalupe Mountains | El Capitan's sheer limestone cliff rising from the desert |
| haleakala | Haleakalā | Sunrise above the clouds over Haleakalā's red cinder crater with a silversword |
| hawaii-volcanoes | Hawaiʻi Volcanoes | A glowing lava lake in Kīlauea's crater at night |
| hot-springs | Hot Springs | Bathhouse Row's Spanish-style facades with steam rising from a spring |
| indiana-dunes | Indiana Dunes | A tall sand dune meeting the blue waves of Lake Michigan |
| isle-royale | Isle Royale | A moose wading near a rocky Lake Superior shoreline with a wolf on the ridge |
| joshua-tree | Joshua Tree | A Joshua tree beside giant stacked granite boulders at dusk |
| katmai | Katmai | A brown bear catching a leaping salmon at Brooks Falls |
| kenai-fjords | Kenai Fjords | Aialik Glacier meeting a fjord with puffins in the foreground |
| kings-canyon | Kings Canyon | The General Grant tree towering over a forest path |
| kobuk-valley | Kobuk Valley | Golden Arctic sand dunes with migrating caribou crossing |
| lake-clark | Lake Clark | Turquoise Lake Clark below snowy volcanic peaks with a floatplane |
| lassen-volcanic | Lassen Volcanic | Lassen Peak reflected in Manzanita Lake |
| mammoth-cave | Mammoth Cave | Lantern light in a vast limestone passage with Frozen Niagara flowstone |
| mesa-verde | Mesa Verde | Cliff Palace's stone towers tucked under a sandstone alcove |
| mount-rainier | Mount Rainier | Mount Rainier's glaciers above a meadow of wildflowers at Paradise |
| new-river-gorge | New River Gorge | The New River Gorge Bridge arching over autumn forest and whitewater |
| north-cascades | North Cascades | Turquoise Diablo Lake surrounded by jagged glaciated peaks |
| olympic | Olympic | Moss-draped trees in the Hoh Rain Forest beside a sea stack |
| petrified-forest | Petrified Forest | Rainbow-banded petrified logs before the Painted Desert's badlands |
| pinnacles | Pinnacles | Volcanic rock spires with a California condor soaring overhead |
| redwood | Redwood | Towering coast redwoods with light shafts through fog |
| rocky-mountain | Rocky Mountain | Dream Lake reflecting Hallett Peak with an elk on the shore |
| saguaro | Saguaro | A giant saguaro cactus silhouetted against a desert sunset |
| sequoia | Sequoia | The General Sherman Tree's massive trunk with Moro Rock beyond |
| shenandoah | Shenandoah | Skyline Drive curving along the Blue Ridge in fall color |
| theodore-roosevelt | Theodore Roosevelt | Bison grazing among colorful badlands along the Little Missouri River |
| virgin-islands | Virgin Islands | Trunk Bay's white-sand beach and turquoise water framed by palms |
| voyageurs | Voyageurs | A canoe on a calm lake under green northern lights |
| white-sands | White Sands | Rippled white gypsum dunes at sunset with the San Andres Mountains |
| wind-cave | Wind Cave | Honeycomb boxwork on a cave ceiling above a bison on the prairie |
| wrangell-st-elias | Wrangell–St. Elias | Mount St. Elias above a vast glacier and the red Kennecott mill |
| yellowstone | Yellowstone | Grand Prismatic Spring's rainbow rings with Old Faithful erupting |
| yosemite | Yosemite | Half Dome and El Capitan above Yosemite Valley with Bridalveil Fall |
| zion | Zion | Angels Landing at sunset above the Virgin River |
