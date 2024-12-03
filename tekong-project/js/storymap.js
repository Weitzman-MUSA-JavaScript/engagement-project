import { homeView } from './default.js';

let currentChapter = 1;

const chapters = [
    {
      title: "History of Tekong",
      content: `
        <p>Welcome to the story map section!</p>
        <p>Explore Tekong’s evolution from a quiet secluded settlement to its current reclaimed state.</p>
        <p>Use the <b>navigation buttons</b> above to navigate between chapters.</p>
        <div class="storymap-image-container">
        <img src="./assets/images/storymap-images/0-nas.webp" alt="National Archives Singapore" />
        </div>
      `,
      zoom: 13,
      center: [104.03152, 1.412]
    },
    {
      title: "Chapter 1:<br>Origins",
      content: `
        <p>The Tekong we know today was previously a collection of two islands: <b>Pulau Tekong Besar & Pulau Tekong Kechil</b> (literally Big Tekong and Small Tekong).</p>
        <p>Prior to independence, Tekong had a population of around 4,000 people, a mix of ethnic Chinese and Malay residents. Villagers tended to rubber and coconut trees, grew fruits and vegetables, reared prawns and fish.</p>
        <p>At that period, Tekong housed a few kampongs: Kampong Pahang, Kampong Selabin (Pekan), Kampong Seminal, Kampong Batu Koyok, Kampong Senyunkong, Kampong Pasir, Kampong Sungei Belang, Kampong Onom, Kampong Pasir Merah, and Kampong Permatang.</p>
        <div class="storymap-image-container">
        <img src="./assets/images/storymap-images/1-permatang.webp" alt="A Malay house at Kampong Permatang, Pulau Tekong, 1979" />
        </div>
        <p><i>A Malay house at Kampong Permatang, Pulau Tekong, 1979<br>Source: National Archives of Singapore</i> <br><a onclick="window.open(this.href,'_blank');return false;" href="https://www.nas.gov.sg/archivesonline/photographs/record-details/e744183e-1161-11e3-83d5-0050568939ad">View source</a></p>
        <div class="storymap-image-container">
        <img src="./assets/images/storymap-images/1-fish.webp" alt="A fish farm off the coast of Tekong, 1986" />
        </div>
        <p><i>A fish farm off the coast of Tekong, 1986<br>Source: National Archives of Singapore</i> <br><a onclick="window.open(this.href,'_blank');return false;" href="https://www.nas.gov.sg/archivesonline/photographs/record-details/f5e5c8b0-1161-11e3-83d5-0050568939ad">View source</a></p>
      `,
      zoom: 14,
      center: [104.04432, 1.41124]
    },
    {
      title: "Chapter 2:<br>Behind the name",
      content: `
        <p>There are a few theories behind why Tekong is called Tekong.</p>
        <p>One theory argues that sailors who relied on stars for navigation were said to follow a particular star known as the “tekong”, which would lead them to the island.</p>
        <p>Another theory goes that the earliest settlers on Tekong were from <b>Pahang</b> who first arrived in 1857 before the outbreak of a civil war in Teluk Tekong — their native land. A key area affected by the war was a district called Teluk Tekong. The refugees then named their new home Pulau Tekong in memory of their previous homes. This is a compelling theory given that one of the more central Kampongs in Tekong was called “Kampong Pahang” (pictured in the map).</p>
        <p>Turning to linguistics, tekong in Malay refers to a deep cleft in a giant rock that collects water from rain and dew on the island. As for Indonesian, tekong means something that is not straight or wavy.</p>
        <div class="storymap-image-container">
        <img src="./assets/images/storymap-images/2-boat.webp" alt="A boat departing from Tekong, 1986" />
        </div>
        <p><i>A boat departing from Tekong, 1986<br>Source: National Archives of Singapore</i> <br><a onclick="window.open(this.href,'_blank');return false;" href="https://www.nas.gov.sg/archivesonline/photographs/record-details/f601cca4-1161-11e3-83d5-0050568939ad">View source</a></p>
      `,
      zoom: 15,
      center: [104.0358, 1.40947]
    },
    {
      title: "Chapter 3:<br>The resettlement",
      content: `
        <p>Beginning in <b>1986</b>, residents on Tekong began to be resettled onto mainland Singapore, kickstarting the period where our armed forces take full control over the island. The relocation process was facilitated by the Housing & Development Board and the Singapore Armed Forces.</p>
        <div class="storymap-image-container">
        <img src="./assets/images/storymap-images/3-resettlement-notice.webp" alt="A relocation notice for Pulau Tekong Tai Yang Gong Temple at Kampong Permatang" />
        </div>
        <p><i>A relocation notice for Pulau Tekong Tai Yang Gong Temple at <b>Kampong Permatang</b> (as zoomed in the map)<br>Source: National Archives of Singapore</i> <br><a onclick="window.open(this.href,'_blank');return false;" href="https://www.nas.gov.sg/archivesonline/photographs/record-details/d69dd2dd-1161-11e3-83d5-0050568939ad" ;">View source</a></p>
        <div class="storymap-image-container">
        <img src="./assets/images/storymap-images/3-resettlement-army.webp" alt="Army trucks assisting with the resettlement programme, 1986" />
        </div>
        <p><i>Army trucks assisting with the resettlement programme, 1986<br>Source: National Archives of Singapore</i> <br><a onclick="window.open(this.href,'_blank');return false;" href="https://www.nas.gov.sg/archivesonline/photographs/record-details/f6025aa0-1161-11e3-83d5-0050568939ad" ;">View source</a></p>
      `,
      zoom: 15,
      center: [104.04012, 1.42408]
    },
    {
      title: "Chapter 4:<br>Military island",
      content: `
        <p>From the late 1980s till today, the entirety of the island is used for military training. As pictured in the map, what once were kampongs were replaced by military infrastructure. For example, the former <b>Kampong Batu Koyok</b> has become the present-day Basic Military Training Centre (BMTC) School 4 (Rocky Hill Camp).</p>
        <p>The Maritime & Port Authority estimates that about <b>4,000 military personnel</b> cross between mainland Singapore and Tekong each day. Peak periods will see as much as 8,000 people make the journey each day.</p>
        <div class="storymap-image-container">
        <img src="./assets/images/storymap-images/4-president-old.webp" alt="Then-president Wee Kim Wee arriving at the Infantry Training Depot in Tekong, 1987" />
        </div>
        <p><i>Then-president Wee Kim Wee arriving at the Infantry Training Depot in Tekong, 1987<br>Source: National Archives of Singapore</i> <br><a onclick="window.open(this.href,'_blank');return false;" href="https://www.nas.gov.sg/archivesonline/photographs/record-details/fadeefdf-1161-11e3-83d5-0050568939ad">View source</a></p>
        <div class="storymap-image-container">
        <img src="./assets/images/storymap-images/4-president-new.webp" alt="Then-president Halimah Yacob arriving at the Basic Military Training Centre in Tekong, 2018" />
        </div>
        <p><i>Then-president Halimah Yacob arriving at the Basic Military Training Centre in Tekong, 2018<br>Source: National Archives of Singapore</i> <br><a onclick="window.open(this.href,'_blank');return false;" href="https://www.nas.gov.sg/archivesonline/photographs/record-details/0c4807cb-5fa7-11eb-b519-005056a7c31c">View source</a></p>
      `,
      zoom: 15,
      center: [104.04858, 1.3976]
    },
    {
      title: "Chapter 5:<br>Expansion",
      content: `
        <div class="form-check form-switch">
        <input class="form-check-input" type="checkbox" role="switch" id="toggleMRT" />
        <label class="form-check-label" for="toggleMRT">Compare Tekong before & after</label>
        </div>
        <p>At present, the Ministry for National Development is constructing <b>polders</b> all around Tekong to expand its land area. In each polder, land is below sea level and is protected by dike walls. It is the same underlying technology / principle that built up the Netherlands since the 12th century (as much as 20% being polder land).</p>
        <div class="storymap-image-container">
        <img src="./assets/images/storymap-images/5-progress.webp" alt="Status of land reclamation in northern part of Tekong, 2022" />
        </div>
        <p><i>Source: Straits Times</i> <br><a onclick="window.open(this.href,'_blank');return false;" href="https://www.straitstimes.com/singapore/pulau-tekong-polder-project-more-than-halfway-complete-to-finish-by-end-2024">View source</a></p>
        <div class="storymap-image-container">
        <img src="./assets/images/storymap-images/5-graphic.webp" alt="Description of land reclamation in Tekong" />
        </div>
        <p><i>Source: Straits Times</i> <br><a onclick="window.open(this.href,'_blank');return false;" href="https://www.straitstimes.com/singapore/pulau-tekong-polder-project-more-than-halfway-complete-to-finish-by-end-2024">View source</a></p>
      `,
      zoom: 13.5,
      center: [104.04432, 1.41124]
    },
    {
      title: "Chapter 6:<br>The future",
      content: `
        <div class="form-check form-switch">
        <input class="form-check-input" type="checkbox" role="switch" id="toggleMRT" />
        <label class="form-check-label" for="toggleMRT">Compare Tekong before & after</label>
        </div>
        <p>While the armed forces train on Tekong today, the future of Tekong may look very different from now. Based on the adopted Master Plan at the Ministry of National Development, <b>the bulk of Tekong is zoned as “reserve” land</b>, meaning that future land uses are undecided. In other words, the present-day military use is very much an interim use of space. Given the high economic costs of land reclamation, one could well hazard a guess that the future of Tekong is an urban one, with value-generating land uses that may recoup the land reclamation costs many times over.</p>
        <p>Given our small land area, it is important to keep large plots of our land reserved for future generations to decide their usage, when present-day demand is sufficiently met.</p>
        <p>What do you wish to see in the future of places like Tekong? Return to the home page and submit your ideas, or speak to a planner at one of the URA’s heartlands exhibitions today!</p>
        <div class="storymap-image-container">
        <img src="./assets/images/storymap-images/6-zoning.webp" alt="Master Plan 2019" />
        </div>
        <p><i>The zoning of Tekong in the Master Plan, 2024<br>Source: URA SPACE</i> <br><a onclick="window.open(this.href,'_blank');return false;" href="https://www.ura.gov.sg/maps/">View source</a></p>
        <p>For additional information, these resources are really helpful:</p>
        <p><i>National Library</i> <br><a onclick="window.open(this.href,'_blank');return false;" href="https://www.nlb.gov.sg/main/article-detail?cmsuuid=559afee6-67a2-4222-9ec4-a1b4b7aa4d63">Tekong infopedia</a></p>
        <p><i>National Archives</i> <br><a onclick="window.open(this.href,'_blank');return false;" href="https://www.nas.gov.sg/archivesonline/maps_building_plans/record-details/fabc9bbe-115c-11e3-83d5-0050568939ad">Old maps of Singapore</a></p>
        <p><i>National Library</i> <br><a onclick="window.open(this.href,'_blank');return false;" href="https://remembersingapore.org/2012/04/04/from-villages-to-flats-part-1/">Remember Singapore</a></p>
      `,
      zoom: 13,
      center: [104.03152, 1.412]
    }
  ];

function loadStoryMode() {
  let contentPanel = document.getElementById('description-panel');
  contentPanel.innerHTML = `
        <!-- Back Icon Section -->
        <div class="d-flex align-items-center mt-3" id="back-icon-section">
            <i class="bi bi-arrow-left-circle-fill" style="font-size: 1.5em; cursor: pointer; margin-right: 10px;"></i>
            <span style="font-size: 1.1em; cursor: pointer;" id="return-home">Return to home</span>
        </div>
        <br>
        <!-- Buttons Section -->
        <div class="button-container d-flex justify-content-between">
            <button id="left-arrow" class="btn btn-outline-primary" title="Previous chapter">
                <i class="bi bi-arrow-left" style="color: black;"></i> <!-- Bootstrap Left Arrow Icon -->
            </button>
            <button id="right-arrow" class="btn btn-outline-primary" title="Next chapter">
                <i class="bi bi-arrow-right" style="color: black;"></i> <!-- Bootstrap Right Arrow Icon -->
            </button>
        </div>
        <br>
        <h3><span id="chapter-title" style="font-size: 1.1em;">${chapters[0].title}</span></h3>
        <div id="chapter-content">${chapters[0].content}</div>

  `;

  // "Return to home" functionality
  document.getElementById('back-icon-section').addEventListener('click', () => {
      // Clear and load the default view
      homeView();
  });

  // Arrow button navigation
  document.getElementById('left-arrow').addEventListener('click', () => {
      navigateLeft();
  });

  document.getElementById('right-arrow').addEventListener('click', () => {
      navigateRight();
  });
}

function updateChapter() {
  let chapterTitle = document.getElementById('chapter-title');
  let chapterContent = document.getElementById('chapter-content');

  chapterTitle.innerHTML = chapters[currentChapter - 1].title;
  chapterContent.innerHTML = chapters[currentChapter - 1].content;

  map.flyTo({
    center: chapters[currentChapter - 1].center,
    zoom: chapters[currentChapter - 1].zoom,
    essential: true  // Ensures that the transition is smooth
  });
}

function navigateLeft() {
  if (currentChapter > 1) {
    currentChapter--;
    updateChapter();
  }
}

function navigateRight() {
    if (currentChapter < chapters.length) {
      currentChapter++;
    } else {
      currentChapter = 1; // Loop back to the first chapter
    }
    updateChapter();
  }

document.addEventListener('change', (event) => {
  if (event.target && event.target.id === 'toggleMRT') {
    const isChecked = event.target.checked;

    const rasterLayerId = 'raster-layer'; 

    map.setPaintProperty(rasterLayerId, 'raster-opacity', isChecked ? 0 : 1);
  }
});

export { loadStoryMode };
