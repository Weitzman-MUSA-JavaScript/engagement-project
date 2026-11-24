# Wireframes. Used Claude.ai to get the dashes formatting of these frames to save time. Ideas and writing are from my own references to similar existing applications. 

Layout follows the Bluebikes station suggestion map: map on the left, one right panel that changes state.

## 1. Landing: instructions panel

```
+------------------------------------------------------------------------------------+
| (o) SpotScout   Suggest upgrades at SEPTA bus stops              About this map |
+-----------------------------------------------------+------------------------------+
| [ Search an address or place        ]               | ████ BLUE HEADER ████████████ |
| [+]                                                 | Where should the next bus    |
| [-]          blue + white basemap                   | shelter go?                  |
| [◎]                                                 |▬▬▬▬▬▬▬▬ red rule ▬▬▬▬▬▬▬▬▬▬▬▬|
|        ·   ·  ·     · ·                             | A lot of SEPTA stops are just|
|     ·    ·    ·  ·        ·  ← black dots           | a sign on a pole...          |
|   ·   ·      ·      ( )  ← cursor = red ring,       |                              |
|      ·   ·   ·  ·          3px, no fill             | 1. Find your stop            |
|    ·    ●●  ·   ·                                   | 2. Click it                  |
|          ↑ red halos = rider suggestions            | 3. Answer a few questions    |
|                                                     |                              |
|                                                     | Stop ID (on the sign) [___][Go]
|                                                     | Jump: (Center City)(N Philly)|
|                                                     |       (West Chester Pike)    |
|                                                     |                              |
|                                                     | Map legend                   |
|                                                     |  (bus) SEPTA bus stop        |
|                                                     |  ( O ) Your selection        |
|                                                     |  ( ● ) Rider suggestions     |
|                                                     | 42 suggestions at 30 stops   |
|                                                     | ▸ Data & credits             |
+-----------------------------------------------------+------------------------------+
```

## 2. Stop clicked: form panel

Zoom 14+ shows the SEPTA bus icons. Clicking one centers the map and locks the red ring on it.
The panel header copies the stop sign: black, stop name, Stop ID, red route pills.

```
+-----------------------------------------------------+------------------------------+
|                                                     | ←                  (black)   |
|        (bus)        (bus)                           | Allegheny Av &               |
|                                                     | Hunting Park Av              |
|              ( (bus) )  ← selected: red ring        | STOP ID 275                  |
|                                                     | (60) (82) (1)  ← red pills   |
|    (bus)                                            +------------------------------+
|                         (bus)                       | 2 other riders suggested     |
|                                                     | upgrades here                |
|                                                     |  Roof      ████████  2       |
|                                                     |  Bench     ████      1       |
|                                                     |  LED       ████████  2       |
|                                                     |  Info case           0       |
|                                                     |                              |
|                                                     | 1. Which upgrades? *         |
|                                                     |  [x] Roof  [x] Bench         |
|                                                     |  [ ] LED lights              |
|                                                     |  [ ] Info case / route map   |
|                                                     | 2. How do you use this stop?*|
|                                                     |  ( ) I catch the bus here... |
|                                                     | 3. When are you here?        |
|                                                     |  [ ] early AM ... [ ] late   |
|                                                     | 4. Public art here? *        |
|                                                     |  (Chestnut St stained glass) |
|                                                     |  (•) Yes ( ) No ( ) Not sure |
|                                                     | ┃5. What makes this place    |
|                                                     | ┃meaningful to your community|
|                                                     | ┃[________________________]  |  ← only if Yes
|                                                     | 6. Who should we reach out to|
|                                                     | 7. Anything else?            |
|                                                     | [   SUBMIT SUGGESTION (red) ]|
+-----------------------------------------------------+------------------------------+
```

Validation: missing required answers turn red with a message; the panel scrolls to the first one.

## 3. Submitted: add another?

```
+------------------------------+
| ███ Thanks. Your suggestion  |
| ███ is on the map.           |
|▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬|
| Saved for Allegheny Av &     |
| Hunting Park Av (275): roof, |
| bench.                       |
|                              |
| Want to suggest upgrades at  |
| another bus stop?            |
| [Yes, pick another] [No]     |
+------------------------------+
```

- **Yes** → form clears, ring clears, panel says "Click another bus stop" (+ Stop ID box).
- **No** → wrap-up listing every stop they suggested this visit, with "Start over".
