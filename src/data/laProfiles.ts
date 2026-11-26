import type { Listing } from '../types';

export const LA_MEDIA_BASE = './profiles/la';

export const LA_PROFILES: Listing[] = [
  {
    id: "la-01-maya-delgado",
    side: "jam",
    roleCategory: "Guitarists",
    instruments: ["guitar"],
    regionId: "la",
    regionLabel: "Los Angeles (213)",
    regionState: "CA",
    neighborhood: "Echo Park",
    title: "Maya Delgado",
    subtitle: "Indie & shoegaze rhythm/lead guitar",
    seekingOrOffer: "Tight pocket drummer and melodic bassist for a 2x/wk Echo Park indie/shoegaze project — demos ready, aiming for local shows by spring.",
    genres: ["Indie Rock","Shoegaze","Alt-Rock"],
    tags: ["Indie Rock","Shoegaze","Alt-Rock","Eastside LA"],
    bio: "24-year-old guitarist tracking guitar-driven indie rock and shoegaze out of Echo Park. Big on interlocking clean and light-overdrive chord voicings, chorus textures, and locked-in live dynamics. Looking for consistent weekly rehearsals.",
    gearOrBackline: "Fender Classic Player Jazzmaster, '65 Deluxe Reverb Reissue, Boss BD-2, Strymon Deco, Boss CE-2W",
    gearLocker: [
          {
                "id": "la-01-maya-delgado-g1",
                "category": "Instruments",
                "name": "Fender Classic Player Jazzmaster",
                "notes": "3-Color Sunburst, mastery bridge"
          },
          {
                "id": "la-01-maya-delgado-g2",
                "category": "Amps & Cabs",
                "name": "Fender '65 Deluxe Reverb Reissue",
                "notes": "22W 1x12 tube combo"
          },
          {
                "id": "la-01-maya-delgado-g3",
                "category": "Pedals & Synth",
                "name": "Boss BD-2, Strymon Deco & Boss CE-2W",
                "notes": "Echo Park bedroom board"
          }
    ],
    availability: "Tue & Thu evenings, Sun afternoons",
    visualSeed: 11,
    portraitUrl: `${LA_MEDIA_BASE}/la-01-maya-delgado.webp`,
    portraitAlt: "Maya Delgado playing a sunburst Fender Jazzmaster electric guitar in her Echo Park bedroom studio.",
    clips: [
      {
        id: "la-01-maya-delgado-clip-1",
        title: "Bedroom studio take",
        kind: 'video',
        embedUrl: `${LA_MEDIA_BASE}/la-01-maya-delgado.mp4`,
        embedProvider: 'direct',
        posterUrl: `${LA_MEDIA_BASE}/la-01-maya-delgado.webp`,
        durationSec: 8,
      },
    ],
    featuredClipId: "la-01-maya-delgado-clip-1",
    profileStyle: {
          "themeId": "midnight-vinyl",
          "moodStatus": "Writing a 5-track EP — need drums & bass in Echo Park",
          "bannerPattern": "waves",
          "soundsLike": [
                "Alvvays",
                "Turnover",
                "Slowdive"
          ]
    },
    isPublished: true,
    isUserCreated: false,
    createdAt: 1795656000000,
  },
  {
    id: "la-02-devon-cruz",
    side: "jam",
    roleCategory: "Guitarists",
    instruments: ["guitar"],
    regionId: "la",
    regionLabel: "Los Angeles (213)",
    regionState: "CA",
    neighborhood: "Silver Lake",
    title: "Devon Cruz",
    subtitle: "Neo-soul & R&B chord-melody guitar",
    seekingOrOffer: "Looking for a pocket drummer and warm keys player in Silver Lake for weekly neo-soul and R&B writing sessions.",
    genres: ["Neo-Soul","R&B","Jazz-Funk"],
    tags: ["Neo-Soul","R&B","Chord-Melody","Eastside LA"],
    bio: "27-year-old Filipino-American guitarist based in Silver Lake focused on extended R&B voicings, double-stops, and pocket-first rhythm playing. I keep charts clean and prefer rehearsal over endless texting.",
    gearOrBackline: "Fender American Stratocaster Olympic White, Fender Princeton Reverb, Keeley Compressor Plus, Strymon Flint",
    gearLocker: [
          {
                "id": "la-02-devon-cruz-g1",
                "category": "Instruments",
                "name": "Fender American Stratocaster",
                "notes": "Olympic White, rosewood neck"
          },
          {
                "id": "la-02-devon-cruz-g2",
                "category": "Amps & Cabs",
                "name": "Fender '65 Princeton Reverb",
                "notes": "10-inch speaker, warm clean headroom"
          },
          {
                "id": "la-02-devon-cruz-g3",
                "category": "Pedals & Synth",
                "name": "Keeley Compressor Plus & Strymon Flint",
                "notes": "Light compression + plate verb"
          }
    ],
    availability: "Mon & Wed nights",
    visualSeed: 12,
    portraitUrl: `${LA_MEDIA_BASE}/la-02-devon-cruz.webp`,
    portraitAlt: "Devon Cruz playing an Olympic White Stratocaster in his sunlit Silver Lake apartment.",
    clips: [
      {
        id: "la-02-devon-cruz-clip-1",
        title: "Silver Lake living room take",
        kind: 'video',
        embedUrl: `${LA_MEDIA_BASE}/la-02-devon-cruz.mp4`,
        embedProvider: 'direct',
        posterUrl: `${LA_MEDIA_BASE}/la-02-devon-cruz.webp`,
        durationSec: 8,
      },
    ],
    featuredClipId: "la-02-devon-cruz-clip-1",
    profileStyle: {
          "themeId": "tube-amber",
          "moodStatus": "Working up 3 neo-soul sketches — need drums & keys",
          "bannerPattern": "vinyl",
          "soundsLike": [
                "Tom Misch",
                "Melanie Faye",
                "Free Nationals"
          ]
    },
    isPublished: true,
    isUserCreated: false,
    createdAt: 1795656060000,
  },
  {
    id: "la-03-tessa-kline",
    side: "jam",
    roleCategory: "Guitarists",
    instruments: ["guitar"],
    regionId: "la",
    regionLabel: "Los Angeles (213)",
    regionState: "CA",
    neighborhood: "Highland Park",
    title: "Tessa Kline",
    subtitle: "Post-punk & angular alt-rock guitar",
    seekingOrOffer: "Looking to join or build a tight 3-piece post-punk band around Highland Park — ready to track demos and gig Eastside rooms.",
    genres: ["Post-Punk","Alt-Rock","Garage"],
    tags: ["Post-Punk","Alt-Rock","Telecaster","NELA"],
    bio: "21-year-old guitarist writing sharp, angular rhythm parts with chorus bite and spring tank clang. Cut my teeth in DIY warehouse gigs around NELA and looking for players who lock in tight without ego.",
    gearOrBackline: "Fender Telecaster Butterscotch Blonde, Roland JC-40, ProCo RAT 2, Boss DD-8",
    gearLocker: [
          {
                "id": "la-03-tessa-kline-g1",
                "category": "Instruments",
                "name": "Fender Telecaster Butterscotch",
                "notes": "Stock single-coils, sharp bridge bite"
          },
          {
                "id": "la-03-tessa-kline-g2",
                "category": "Amps & Cabs",
                "name": "Roland JC-40 Jazz Chorus",
                "notes": "Stereo chorus clean platform"
          },
          {
                "id": "la-03-tessa-kline-g3",
                "category": "Pedals & Synth",
                "name": "ProCo RAT 2 & Boss DD-8",
                "notes": "Grit + short slap delay"
          }
    ],
    availability: "Tue evenings & Saturdays",
    visualSeed: 13,
    portraitUrl: `${LA_MEDIA_BASE}/la-03-tessa-kline.webp`,
    portraitAlt: "Tessa Kline playing a Butterscotch Fender Telecaster standing in a Highland Park garage.",
    clips: [
      {
        id: "la-03-tessa-kline-clip-1",
        title: "Garage practice riff",
        kind: 'video',
        embedUrl: `${LA_MEDIA_BASE}/la-03-tessa-kline.mp4`,
        embedProvider: 'direct',
        posterUrl: `${LA_MEDIA_BASE}/la-03-tessa-kline.webp`,
        durationSec: 8,
      },
    ],
    featuredClipId: "la-03-tessa-kline-clip-1",
    profileStyle: {
          "themeId": "zine-mono",
          "moodStatus": "Writing gritty 135 BPM post-punk hooks in NELA",
          "bannerPattern": "grid",
          "soundsLike": [
                "Wet Leg",
                "Dry Cleaning",
                "Interpol"
          ]
    },
    isPublished: true,
    isUserCreated: false,
    createdAt: 1795656120000,
  },
  {
    id: "la-04-marcus-bell",
    side: "jam",
    roleCategory: "Guitarists",
    instruments: ["guitar"],
    regionId: "la",
    regionLabel: "Los Angeles (213)",
    regionState: "CA",
    neighborhood: "West Adams",
    title: "Marcus Bell",
    subtitle: "Funk & pocket rhythm guitar",
    seekingOrOffer: "Looking for a tight West Adams / Mid-City rhythm section (bass & drums) for funk, soul, and paid showcase sets.",
    genres: ["Funk","Soul","R&B"],
    tags: ["Funk","Pocket","ES-335","West Adams"],
    bio: "33-year-old rhythm-first guitarist obsessed with muted 16th-note pocket, ninth chords, and leaving space in the mix. Ten years gigging LA rooms and session dates; punctual with charts and tones.",
    gearOrBackline: "Gibson ES-335 Cherry Red, Fender Twin Reverb, Xotic SP Compressor, MXR Phase 90",
    gearLocker: [
          {
                "id": "la-04-marcus-bell-g1",
                "category": "Instruments",
                "name": "Gibson ES-335 Cherry Red",
                "notes": "Semi-hollow warmth for soul/funk"
          },
          {
                "id": "la-04-marcus-bell-g2",
                "category": "Amps & Cabs",
                "name": "Fender '65 Twin Reverb",
                "notes": "Crisp high-headroom clean tone"
          },
          {
                "id": "la-04-marcus-bell-g3",
                "category": "Pedals & Synth",
                "name": "Xotic SP Compressor & MXR Phase 90",
                "notes": "Tight chicken-scratch pocket"
          }
    ],
    availability: "Thu nights & weekends",
    visualSeed: 14,
    portraitUrl: `${LA_MEDIA_BASE}/la-04-marcus-bell.webp`,
    portraitAlt: "Marcus Bell playing a Cherry Red Gibson ES-335 in his warm lamp-lit West Adams studio.",
    clips: [
      {
        id: "la-04-marcus-bell-clip-1",
        title: "West Adams funk pocket",
        kind: 'video',
        embedUrl: `${LA_MEDIA_BASE}/la-04-marcus-bell.mp4`,
        embedProvider: 'direct',
        posterUrl: `${LA_MEDIA_BASE}/la-04-marcus-bell.webp`,
        durationSec: 8,
      },
    ],
    featuredClipId: "la-04-marcus-bell-clip-1",
    profileStyle: {
          "themeId": "stage-coral",
          "moodStatus": "Tight 16th-note groove mode — open for West Adams funk",
          "bannerPattern": "bars",
          "soundsLike": [
                "Vulfpeck",
                "Cory Wong",
                "Nile Rodgers"
          ]
    },
    isPublished: true,
    isUserCreated: false,
    createdAt: 1795656180000,
  },
  {
    id: "la-05-kenji-watanabe",
    side: "jam",
    roleCategory: "Guitarists",
    instruments: ["guitar"],
    regionId: "la",
    regionLabel: "Los Angeles (213)",
    regionState: "CA",
    neighborhood: "Arts District",
    title: "Kenji Watanabe",
    subtitle: "Math rock & tapping guitar",
    seekingOrOffer: "Searching for an expressive drummer and inventive bassist in DTLA for intricate math rock and post-rock instrumentals.",
    genres: ["Math Rock","Midwest Emo","Post-Rock"],
    tags: ["Math Rock","Tapping","DTLA","Instrumental"],
    bio: "25-year-old guitarist writing FACGCE open-tuning lines combining two-hand tapping, clean arpeggios, and odd-meter transitions. Have a quiet loft practice setup in the Arts District.",
    gearOrBackline: "Ibanez Talman Seafoam Green, Vox AC15C1, EarthQuaker Warden, Walrus Slo",
    gearLocker: [
          {
                "id": "la-05-kenji-watanabe-g1",
                "category": "Instruments",
                "name": "Ibanez Talman TM302 Seafoam",
                "notes": "Setup in FACGCE & standard"
          },
          {
                "id": "la-05-kenji-watanabe-g2",
                "category": "Amps & Cabs",
                "name": "Vox AC15C1",
                "notes": "Top boost chime"
          },
          {
                "id": "la-05-kenji-watanabe-g3",
                "category": "Pedals & Synth",
                "name": "EQD Warden & Walrus Audio Slo",
                "notes": "Optical sustain + ambient trails"
          }
    ],
    availability: "Weeknights after 7pm",
    visualSeed: 15,
    portraitUrl: `${LA_MEDIA_BASE}/la-05-kenji-watanabe.webp`,
    portraitAlt: "Kenji Watanabe tapping a Seafoam Green Ibanez Talman guitar in his Arts District loft.",
    clips: [
      {
        id: "la-05-kenji-watanabe-clip-1",
        title: "FACGCE tapping loop",
        kind: 'video',
        embedUrl: `${LA_MEDIA_BASE}/la-05-kenji-watanabe.mp4`,
        embedProvider: 'direct',
        posterUrl: `${LA_MEDIA_BASE}/la-05-kenji-watanabe.webp`,
        durationSec: 8,
      },
    ],
    featuredClipId: "la-05-kenji-watanabe-clip-1",
    profileStyle: {
          "themeId": "emerald-club",
          "moodStatus": "Polishing 7/8 clean guitar sketches in Arts District",
          "bannerPattern": "grid",
          "soundsLike": [
                "Covet",
                "toe",
                "TTNG"
          ]
    },
    isPublished: true,
    isUserCreated: false,
    createdAt: 1795656240000,
  },
  {
    id: "la-06-rafael-ortega",
    side: "jam",
    roleCategory: "Guitarists",
    instruments: ["guitar"],
    regionId: "la",
    regionLabel: "Los Angeles (213)",
    regionState: "CA",
    neighborhood: "Burbank",
    title: "Rafael Ortega",
    subtitle: "Psych & blues-rock lead guitar",
    seekingOrOffer: "Looking to join a heavy psych, desert rock, or blues-rock band in the Valley or Eastside — reliable gear, stage-ready.",
    genres: ["Psych Rock","Blues-Rock","Indie Rock"],
    tags: ["Psych Rock","Les Paul","Burbank","Fuzz"],
    bio: "39-year-old guitarist mixing fuzz-soaked melodic leads with dynamic volume-knob cleanup. Been playing Burbank and Hollywood rooms for 15+ years and love locking in with loud organic bands.",
    gearOrBackline: "Gibson Les Paul Standard Goldtop, Marshall Studio Vintage SV20C, Analogman Sun Face, Dunlop Cry Baby",
    gearLocker: [
          {
                "id": "la-06-rafael-ortega-g1",
                "category": "Instruments",
                "name": "Gibson Les Paul Standard Goldtop",
                "notes": "PAF humbuckers, rich sustain"
          },
          {
                "id": "la-06-rafael-ortega-g2",
                "category": "Amps & Cabs",
                "name": "Marshall SV20C 1x12",
                "notes": "Plexi breakup at club volume"
          },
          {
                "id": "la-06-rafael-ortega-g3",
                "category": "Pedals & Synth",
                "name": "Analogman Sun Face NKT + Cry Baby",
                "notes": "Classic germanium fuzz sweep"
          }
    ],
    availability: "Fri evenings & Sundays",
    visualSeed: 16,
    portraitUrl: `${LA_MEDIA_BASE}/la-06-rafael-ortega.webp`,
    portraitAlt: "Rafael Ortega playing a Gibson Les Paul Goldtop in a wood-paneled Burbank room.",
    clips: [
      {
        id: "la-06-rafael-ortega-clip-1",
        title: "Burbank Goldtop lead",
        kind: 'video',
        embedUrl: `${LA_MEDIA_BASE}/la-06-rafael-ortega.mp4`,
        embedProvider: 'direct',
        posterUrl: `${LA_MEDIA_BASE}/la-06-rafael-ortega.webp`,
        durationSec: 8,
      },
    ],
    featuredClipId: "la-06-rafael-ortega-clip-1",
    profileStyle: {
          "themeId": "tube-amber",
          "moodStatus": "Warm tubes & fuzz — open to Burbank or Eastside bands",
          "bannerPattern": "vinyl",
          "soundsLike": [
                "Khruangbin",
                "All Them Witches",
                "Black Pumas"
          ]
    },
    isPublished: true,
    isUserCreated: false,
    createdAt: 1795656300000,
  },
  {
    id: "la-07-jordan-hayes",
    side: "jam",
    roleCategory: "Drummers",
    instruments: ["drums"],
    regionId: "la",
    regionLabel: "Los Angeles (213)",
    regionState: "CA",
    neighborhood: "North Hollywood",
    title: "Jordan Hayes",
    subtitle: "Pocket funk, R&B & neo-soul drummer",
    seekingOrOffer: "Available for LA neo-soul, R&B, and funk bands or paid tracking sessions — have my own NoHo lockout.",
    genres: ["R&B","Neo-Soul","Funk"],
    tags: ["Pocket Drums","Ludwig","NoHo","Session"],
    bio: "23-year-old drummer raised in gospel and R&B pockets. Obsessed with fat dead-snare ghost notes, dry crisp hi-hat phrasing, and locking straight to the bass player's thumb. Click-track comfortable.",
    gearOrBackline: "Ludwig Classic Maple 4-pc, Ludwig Supraphonic 14x5, Zildjian K Custom Special Dry Hi-Hats",
    gearLocker: [
          {
                "id": "la-07-jordan-hayes-g1",
                "category": "Drums & Percussion",
                "name": "Ludwig Classic Maple 4-piece",
                "notes": "22/12/16 vintage marine pearl"
          },
          {
                "id": "la-07-jordan-hayes-g2",
                "category": "Drums & Percussion",
                "name": "14x5 Ludwig Supraphonic + tea towel",
                "notes": "Dry crisp snare snap + ghost notes"
          },
          {
                "id": "la-07-jordan-hayes-g3",
                "category": "Drums & Percussion",
                "name": "Zildjian K Custom Special Dry Set",
                "notes": "14\" hats, 18\" trash crash, 21\" ride"
          }
    ],
    availability: "Mon, Tue & Thu evenings",
    visualSeed: 17,
    portraitUrl: `${LA_MEDIA_BASE}/la-07-jordan-hayes.webp`,
    portraitAlt: "Jordan Hayes playing a crisp funk-soul pocket groove behind Ludwig drums in North Hollywood.",
    clips: [
      {
        id: "la-07-jordan-hayes-clip-1",
        title: "NoHo lockout pocket take",
        kind: 'video',
        embedUrl: `${LA_MEDIA_BASE}/la-07-jordan-hayes.mp4`,
        embedProvider: 'direct',
        posterUrl: `${LA_MEDIA_BASE}/la-07-jordan-hayes.webp`,
        durationSec: 8,
      },
    ],
    featuredClipId: "la-07-jordan-hayes-clip-1",
    profileStyle: {
          "themeId": "stage-coral",
          "moodStatus": "In the NoHo lockout Tue/Thu — let's lock a groove",
          "bannerPattern": "bars",
          "soundsLike": [
                "Questlove",
                "Anderson .Paak",
                "Nate Smith"
          ]
    },
    isPublished: true,
    isUserCreated: false,
    createdAt: 1795656360000,
  },
  {
    id: "la-08-chloe-park",
    side: "jam",
    roleCategory: "Drummers",
    instruments: ["drums"],
    regionId: "la",
    regionLabel: "Los Angeles (213)",
    regionState: "CA",
    neighborhood: "Koreatown",
    title: "Chloe Park",
    subtitle: "Indie rock & shoegaze kit drummer",
    seekingOrOffer: "Looking to join a committed indie rock, dream-pop, or shoegaze band around K-Town / Silver Lake / Echo Park.",
    genres: ["Indie Rock","Shoegaze","Dream-Pop"],
    tags: ["Indie Drums","Gretsch","Koreatown","Dynamic"],
    bio: "26-year-old drummer big on driving eighth-note tom grooves, explosive wash crashes, and knowing when to pull back cleanly on verses. Reliable car with folding seats for local gigs.",
    gearOrBackline: "Gretsch Catalina Club 4-pc, Pork Pie Little Squealer Snare, Istanbul Agop Xist Brilliant Cymbals",
    gearLocker: [
          {
                "id": "la-08-chloe-park-g1",
                "category": "Drums & Percussion",
                "name": "Gretsch Catalina Club Satin",
                "notes": "Tight 18\" kick, warm birch shells"
          },
          {
                "id": "la-08-chloe-park-g2",
                "category": "Drums & Percussion",
                "name": "Istanbul Agop Xist 15\" Hats & 20\" Crash",
                "notes": "Shimmering shoegaze wash"
          },
          {
                "id": "la-08-chloe-park-g3",
                "category": "Mics & Studio",
                "name": "Overhead Ribbon Pair + SM57 Snare",
                "notes": "Quick scratch demo setup"
          }
    ],
    availability: "Wed evenings & Sunday afternoons",
    visualSeed: 18,
    portraitUrl: `${LA_MEDIA_BASE}/la-08-chloe-park.webp`,
    portraitAlt: "Chloe Park drumming on a Gretsch Catalina kit in a Koreatown studio.",
    clips: [
      {
        id: "la-08-chloe-park-clip-1",
        title: "K-Town indie driving groove",
        kind: 'video',
        embedUrl: `${LA_MEDIA_BASE}/la-08-chloe-park.mp4`,
        embedProvider: 'direct',
        posterUrl: `${LA_MEDIA_BASE}/la-08-chloe-park.webp`,
        durationSec: 8,
      },
    ],
    featuredClipId: "la-08-chloe-park-clip-1",
    profileStyle: {
          "themeId": "midnight-vinyl",
          "moodStatus": "Ready for driving indie/shoegaze rehearsals Eastside",
          "bannerPattern": "waves",
          "soundsLike": [
                "Alvvays",
                "Japanese Breakfast",
                "Beach House"
          ]
    },
    isPublished: true,
    isUserCreated: false,
    createdAt: 1795656420000,
  },
  {
    id: "la-09-diego-salazar",
    side: "jam",
    roleCategory: "Drummers",
    instruments: ["drums"],
    regionId: "la",
    regionLabel: "Los Angeles (213)",
    regionState: "CA",
    neighborhood: "Boyle Heights",
    title: "Diego Salazar",
    subtitle: "Garage punk & hardcore drummer",
    seekingOrOffer: "Looking for fast, loud garage punk, skate punk, or post-hardcore projects around Boyle Heights, Echo Park, or DTLA.",
    genres: ["Punk","Garage","Hardcore"],
    tags: ["Garage Punk","Tama","Boyle Heights","Fast"],
    bio: "20-year-old drummer with stamina for high-BPM D-beats, explosive fills, and messy garage basements. Always down to load the van and open local bills.",
    gearOrBackline: "Tama Starclassic Performer, Pearl SensiTone Brass Snare, Sabian AAX Explosive Crashes",
    gearLocker: [
          {
                "id": "la-09-diego-salazar-g1",
                "category": "Drums & Percussion",
                "name": "Tama Starclassic Performer Birch",
                "notes": "Punchy attack that cuts loud amps"
          },
          {
                "id": "la-09-diego-salazar-g2",
                "category": "Drums & Percussion",
                "name": "Pearl SensiTone 14x6.5 Brass Snare",
                "notes": "Crack & rimshot projection"
          },
          {
                "id": "la-09-diego-salazar-g3",
                "category": "Drums & Percussion",
                "name": "Sabian AAX Stage Hats & 19\" X-Plosion",
                "notes": "Fast bright decay"
          }
    ],
    availability: "Mon–Fri after 6pm & weekends",
    visualSeed: 19,
    portraitUrl: `${LA_MEDIA_BASE}/la-09-diego-salazar.webp`,
    portraitAlt: "Diego Salazar hitting fast punk drums in a Boyle Heights garage.",
    clips: [
      {
        id: "la-09-diego-salazar-clip-1",
        title: "Boyle Heights garage D-beat",
        kind: 'video',
        embedUrl: `${LA_MEDIA_BASE}/la-09-diego-salazar.mp4`,
        embedProvider: 'direct',
        posterUrl: `${LA_MEDIA_BASE}/la-09-diego-salazar.webp`,
        durationSec: 8,
      },
    ],
    featuredClipId: "la-09-diego-salazar-clip-1",
    profileStyle: {
          "themeId": "zine-mono",
          "moodStatus": "Down to loud garage punk jams every weekend",
          "bannerPattern": "grid",
          "soundsLike": [
                "Turnstile",
                "FIDLAR",
                "PUP"
          ]
    },
    isPublished: true,
    isUserCreated: false,
    createdAt: 1795656480000,
  },
  {
    id: "la-10-hannah-brooks",
    side: "jam",
    roleCategory: "Drummers",
    instruments: ["drums"],
    regionId: "la",
    regionLabel: "Los Angeles (213)",
    regionState: "CA",
    neighborhood: "Frogtown",
    title: "Hannah Brooks",
    subtitle: "Session & pop-rock groove drummer",
    seekingOrOffer: "Looking for songwriter backing gigs, indie-pop bands, and Frogtown studio sessions — chart & click ready.",
    genres: ["Indie Pop","Pop-Rock","Alt-Rock"],
    tags: ["Session Drums","Rogers","Frogtown","Click Ready"],
    bio: "31-year-old working drummer focused on serving vocal hooks, singing reliable backing harmonies if needed, and keeping tempo rock-solid live or in sessions.",
    gearOrBackline: "1974 Vintage Rogers Powertone Kit, Acrolite Snare, Zildjian Sweet Ride 21\"",
    gearLocker: [
          {
                "id": "la-10-hannah-brooks-g1",
                "category": "Drums & Percussion",
                "name": "1974 Rogers Holiday/Powertone",
                "notes": "Warm 5-ply maple vintage tone"
          },
          {
                "id": "la-10-hannah-brooks-g2",
                "category": "Drums & Percussion",
                "name": "14x5 Ludwig Acrolite + Big Fat Snare",
                "notes": "Tight dry studio pop thud"
          },
          {
                "id": "la-10-hannah-brooks-g3",
                "category": "Drums & Percussion",
                "name": "Zildjian A Sweet 21\" & K Dark Hats",
                "notes": "Balanced mix-friendly wash"
          }
    ],
    availability: "Flexible Tue–Sat",
    visualSeed: 20,
    portraitUrl: `${LA_MEDIA_BASE}/la-10-hannah-brooks.webp`,
    portraitAlt: "Hannah Brooks playing vintage Rogers drums in a clean Frogtown studio.",
    clips: [
      {
        id: "la-10-hannah-brooks-clip-1",
        title: "Frogtown studio take",
        kind: 'video',
        embedUrl: `${LA_MEDIA_BASE}/la-10-hannah-brooks.mp4`,
        embedProvider: 'direct',
        posterUrl: `${LA_MEDIA_BASE}/la-10-hannah-brooks.webp`,
        durationSec: 8,
      },
    ],
    featuredClipId: "la-10-hannah-brooks-clip-1",
    profileStyle: {
          "themeId": "emerald-club",
          "moodStatus": "Booking spring showcases & Frogtown tracking sessions",
          "bannerPattern": "waves",
          "soundsLike": [
                "HAIM",
                "MUNA",
                "Phoebe Bridgers"
          ]
    },
    isPublished: true,
    isUserCreated: false,
    createdAt: 1795656540000,
  },
  {
    id: "la-11-tariq-mansour",
    side: "jam",
    roleCategory: "Drummers",
    instruments: ["drums"],
    regionId: "la",
    regionLabel: "Los Angeles (213)",
    regionState: "CA",
    neighborhood: "Mid-City",
    title: "Tariq Mansour",
    subtitle: "Jazz fusion, breakbeat & odd-meter drummer",
    seekingOrOffer: "Looking for adventurous Mid-City keys, bass, and horn players for modern jazz, hip-hop breakbeats, and fusion sets.",
    genres: ["Jazz Fusion","Breakbeat","Neo-Soul"],
    tags: ["Jazz Drums","Breakbeat","Mid-City","Yamaha"],
    bio: "28-year-old drummer blending J Dilla swing quantization feel with crisp jazz ride articulation and odd-time modulations. Always eager to experiment musically.",
    gearOrBackline: "Yamaha Recording Custom 4-pc, Gretsch Bell Brass Snare, Meinl Byzance Vintage Sand Cymbals",
    gearLocker: [
          {
                "id": "la-11-tariq-mansour-g1",
                "category": "Drums & Percussion",
                "name": "Yamaha Recording Custom Birch",
                "notes": "Focused articulation across kits"
          },
          {
                "id": "la-11-tariq-mansour-g2",
                "category": "Drums & Percussion",
                "name": "Meinl Byzance Vintage Sand Ride & Hats",
                "notes": "Complex smoky stick definition"
          },
          {
                "id": "la-11-tariq-mansour-g3",
                "category": "Drums & Percussion",
                "name": "Vic Firth 7A + Rods/Rutes",
                "notes": "Nimble ghost-note precision"
          }
    ],
    availability: "Sun–Wed evenings",
    visualSeed: 21,
    portraitUrl: `${LA_MEDIA_BASE}/la-11-tariq-mansour.webp`,
    portraitAlt: "Tariq Mansour drumming on a Yamaha Recording Custom kit in Mid-City.",
    clips: [
      {
        id: "la-11-tariq-mansour-clip-1",
        title: "Unquantized breakbeat groove",
        kind: 'video',
        embedUrl: `${LA_MEDIA_BASE}/la-11-tariq-mansour.mp4`,
        embedProvider: 'direct',
        posterUrl: `${LA_MEDIA_BASE}/la-11-tariq-mansour.webp`,
        durationSec: 8,
      },
    ],
    featuredClipId: "la-11-tariq-mansour-clip-1",
    profileStyle: {
          "themeId": "synth-violet",
          "moodStatus": "Seeking Mid-City bass & Rhodes for live breakbeats",
          "bannerPattern": "bars",
          "soundsLike": [
                "Yussef Dayes",
                "Robert Glasper",
                "Karriem Riggins"
          ]
    },
    isPublished: true,
    isUserCreated: false,
    createdAt: 1795656600000,
  },
  {
    id: "la-12-owen-miller",
    side: "jam",
    roleCategory: "Drummers",
    instruments: ["drums"],
    regionId: "la",
    regionLabel: "Los Angeles (213)",
    regionState: "CA",
    neighborhood: "Pasadena",
    title: "Owen Miller",
    subtitle: "Americana, roots & brush-kit drummer",
    seekingOrOffer: "Looking for Alt-Country, Americana, or singer-songwriter gigs around Pasadena, Eagle Rock, and Highland Park.",
    genres: ["Americana","Alt-Country","Folk Rock"],
    tags: ["Brushes","Slingerland","Pasadena","Roots"],
    bio: "42-year-old roots drummer specializing in subtle brush sweeps, train beats, and dynamic room support for acoustic and pedal-steel-driven acts. Low stage volume, big pocket.",
    gearOrBackline: "1968 Vintage Slingerland Radio King, Regal Tip Retractable Brushes, Zildjian Kerope 20\"",
    gearLocker: [
          {
                "id": "la-12-owen-miller-g1",
                "category": "Drums & Percussion",
                "name": "1968 Slingerland Champagne Sparkle",
                "notes": "14\" snare w/ calf-style coated head"
          },
          {
                "id": "la-12-owen-miller-g2",
                "category": "Drums & Percussion",
                "name": "Regal Tip Clayton Cameron Brushes",
                "notes": "Crisp train-beat & ballad sweeps"
          },
          {
                "id": "la-12-owen-miller-g3",
                "category": "Drums & Percussion",
                "name": "Zildjian Kerope 20\" Ride",
                "notes": "Warm dark dry wash"
          }
    ],
    availability: "Thu nights & Sundays",
    visualSeed: 22,
    portraitUrl: `${LA_MEDIA_BASE}/la-12-owen-miller.webp`,
    portraitAlt: "Owen Miller sweeping wire brushes over a coated snare in a sunny Pasadena room.",
    clips: [
      {
        id: "la-12-owen-miller-clip-1",
        title: "Pasadena brush train groove",
        kind: 'video',
        embedUrl: `${LA_MEDIA_BASE}/la-12-owen-miller.mp4`,
        embedProvider: 'direct',
        posterUrl: `${LA_MEDIA_BASE}/la-12-owen-miller.webp`,
        durationSec: 8,
      },
    ],
    featuredClipId: "la-12-owen-miller-clip-1",
    profileStyle: {
          "themeId": "tube-amber",
          "moodStatus": "Looking to back NELA / Pasadena songwriters & roots acts",
          "bannerPattern": "vinyl",
          "soundsLike": [
                "Wilco",
                "Jason Isbell",
                "Big Thief"
          ]
    },
    isPublished: true,
    isUserCreated: false,
    createdAt: 1795656660000,
  },
  {
    id: "la-13-amara-okafor",
    side: "jam",
    roleCategory: "Bassists",
    instruments: ["bass"],
    regionId: "la",
    regionLabel: "Los Angeles (213)",
    regionState: "CA",
    neighborhood: "Culver City",
    title: "Amara Okafor",
    subtitle: "Funk, disco & melodic slap bass",
    seekingOrOffer: "Looking for upbeat funk, nu-disco, or pop-soul bands on the Westside & Mid-City ready to tighten sets.",
    genres: ["Funk","Disco","R&B"],
    tags: ["StingRay","Slap Bass","Culver City","Groove"],
    bio: "24-year-old bassist bringing tight thumb-and-pluck funk grooves, clean octave lines, and locked-in synth-style disco phrasing. Reliable transport, clean tone straight out of DI or rig.",
    gearOrBackline: "Ernie Ball Music Man StingRay Natural Ash, Aguilar Tone Hammer 500 + SL112, Darkglass Microtubes",
    gearLocker: [
          {
                "id": "la-13-amara-okafor-g1",
                "category": "Instruments",
                "name": "Music Man StingRay 4 Special",
                "notes": "Natural ash, active 3-band EQ"
          },
          {
                "id": "la-13-amara-okafor-g2",
                "category": "Amps & Cabs",
                "name": "Aguilar Tone Hammer 500 + SL112",
                "notes": "Lightweight Westside gig rig"
          },
          {
                "id": "la-13-amara-okafor-g3",
                "category": "Pedals & Synth",
                "name": "Origin Effects Cali76 Compact Bass",
                "notes": "Even punchy slap compression"
          }
    ],
    availability: "Mon, Wed & Sat evenings",
    visualSeed: 23,
    portraitUrl: `${LA_MEDIA_BASE}/la-13-amara-okafor.webp`,
    portraitAlt: "Amara Okafor playing a Natural Ash StingRay bass in a bright Culver City loft.",
    clips: [
      {
        id: "la-13-amara-okafor-clip-1",
        title: "Culver City disco-funk bass",
        kind: 'video',
        embedUrl: `${LA_MEDIA_BASE}/la-13-amara-okafor.mp4`,
        embedProvider: 'direct',
        posterUrl: `${LA_MEDIA_BASE}/la-13-amara-okafor.webp`,
        durationSec: 8,
      },
    ],
    featuredClipId: "la-13-amara-okafor-clip-1",
    profileStyle: {
          "themeId": "stage-coral",
          "moodStatus": "Down to lay bass on upbeat Westside funk & soul",
          "bannerPattern": "waves",
          "soundsLike": [
                "Chic",
                "Parcels",
                "Thundercat"
          ]
    },
    isPublished: true,
    isUserCreated: false,
    createdAt: 1795656720000,
  },
  {
    id: "la-14-lucas-bennett",
    side: "jam",
    roleCategory: "Bassists",
    instruments: ["bass"],
    regionId: "la",
    regionLabel: "Los Angeles (213)",
    regionState: "CA",
    neighborhood: "Glassell Park",
    title: "Lucas Bennett",
    subtitle: "Indie & post-punk pick bass",
    seekingOrOffer: "Looking for Eastside indie rock, post-punk, or dream-pop groups in need of melodic driving basslines.",
    genres: ["Indie Rock","Post-Punk","New Wave"],
    tags: ["P-Bass","Pick Bass","Glassell Park","Chorus"],
    bio: "29-year-old bassist who loves Peter Hook / Kim Deal-inspired melodic low-mid basslines with flatwound punch and subtle chorus shimmer.",
    gearOrBackline: "Fender Precision Bass Black/Tort, Ampeg PF-500 + 210AV, Electro-Harmonix Small Clone, SansAmp Bass Driver",
    gearLocker: [
          {
                "id": "la-14-lucas-bennett-g1",
                "category": "Instruments",
                "name": "Fender American P-Bass",
                "notes": "Black w/ tort guard, LaBella flats"
          },
          {
                "id": "la-14-lucas-bennett-g2",
                "category": "Amps & Cabs",
                "name": "Ampeg Portaflex PF-500 + 210AV",
                "notes": "Classic gritty midrange thump"
          },
          {
                "id": "la-14-lucas-bennett-g3",
                "category": "Pedals & Synth",
                "name": "EHX Small Clone & SansAmp DI",
                "notes": "Wide post-punk chorus bite"
          }
    ],
    availability: "Tue & Thu nights",
    visualSeed: 24,
    portraitUrl: `${LA_MEDIA_BASE}/la-14-lucas-bennett.webp`,
    portraitAlt: "Lucas Bennett playing a black Fender Precision Bass with a pick in Glassell Park.",
    clips: [
      {
        id: "la-14-lucas-bennett-clip-1",
        title: "Glassell Park pick-bass hook",
        kind: 'video',
        embedUrl: `${LA_MEDIA_BASE}/la-14-lucas-bennett.mp4`,
        embedProvider: 'direct',
        posterUrl: `${LA_MEDIA_BASE}/la-14-lucas-bennett.webp`,
        durationSec: 8,
      },
    ],
    featuredClipId: "la-14-lucas-bennett-clip-1",
    profileStyle: {
          "themeId": "zine-mono",
          "moodStatus": "Eastside post-punk & indie bass — ready to rehearse",
          "bannerPattern": "grid",
          "soundsLike": [
                "New Order",
                "Pixies",
                "Fontaines D.C."
          ]
    },
    isPublished: true,
    isUserCreated: false,
    createdAt: 1795656780000,
  },
  {
    id: "la-15-mateo-silva",
    side: "jam",
    roleCategory: "Bassists",
    instruments: ["bass"],
    regionId: "la",
    regionLabel: "Los Angeles (213)",
    regionState: "CA",
    neighborhood: "Long Beach",
    title: "Mateo Silva",
    subtitle: "Dub, reggae & Latin-groove fingerstyle bass",
    seekingOrOffer: "Looking for Long Beach / South Bay / LA bands playing cumbia, dub, psych-Latin, or warm deep-pocket grooves.",
    genres: ["Dub","Cumbia","Psych-Latin"],
    tags: ["Jazz Bass","Deep Pocket","Long Beach","Dub"],
    bio: "22-year-old Long Beach bassist locked into sub-heavy neck-pickup thump, cumbia syncopation, and spacious dub drops. Play steady and serve the pocket every bar.",
    gearOrBackline: "Fender Player Jazz Bass 3-Color Sunburst, Aguilar AG700, Boss OC-5 Octave, Peterson StroboStomp",
    gearLocker: [
          {
                "id": "la-15-mateo-silva-g1",
                "category": "Instruments",
                "name": "Fender Jazz Bass Sunburst",
                "notes": "Tone rolled back for warm sub punch"
          },
          {
                "id": "la-15-mateo-silva-g2",
                "category": "Amps & Cabs",
                "name": "Aguilar AG700 Head",
                "notes": "Big clean low-end weight"
          },
          {
                "id": "la-15-mateo-silva-g3",
                "category": "Pedals & Synth",
                "name": "Boss OC-5 Octave",
                "notes": "Sub-octave dub drops"
          }
    ],
    availability: "Fri afternoons & Weekends",
    visualSeed: 25,
    portraitUrl: `${LA_MEDIA_BASE}/la-15-mateo-silva.webp`,
    portraitAlt: "Mateo Silva playing a Sunburst Fender Jazz Bass in a breezy Long Beach room.",
    clips: [
      {
        id: "la-15-mateo-silva-clip-1",
        title: "Long Beach sub-pocket groove",
        kind: 'video',
        embedUrl: `${LA_MEDIA_BASE}/la-15-mateo-silva.mp4`,
        embedProvider: 'direct',
        posterUrl: `${LA_MEDIA_BASE}/la-15-mateo-silva.webp`,
        durationSec: 8,
      },
    ],
    featuredClipId: "la-15-mateo-silva-clip-1",
    profileStyle: {
          "themeId": "emerald-club",
          "moodStatus": "Heavy low-end & cumbia/dub grooves in LBC or LA",
          "bannerPattern": "waves",
          "soundsLike": [
                "Chicano Batman",
                "Thee Sacred Souls",
                "Kikagaku Moyo"
          ]
    },
    isPublished: true,
    isUserCreated: false,
    createdAt: 1795656840000,
  },
  {
    id: "la-16-priya-nair",
    side: "jam",
    roleCategory: "Bassists",
    instruments: ["bass","synth"],
    regionId: "la",
    regionLabel: "Los Angeles (213)",
    regionState: "CA",
    neighborhood: "Mar Vista",
    title: "Priya Nair",
    subtitle: "Short-scale R&B bass & synth-bass",
    seekingOrOffer: "Looking for LA pop, alt-R&B, or electro-soul projects needing tight pocket bass + Moog sub synth doubling.",
    genres: ["Alt-R&B","Synth-Pop","Neo-Soul"],
    tags: ["Mustang Bass","Moog Sub","Mar Vista","Pocket"],
    bio: "30-year-old bassist covering short-scale Fender Mustang muted grooves and Moog Sub Phatty key-bass parts seamlessly for modern live bands.",
    gearOrBackline: "Fender Mustang Bass PJ Olympic White, Moog Subsequent 25, Noble Preamp DI, Aguilar DB112",
    gearLocker: [
          {
                "id": "la-16-priya-nair-g1",
                "category": "Instruments",
                "name": "Fender Mustang Bass Olympic White",
                "notes": "Short-scale foam mute warmth"
          },
          {
                "id": "la-16-priya-nair-g2",
                "category": "Pedals & Synth",
                "name": "Moog Subsequent 25",
                "notes": "Analog key-bass doubling live"
          },
          {
                "id": "la-16-priya-nair-g3",
                "category": "Amps & Cabs",
                "name": "Aguilar DB112 + Noble DI",
                "notes": "Warm studio-grade DI & stage cab"
          }
    ],
    availability: "Wed nights & Sun afternoons",
    visualSeed: 26,
    portraitUrl: `${LA_MEDIA_BASE}/la-16-priya-nair.webp`,
    portraitAlt: "Priya Nair playing an Olympic White Fender Mustang Bass in her Mar Vista studio.",
    clips: [
      {
        id: "la-16-priya-nair-clip-1",
        title: "Mar Vista muted R&B bass",
        kind: 'video',
        embedUrl: `${LA_MEDIA_BASE}/la-16-priya-nair.mp4`,
        embedProvider: 'direct',
        posterUrl: `${LA_MEDIA_BASE}/la-16-priya-nair.webp`,
        durationSec: 8,
      },
    ],
    featuredClipId: "la-16-priya-nair-clip-1",
    profileStyle: {
          "themeId": "synth-violet",
          "moodStatus": "Mustang PJ + analog Moog bass ready for Westside sets",
          "bannerPattern": "bars",
          "soundsLike": [
                "Little Dragon",
                "Hiatus Kaiyote",
                "Anderson .Paak"
          ]
    },
    isPublished: true,
    isUserCreated: false,
    createdAt: 1795656900000,
  },
  {
    id: "la-17-andre-washington",
    side: "jam",
    roleCategory: "Bassists",
    instruments: ["bass","strings"],
    regionId: "la",
    regionLabel: "Los Angeles (213)",
    regionState: "CA",
    neighborhood: "Leimert Park",
    title: "Andre Washington",
    subtitle: "Upright jazz & acoustic soul bassist",
    seekingOrOffer: "Available for Leimert Park / South LA / Downtown jazz trios, singer-songwriters, and acoustic soul gigs.",
    genres: ["Jazz","Soul","Folk"],
    tags: ["Upright Bass","Jazz","Leimert Park","Acoustic"],
    bio: "38-year-old upright and electric bassist anchored in walking jazz lines, woody pizzicato swing, and bowed chamber accents. Clean sight-reading and deep ear.",
    gearOrBackline: "1950s German Carved 3/4 Upright Bass, Realist Copperhead Pickup, Acoustic Image Clarus, Thomastik Spirocore",
    gearLocker: [
          {
                "id": "la-17-andre-washington-g1",
                "category": "Instruments",
                "name": "Carved 3/4 Upright Double Bass",
                "notes": "Thomastik Spirocore medium strings"
          },
          {
                "id": "la-17-andre-washington-g2",
                "category": "Amps & Cabs",
                "name": "Acoustic Image Clarus + Realist",
                "notes": "Transparent acoustic amplification"
          }
    ],
    availability: "Evenings & weekend brunch/club gigs",
    visualSeed: 27,
    portraitUrl: `${LA_MEDIA_BASE}/la-17-andre-washington.webp`,
    portraitAlt: "Andre Washington playing a 3/4 upright double bass in a warm Leimert Park studio.",
    clips: [
      {
        id: "la-17-andre-washington-clip-1",
        title: "Leimert Park walking line",
        kind: 'video',
        embedUrl: `${LA_MEDIA_BASE}/la-17-andre-washington.mp4`,
        embedProvider: 'direct',
        posterUrl: `${LA_MEDIA_BASE}/la-17-andre-washington.webp`,
        durationSec: 8,
      },
    ],
    featuredClipId: "la-17-andre-washington-clip-1",
    profileStyle: {
          "themeId": "midnight-vinyl",
          "moodStatus": "Walking upright jazz & acoustic soul in Leimert Park",
          "bannerPattern": "vinyl",
          "soundsLike": [
                "Samara Joy Trio",
                "Christian McBride",
                "Bill Withers"
          ]
    },
    isPublished: true,
    isUserCreated: false,
    createdAt: 1795656960000,
  },
  {
    id: "la-18-zoe-lin",
    side: "jam",
    roleCategory: "Vocalists",
    instruments: ["vocals","keys"],
    regionId: "la",
    regionLabel: "Los Angeles (213)",
    regionState: "CA",
    neighborhood: "Los Feliz",
    title: "Zoe Lin",
    subtitle: "Dream-pop & indie lead vocalist",
    seekingOrOffer: "Looking for an Eastside producer, guitarist, or indie synth-pop band seeking airy lead vocals and toplines.",
    genres: ["Dream-Pop","Indie Pop","Shoegaze"],
    tags: ["Vocals","Topliner","Los Feliz","SM7B"],
    bio: "22-year-old vocalist and topliner based in Los Feliz. Comfortable double-tracking lush breathy harmonies, writing vocal hooks fast on demos, and gigging live with subtle vocal delay.",
    gearOrBackline: "Shure SM7B + Cloudlifter, Sony MDR-7506, Universal Audio Volt 276, TC Helicon EchoTap",
    gearLocker: [
          {
                "id": "la-18-zoe-lin-g1",
                "category": "Mics & Studio",
                "name": "Shure SM7B on Rode PSA1 boom",
                "notes": "Warm broadcast & indie vocal presence"
          },
          {
                "id": "la-18-zoe-lin-g2",
                "category": "Mics & Studio",
                "name": "UA Volt 276 + Sony MDR-7506",
                "notes": "Bedroom vocal tracking chain"
          }
    ],
    availability: "Tue, Thu & Sun afternoons",
    visualSeed: 28,
    portraitUrl: `${LA_MEDIA_BASE}/la-18-zoe-lin.webp`,
    portraitAlt: "Zoe Lin singing closely into a Shure SM7B microphone in her Los Feliz bedroom studio.",
    clips: [
      {
        id: "la-18-zoe-lin-clip-1",
        title: "Bedroom vocal take",
        kind: 'video',
        embedUrl: `${LA_MEDIA_BASE}/la-18-zoe-lin.mp4`,
        embedProvider: 'direct',
        posterUrl: `${LA_MEDIA_BASE}/la-18-zoe-lin.webp`,
        durationSec: 8,
      },
    ],
    featuredClipId: "la-18-zoe-lin-clip-1",
    profileStyle: {
          "themeId": "synth-violet",
          "moodStatus": "Writing airy indie hooks — open for Eastside collabs",
          "bannerPattern": "waves",
          "soundsLike": [
                "Clairo",
                "Men I Trust",
                "Cocteau Twins"
          ]
    },
    isPublished: true,
    isUserCreated: false,
    createdAt: 1795657020000,
  },
  {
    id: "la-19-caleb-monroe",
    side: "jam",
    roleCategory: "Vocalists",
    instruments: ["vocals"],
    regionId: "la",
    regionLabel: "Los Angeles (213)",
    regionState: "CA",
    neighborhood: "Inglewood",
    title: "Caleb Monroe",
    subtitle: "Neo-soul & alt-R&B tenor vocalist",
    seekingOrOffer: "Seeking a live LA R&B/neo-soul rhythm section or beatmaker-producer for original EPs and showcase nights.",
    genres: ["Alt-R&B","Neo-Soul","R&B"],
    tags: ["Vocals","Tenor","Inglewood","Neo-Soul"],
    bio: "26-year-old Inglewood vocalist raised singing choir harmonies, stacking clean falsetto phrasing with warm chest-voice runs. Ready to step straight onto live showcases or cut vocal stacks.",
    gearOrBackline: "Neumann TLM 103, Warm Audio WA73-EQ, Shure SE535 In-Ears, Beyer DT770",
    gearLocker: [
          {
                "id": "la-19-caleb-monroe-g1",
                "category": "Mics & Studio",
                "name": "Neumann TLM 103 + Stedman Pop Filter",
                "notes": "Silky detailed top-end R&B chain"
          },
          {
                "id": "la-19-caleb-monroe-g2",
                "category": "Mics & Studio",
                "name": "Warm Audio WA73 Preamp",
                "notes": "Punchy Neve-style midrange"
          }
    ],
    availability: "Evenings after 6pm & Saturdays",
    visualSeed: 29,
    portraitUrl: `${LA_MEDIA_BASE}/la-19-caleb-monroe.webp`,
    portraitAlt: "Caleb Monroe singing into a Neumann condenser mic with pop filter in Inglewood.",
    clips: [
      {
        id: "la-19-caleb-monroe-clip-1",
        title: "Unaccompanied R&B vocal run",
        kind: 'video',
        embedUrl: `${LA_MEDIA_BASE}/la-19-caleb-monroe.mp4`,
        embedProvider: 'direct',
        posterUrl: `${LA_MEDIA_BASE}/la-19-caleb-monroe.webp`,
        durationSec: 8,
      },
    ],
    featuredClipId: "la-19-caleb-monroe-clip-1",
    profileStyle: {
          "themeId": "tube-amber",
          "moodStatus": "Ready to track R&B features or front a live Inglewood band",
          "bannerPattern": "bars",
          "soundsLike": [
                "Giveon",
                "Lucky Daye",
                "Frank Ocean"
          ]
    },
    isPublished: true,
    isUserCreated: false,
    createdAt: 1795657080000,
  },
  {
    id: "la-20-sofia-morales",
    side: "jam",
    roleCategory: "Vocalists",
    instruments: ["vocals"],
    regionId: "la",
    regionLabel: "Los Angeles (213)",
    regionState: "CA",
    neighborhood: "Eagle Rock",
    title: "Sofia Morales",
    subtitle: "Alt-rock & garage frontwoman",
    seekingOrOffer: "Looking to front or co-write with an established alt-rock, post-punk, or punk-pop band in Eagle Rock / NELA.",
    genres: ["Alt-Rock","Garage Rock","Punk"],
    tags: ["Frontperson","Eagle Rock","SM58","High Energy"],
    bio: "24-year-old frontwoman with grit, pitch control, and zero fear of noisy rooms. Love big chorus melodies layered over fuzzy guitars and tight snare pockets.",
    gearOrBackline: "Shure Beta 58A, Shure PSM300 IEM pack, Boss VE-20 Vocal Performer",
    gearLocker: [
          {
                "id": "la-20-sofia-morales-g1",
                "category": "Mics & Studio",
                "name": "Shure Beta 58A Dynamic Mic",
                "notes": "Cuts cleanly over loud stacks live"
          },
          {
                "id": "la-20-sofia-morales-g2",
                "category": "Pedals & Synth",
                "name": "Shure PSM300 In-Ear Pack",
                "notes": "Club & rehearsal reliability"
          }
    ],
    availability: "Wed nights & weekends",
    visualSeed: 30,
    portraitUrl: `${LA_MEDIA_BASE}/la-20-sofia-morales.webp`,
    portraitAlt: "Sofia Morales singing on an SM58 in a brick Eagle Rock rehearsal space.",
    clips: [
      {
        id: "la-20-sofia-morales-clip-1",
        title: "Eagle Rock raw vocal take",
        kind: 'video',
        embedUrl: `${LA_MEDIA_BASE}/la-20-sofia-morales.mp4`,
        embedProvider: 'direct',
        posterUrl: `${LA_MEDIA_BASE}/la-20-sofia-morales.webp`,
        durationSec: 8,
      },
    ],
    featuredClipId: "la-20-sofia-morales-clip-1",
    profileStyle: {
          "themeId": "stage-coral",
          "moodStatus": "Ready to front loud alt-rock & post-punk sets NELA",
          "bannerPattern": "grid",
          "soundsLike": [
                "Yeah Yeah Yeahs",
                "Amyl and the Sniffers",
                "Paramore"
          ]
    },
    isPublished: true,
    isUserCreated: false,
    createdAt: 1795657140000,
  },
  {
    id: "la-21-eli-goldman",
    side: "jam",
    roleCategory: "Vocalists",
    instruments: ["vocals","guitar"],
    regionId: "la",
    regionLabel: "Los Angeles (213)",
    regionState: "CA",
    neighborhood: "Venice",
    title: "Eli Goldman",
    subtitle: "Soulful indie-folk & rock baritone",
    seekingOrOffer: "Looking to collaborate with Westside indie, Americana, or blues-soul players needing a gritty warm baritone lead.",
    genres: ["Indie Folk","Indie Rock","Blues-Soul"],
    tags: ["Baritone","Venice","Indie Folk","Session"],
    bio: "29-year-old baritone vocalist and rhythm player based in Venice. Drawn to unadorned melody, ragged harmony stacks, and songs that hit hard even when stripped down.",
    gearOrBackline: "Warm Audio WA-47jr, Apollo Solo, Fender Acoustasonic Jazzmaster",
    gearLocker: [
          {
                "id": "la-21-eli-goldman-g1",
                "category": "Mics & Studio",
                "name": "Warm Audio WA-47jr FET Condenser",
                "notes": "Warm low-mid baritone clarity"
          },
          {
                "id": "la-21-eli-goldman-g2",
                "category": "Mics & Studio",
                "name": "Universal Audio Apollo Solo",
                "notes": "Low-latency Unison preamps"
          }
    ],
    availability: "Mon & Thu evenings, Sat mornings",
    visualSeed: 31,
    portraitUrl: `${LA_MEDIA_BASE}/la-21-eli-goldman.webp`,
    portraitAlt: "Eli Goldman singing into a condenser mic in a bright white Venice studio.",
    clips: [
      {
        id: "la-21-eli-goldman-clip-1",
        title: "Venice daylight vocal check",
        kind: 'video',
        embedUrl: `${LA_MEDIA_BASE}/la-21-eli-goldman.mp4`,
        embedProvider: 'direct',
        posterUrl: `${LA_MEDIA_BASE}/la-21-eli-goldman.webp`,
        durationSec: 8,
      },
    ],
    featuredClipId: "la-21-eli-goldman-clip-1",
    profileStyle: {
          "themeId": "emerald-club",
          "moodStatus": "Westside indie/folk vocals — open to acoustic or full band",
          "bannerPattern": "vinyl",
          "soundsLike": [
                "Alabama Shakes",
                "Bon Iver",
                "Ben Howard"
          ]
    },
    isPublished: true,
    isUserCreated: false,
    createdAt: 1795657200000,
  },
  {
    id: "la-22-naomi-carter",
    side: "jam",
    roleCategory: "Vocalists",
    instruments: ["vocals"],
    regionId: "la",
    regionLabel: "Los Angeles (213)",
    regionState: "CA",
    neighborhood: "Baldwin Hills",
    title: "Naomi Carter",
    subtitle: "Gospel, classic soul & session harmony vocals",
    seekingOrOffer: "Available for LA studio background vocal stacks, soul bands, and live R&B frontwoman seats.",
    genres: ["Soul","Gospel","R&B"],
    tags: ["Soul Vocals","Harmonies","Baldwin Hills","Session"],
    bio: "34-year-old vocalist with deep gospel roots and surgical three-part harmony instincts. Fast in the studio, big warm tone live, zero divas.",
    gearOrBackline: "AKG C414 XLII, Focusrite ISA One, Sennheiser e935 Stage Mic",
    gearLocker: [
          {
                "id": "la-22-naomi-carter-g1",
                "category": "Mics & Studio",
                "name": "AKG C414 XLII Condenser",
                "notes": "Airy sheen on soul & stacked harmonies"
          },
          {
                "id": "la-22-naomi-carter-g2",
                "category": "Mics & Studio",
                "name": "Focusrite ISA One + Sennheiser e935",
                "notes": "Studio tracking & live handheld"
          }
    ],
    availability: "Thu evenings & Weekends",
    visualSeed: 32,
    portraitUrl: `${LA_MEDIA_BASE}/la-22-naomi-carter.webp`,
    portraitAlt: "Naomi Carter singing into an AKG C414 in her warm Baldwin Hills studio.",
    clips: [
      {
        id: "la-22-naomi-carter-clip-1",
        title: "Baldwin Hills soul phrase",
        kind: 'video',
        embedUrl: `${LA_MEDIA_BASE}/la-22-naomi-carter.mp4`,
        embedProvider: 'direct',
        posterUrl: `${LA_MEDIA_BASE}/la-22-naomi-carter.webp`,
        durationSec: 8,
      },
    ],
    featuredClipId: "la-22-naomi-carter-clip-1",
    profileStyle: {
          "themeId": "tube-amber",
          "moodStatus": "Booking vocal stack sessions & live LA soul bands",
          "bannerPattern": "vinyl",
          "soundsLike": [
                "H.E.R.",
                "Tori Kelly",
                "Leon Bridges"
          ]
    },
    isPublished: true,
    isUserCreated: false,
    createdAt: 1795657260000,
  },
  {
    id: "la-23-noah-kim",
    side: "jam",
    roleCategory: "Keys & Synth",
    instruments: ["synth","keys"],
    regionId: "la",
    regionLabel: "Los Angeles (213)",
    regionState: "CA",
    neighborhood: "Koreatown",
    title: "Noah Kim",
    subtitle: "Analog synth & indie synth-pop keys",
    seekingOrOffer: "Looking for K-Town / Silver Lake indie electronic, synth-pop, or nu-disco bands needing Prophet-6 textures and hooks.",
    genres: ["Synth-Pop","Indie Electronic","Dream-Pop"],
    tags: ["Prophet-6","Analog Synth","Koreatown","Arps"],
    bio: "24-year-old synth player obsessed with warm analog brass pads, resonant filter sweeps, and clocked arpeggiator hooks that fit naturally inside a live band.",
    gearOrBackline: "Sequential Prophet-6, Roland Juno-106, Strymon BigSky, Radial ProD2 Stereo DI",
    gearLocker: [
          {
                "id": "la-23-noah-kim-g1",
                "category": "Pedals & Synth",
                "name": "Sequential Prophet-6 (49-key)",
                "notes": "Warm VCO analog pads & basslines"
          },
          {
                "id": "la-23-noah-kim-g2",
                "category": "Pedals & Synth",
                "name": "Strymon BigSky + Radial ProD2",
                "notes": "Stereo lush reverbs straight to PA"
          }
    ],
    availability: "Mon, Wed & Fri evenings",
    visualSeed: 33,
    portraitUrl: `${LA_MEDIA_BASE}/la-23-noah-kim.webp`,
    portraitAlt: "Noah Kim sweeping filters on a Sequential Prophet-6 synth in Koreatown.",
    clips: [
      {
        id: "la-23-noah-kim-clip-1",
        title: "Late-night Prophet-6 chords",
        kind: 'video',
        embedUrl: `${LA_MEDIA_BASE}/la-23-noah-kim.mp4`,
        embedProvider: 'direct',
        posterUrl: `${LA_MEDIA_BASE}/la-23-noah-kim.webp`,
        durationSec: 8,
      },
    ],
    featuredClipId: "la-23-noah-kim-clip-1",
    profileStyle: {
          "themeId": "synth-violet",
          "moodStatus": "Dialing Prophet-6 patches in K-Town — hit me up",
          "bannerPattern": "grid",
          "soundsLike": [
                "Tame Impala",
                "Chromeo",
                "Toro y Moi"
          ]
    },
    isPublished: true,
    isUserCreated: false,
    createdAt: 1795657320000,
  },
  {
    id: "la-24-claire-dupont",
    side: "jam",
    roleCategory: "Keys & Synth",
    instruments: ["keys"],
    regionId: "la",
    regionLabel: "Los Angeles (213)",
    regionState: "CA",
    neighborhood: "Silver Lake",
    title: "Claire Dupont",
    subtitle: "Rhodes, Wurlitzer & neo-soul keys",
    seekingOrOffer: "Looking for laid-back Silver Lake jazz-soul, R&B, or indie projects where vintage electric piano is front and center.",
    genres: ["Neo-Soul","Jazz-Funk","Indie Soul"],
    tags: ["Fender Rhodes","Wurlitzer","Silver Lake","Pocket"],
    bio: "28-year-old keyboardist anchored in 70s Fender Rhodes bell tones, subtle tremolo vibrato, and comping behind singers without overplaying.",
    gearOrBackline: "1976 Fender Rhodes Mark I Stage 73, Wurlitzer 200A, Fender Twin Reverb, Roland Space Echo RE-20",
    gearLocker: [
          {
                "id": "la-24-claire-dupont-g1",
                "category": "Instruments",
                "name": "1976 Fender Rhodes Mark I (73-key)",
                "notes": "Warm tine bell chime & suitcase tremolo"
          },
          {
                "id": "la-24-claire-dupont-g2",
                "category": "Amps & Cabs",
                "name": "Fender '65 Twin Reverb",
                "notes": "Classic warm stage sparkle"
          },
          {
                "id": "la-24-claire-dupont-g3",
                "category": "Pedals & Synth",
                "name": "Boss RE-20 Space Echo",
                "notes": "Warm tape flutter"
          }
    ],
    availability: "Tue evenings & Sunday afternoons",
    visualSeed: 34,
    portraitUrl: `${LA_MEDIA_BASE}/la-24-claire-dupont.webp`,
    portraitAlt: "Claire Dupont playing a vintage Fender Rhodes Mark I in a sunlit Silver Lake room.",
    clips: [
      {
        id: "la-24-claire-dupont-clip-1",
        title: "Silver Lake Rhodes chords",
        kind: 'video',
        embedUrl: `${LA_MEDIA_BASE}/la-24-claire-dupont.mp4`,
        embedProvider: 'direct',
        posterUrl: `${LA_MEDIA_BASE}/la-24-claire-dupont.webp`,
        durationSec: 8,
      },
    ],
    featuredClipId: "la-24-claire-dupont-clip-1",
    profileStyle: {
          "themeId": "tube-amber",
          "moodStatus": "Rhodes Mark I set up at home — Silver Lake jams welcome",
          "bannerPattern": "waves",
          "soundsLike": [
                "Moonchild",
                "Herbie Hancock",
                "Cleo Sol"
          ]
    },
    isPublished: true,
    isUserCreated: false,
    createdAt: 1795657380000,
  },
  {
    id: "la-25-malik-brooks",
    side: "jam",
    roleCategory: "Keys & Synth",
    instruments: ["keys"],
    regionId: "la",
    regionLabel: "Los Angeles (213)",
    regionState: "CA",
    neighborhood: "Mid-Wilshire",
    title: "Malik Brooks",
    subtitle: "Gospel organ, Clav & funk keys",
    seekingOrOffer: "Available for paid LA live soul/R&B bands, festival sub gigs, and Mid-City funk rehearsals.",
    genres: ["Gospel","Funk","R&B"],
    tags: ["Nord Stage","Organ","Mid-Wilshire","Chops"],
    bio: "25-year-old keyboardist equally comfortable pumping greasy drawbar B3 swells, biting Clavinet comps, and modern gospel reharms. Sight-reads Nashville numbers and charts.",
    gearOrBackline: "Nord Stage 4 73 Compact, Neo Instruments Ventilator II, QSC K10.2 Stage Wedge",
    gearLocker: [
          {
                "id": "la-25-malik-brooks-g1",
                "category": "Instruments",
                "name": "Nord Stage 4 Compact 73",
                "notes": "Waterfall organ action + B3 drawbars"
          },
          {
                "id": "la-25-malik-brooks-g2",
                "category": "Pedals & Synth",
                "name": "Neo Ventilator II Leslie Pedal",
                "notes": "True rotary speaker swirl"
          },
          {
                "id": "la-25-malik-brooks-g3",
                "category": "PA & Backline",
                "name": "QSC K10.2 Stereo Pair",
                "notes": "Punchy stage monitoring"
          }
    ],
    availability: "Evenings after 7pm & Weekends",
    visualSeed: 35,
    portraitUrl: `${LA_MEDIA_BASE}/la-25-malik-brooks.webp`,
    portraitAlt: "Malik Brooks playing gospel organ swells on a red Nord Stage in Mid-Wilshire.",
    clips: [
      {
        id: "la-25-malik-brooks-clip-1",
        title: "Mid-Wilshire gospel B3 swells",
        kind: 'video',
        embedUrl: `${LA_MEDIA_BASE}/la-25-malik-brooks.mp4`,
        embedProvider: 'direct',
        posterUrl: `${LA_MEDIA_BASE}/la-25-malik-brooks.webp`,
        durationSec: 8,
      },
    ],
    featuredClipId: "la-25-malik-brooks-clip-1",
    profileStyle: {
          "themeId": "stage-coral",
          "moodStatus": "Gospel organ & funk pockets open in Mid-Wilshire",
          "bannerPattern": "bars",
          "soundsLike": [
                "Cory Henry",
                "Snarky Puppy",
                "Patti LaBelle"
          ]
    },
    isPublished: true,
    isUserCreated: false,
    createdAt: 1795657440000,
  },
  {
    id: "la-26-elena-vargas",
    side: "jam",
    roleCategory: "Keys & Synth",
    instruments: ["keys"],
    regionId: "la",
    regionLabel: "Los Angeles (213)",
    regionState: "CA",
    neighborhood: "Atwater Village",
    title: "Elena Vargas",
    subtitle: "Felt upright piano & ambient indie keys",
    seekingOrOffer: "Looking for Atwater / Frogtown indie-folk, chamber-pop, or film-ish indie groups needing upright piano and harmonies.",
    genres: ["Chamber Pop","Indie Folk","Ambient"],
    tags: ["Upright Piano","Felt Piano","Atwater","Harmonies"],
    bio: "21-year-old classically trained pianist leaning into soft felt-damped upright piano motifs and minimalist indie arrangements. Love writing string and piano layers.",
    gearOrBackline: "Baldwin Hamilton Felt Upright Piano, Nord Electro 6D 73, EarthQuaker Avalanche Run",
    gearLocker: [
          {
                "id": "la-26-elena-vargas-g1",
                "category": "Instruments",
                "name": "Baldwin Upright w/ Mute Felt",
                "notes": "Intimate warm damped acoustic tone"
          },
          {
                "id": "la-26-elena-vargas-g2",
                "category": "Instruments",
                "name": "Nord Electro 6D 73",
                "notes": "Lightweight gigging piano + mellotron"
          }
    ],
    availability: "Mon, Tue & Sun afternoons",
    visualSeed: 36,
    portraitUrl: `${LA_MEDIA_BASE}/la-26-elena-vargas.webp`,
    portraitAlt: "Elena Vargas playing an upright acoustic piano in a bright Atwater Village home.",
    clips: [
      {
        id: "la-26-elena-vargas-clip-1",
        title: "Atwater felt piano sketch",
        kind: 'video',
        embedUrl: `${LA_MEDIA_BASE}/la-26-elena-vargas.mp4`,
        embedProvider: 'direct',
        posterUrl: `${LA_MEDIA_BASE}/la-26-elena-vargas.webp`,
        durationSec: 8,
      },
    ],
    featuredClipId: "la-26-elena-vargas-clip-1",
    profileStyle: {
          "themeId": "emerald-club",
          "moodStatus": "Writing sparse upright piano & vocal sketches in Atwater",
          "bannerPattern": "waves",
          "soundsLike": [
                "Phoebe Bridgers",
                "Nils Frahm",
                "Big Thief"
          ]
    },
    isPublished: true,
    isUserCreated: false,
    createdAt: 1795657500000,
  },
  {
    id: "la-27-samir-patel",
    side: "jam",
    roleCategory: "Keys & Synth",
    instruments: ["keys","synth"],
    regionId: "la",
    regionLabel: "Los Angeles (213)",
    regionState: "CA",
    neighborhood: "Santa Monica",
    title: "Samir Patel",
    subtitle: "Jazz piano, synth brass & fusion keys",
    seekingOrOffer: "Seeking Westside jazz quintets, funk-fusion collectives, and studio tracking gigs.",
    genres: ["Jazz Fusion","Modern Jazz","Funk"],
    tags: ["Yamaha CP88","Jazz Keys","Santa Monica","Fusion"],
    bio: "35-year-old pianist bridging acoustic jazz comping, McCoy-style quartal voicings, and fusion synth leads. Solid chart reader and rehearsal organizer.",
    gearOrBackline: "Yamaha CP88 Stage Piano, Sequential Take 5, Radial Stereo Key-Largo",
    gearLocker: [
          {
                "id": "la-27-samir-patel-g1",
                "category": "Instruments",
                "name": "Yamaha CP88 Stage Piano",
                "notes": "Graded wooden hammer feel + CFX grand"
          },
          {
                "id": "la-27-samir-patel-g2",
                "category": "Pedals & Synth",
                "name": "Sequential Take 5 Compact",
                "notes": "Expressive lead & fusion pads"
          }
    ],
    availability: "Tue & Thu evenings",
    visualSeed: 37,
    portraitUrl: `${LA_MEDIA_BASE}/la-27-samir-patel.webp`,
    portraitAlt: "Samir Patel playing jazz chords on a Yamaha CP88 in his Santa Monica home studio.",
    clips: [
      {
        id: "la-27-samir-patel-clip-1",
        title: "Santa Monica jazz voicings",
        kind: 'video',
        embedUrl: `${LA_MEDIA_BASE}/la-27-samir-patel.mp4`,
        embedProvider: 'direct',
        posterUrl: `${LA_MEDIA_BASE}/la-27-samir-patel.webp`,
        durationSec: 8,
      },
    ],
    featuredClipId: "la-27-samir-patel-clip-1",
    profileStyle: {
          "themeId": "midnight-vinyl",
          "moodStatus": "Looking for Westside horn/rhythm players for fusion sets",
          "bannerPattern": "vinyl",
          "soundsLike": [
                "Chick Corea",
                "Kiefer",
                "Domi & JD Beck"
          ]
    },
    isPublished: true,
    isUserCreated: false,
    createdAt: 1795657560000,
  },
  {
    id: "la-28-miles-benjamin",
    side: "jam",
    roleCategory: "Horns & Strings",
    instruments: ["horns"],
    regionId: "la",
    regionLabel: "Los Angeles (213)",
    regionState: "CA",
    neighborhood: "Leimert Park",
    title: "Miles Benjamin",
    subtitle: "Tenor sax for jazz, funk & indie horns",
    seekingOrOffer: "Looking for horn sections, funk/soul bands, jazz combos, and indie studio sessions across South LA & Eastside.",
    genres: ["Jazz","Funk","Indie Soul"],
    tags: ["Tenor Sax","Selmer","Leimert Park","Horns"],
    bio: "27-year-old tenor saxophonist with warm smoky lower register and punchy staccato horn-section chops. Equally happy blowing free over changes or doubling tight horn lines.",
    gearOrBackline: "Selmer Mark VI Tenor Sax, Otto Link Tone Edge 7*, Beyerdynamic M160 / Clip Mic",
    gearLocker: [
          {
                "id": "la-28-miles-benjamin-g1",
                "category": "Instruments",
                "name": "Selmer Mark VI Tenor Saxophone",
                "notes": "Warm vintage brass resonance"
          },
          {
                "id": "la-28-miles-benjamin-g2",
                "category": "Mics & Studio",
                "name": "DPA 4099 Core Sax Clip + M160",
                "notes": "Feedback-free club mic + ribbon"
          }
    ],
    availability: "Tue, Fri evenings & Sundays",
    visualSeed: 38,
    portraitUrl: `${LA_MEDIA_BASE}/la-28-miles-benjamin.webp`,
    portraitAlt: "Miles Benjamin playing a vintage brass tenor saxophone in Leimert Park.",
    clips: [
      {
        id: "la-28-miles-benjamin-clip-1",
        title: "Leimert Park tenor warm-up",
        kind: 'video',
        embedUrl: `${LA_MEDIA_BASE}/la-28-miles-benjamin.mp4`,
        embedProvider: 'direct',
        posterUrl: `${LA_MEDIA_BASE}/la-28-miles-benjamin.webp`,
        durationSec: 8,
      },
    ],
    featuredClipId: "la-28-miles-benjamin-clip-1",
    profileStyle: {
          "themeId": "tube-amber",
          "moodStatus": "Available for horn sections, jazz trios & studio hooks",
          "bannerPattern": "vinyl",
          "soundsLike": [
                "Kamasi Washington",
                "The Budos Band",
                "Sam Gendel"
          ]
    },
    isPublished: true,
    isUserCreated: false,
    createdAt: 1795657620000,
  },
  {
    id: "la-29-gabriel-reyes",
    side: "jam",
    roleCategory: "Horns & Strings",
    instruments: ["horns"],
    regionId: "la",
    regionLabel: "Los Angeles (213)",
    regionState: "CA",
    neighborhood: "Highland Park",
    title: "Gabriel Reyes",
    subtitle: "Trumpet & flugelhorn for Latin funk & indie",
    seekingOrOffer: "Looking to join Latin-funk, ska/reggae, hip-hop live bands, or indie rock horn arrangements in NELA & DTLA.",
    genres: ["Latin Funk","Indie Rock","Reggae"],
    tags: ["Trumpet","Flugelhorn","Highland Park","Brass"],
    bio: "23-year-old trumpeter with crisp articulation for punchy Latin-funk lines and warm Harmon-muted flugelhorn textures for indie recordings.",
    gearOrBackline: "Bach Stradivarius Model 37 Trumpet, Yamaha Flugelhorn, Jo-Ral Harmon & Straight Mutes",
    gearLocker: [
          {
                "id": "la-29-gabriel-reyes-g1",
                "category": "Instruments",
                "name": "Bach Stradivarius 37 Silver Trumpet",
                "notes": "Focused bright horn-section punch"
          },
          {
                "id": "la-29-gabriel-reyes-g2",
                "category": "Instruments",
                "name": "Yamaha YFH-631G Flugelhorn",
                "notes": "Mellow brass pads & solos"
          }
    ],
    availability: "Mon & Wed nights, Sat afternoons",
    visualSeed: 39,
    portraitUrl: `${LA_MEDIA_BASE}/la-29-gabriel-reyes.webp`,
    portraitAlt: "Gabriel Reyes playing a silver Bach Stradivarius trumpet in Highland Park.",
    clips: [
      {
        id: "la-29-gabriel-reyes-clip-1",
        title: "Highland Park Latin-funk horn",
        kind: 'video',
        embedUrl: `${LA_MEDIA_BASE}/la-29-gabriel-reyes.mp4`,
        embedProvider: 'direct',
        posterUrl: `${LA_MEDIA_BASE}/la-29-gabriel-reyes.webp`,
        durationSec: 8,
      },
    ],
    featuredClipId: "la-29-gabriel-reyes-clip-1",
    profileStyle: {
          "themeId": "stage-coral",
          "moodStatus": "Open for horn hooks, studio tracking & live brass",
          "bannerPattern": "bars",
          "soundsLike": [
                "Antibalas",
                "Chicano Batman",
                "Mac Miller Tiny Desk"
          ]
    },
    isPublished: true,
    isUserCreated: false,
    createdAt: 1795657680000,
  },
  {
    id: "la-30-hannah-choi",
    side: "jam",
    roleCategory: "Horns & Strings",
    instruments: ["strings"],
    regionId: "la",
    regionLabel: "Los Angeles (213)",
    regionState: "CA",
    neighborhood: "Pasadena",
    title: "Hannah Choi",
    subtitle: "Cello for chamber indie & live string hooks",
    seekingOrOffer: "Looking for LA songwriters, chamber-pop bands, and film-indie studio dates needing expressive live cello.",
    genres: ["Chamber Pop","Indie Folk","Acoustic"],
    tags: ["Cello","Pasadena","Strings","Arranging"],
    bio: "26-year-old cellist with conservatory intonation and a love for gritty indie textures, lush pizzicato counter-melodies, and tracking quick string quartets.",
    gearOrBackline: "Full-Size Spruce/Maple Acoustic Cello, David Gage Realist Cello Pickup, Neumann KM 184",
    gearLocker: [
          {
                "id": "la-30-hannah-choi-g1",
                "category": "Instruments",
                "name": "Handcrafted 4/4 Acoustic Cello",
                "notes": "Larson strings, warm focused low C"
          },
          {
                "id": "la-30-hannah-choi-g2",
                "category": "Mics & Studio",
                "name": "David Gage Realist + KM 184",
                "notes": "Live pickup + crisp studio condenser"
          }
    ],
    availability: "Tue & Thu afternoons/evenings",
    visualSeed: 40,
    portraitUrl: `${LA_MEDIA_BASE}/la-30-hannah-choi.webp`,
    portraitAlt: "Hannah Choi bowing an acoustic cello in a bright Pasadena craftsman room.",
    clips: [
      {
        id: "la-30-hannah-choi-clip-1",
        title: "Pasadena chamber cello line",
        kind: 'video',
        embedUrl: `${LA_MEDIA_BASE}/la-30-hannah-choi.mp4`,
        embedProvider: 'direct',
        posterUrl: `${LA_MEDIA_BASE}/la-30-hannah-choi.webp`,
        durationSec: 8,
      },
    ],
    featuredClipId: "la-30-hannah-choi-clip-1",
    profileStyle: {
          "themeId": "emerald-club",
          "moodStatus": "Writing indie cello parts & gigging chamber sets",
          "bannerPattern": "waves",
          "soundsLike": [
                "Andrew Bird",
                "Phoebe Bridgers",
                "Nick Drake"
          ]
    },
    isPublished: true,
    isUserCreated: false,
    createdAt: 1795657740000,
  },
  {
    id: "la-31-liam-oconnor",
    side: "jam",
    roleCategory: "Horns & Strings",
    instruments: ["strings"],
    regionId: "la",
    regionLabel: "Los Angeles (213)",
    regionState: "CA",
    neighborhood: "Eagle Rock",
    title: "Liam O'Connor",
    subtitle: "Violin & fiddle for Americana & indie",
    seekingOrOffer: "Looking to join folk-rock, alt-country, Americana, or string-infused indie bands in Eagle Rock / NELA.",
    genres: ["Americana","Indie Folk","Alt-Country"],
    tags: ["Violin","Fiddle","Eagle Rock","Acoustic"],
    bio: "32-year-old violinist shifting smoothly between gritty Appalachian double-stops, soaring indie string pads, and quick chart tracking.",
    gearOrBackline: "1920s French Workshop Violin, LR Baggs Violin Pickup, Grace Design Felix Preamp",
    gearLocker: [
          {
                "id": "la-31-liam-oconnor-g1",
                "category": "Instruments",
                "name": "Vintage Acoustic Violin + Pernambuc Bow",
                "notes": "Sweet earthy midrange"
          },
          {
                "id": "la-31-liam-oconnor-g2",
                "category": "Pedals & Synth",
                "name": "LR Baggs Pickup + Grace Felix",
                "notes": "Stage-ready acoustic preamp/EQ"
          }
    ],
    availability: "Wed nights & Weekends",
    visualSeed: 41,
    portraitUrl: `${LA_MEDIA_BASE}/la-31-liam-oconnor.webp`,
    portraitAlt: "Liam O'Connor playing a vintage violin in a warm wood garage studio in Eagle Rock.",
    clips: [
      {
        id: "la-31-liam-oconnor-clip-1",
        title: "Eagle Rock fiddle double-stops",
        kind: 'video',
        embedUrl: `${LA_MEDIA_BASE}/la-31-liam-oconnor.mp4`,
        embedProvider: 'direct',
        posterUrl: `${LA_MEDIA_BASE}/la-31-liam-oconnor.webp`,
        durationSec: 8,
      },
    ],
    featuredClipId: "la-31-liam-oconnor-clip-1",
    profileStyle: {
          "themeId": "tube-amber",
          "moodStatus": "Down for alt-country, folk-rock & NELA live gigs",
          "bannerPattern": "vinyl",
          "soundsLike": [
                "Sierra Ferrell",
                "The Lumineers",
                "Fleet Foxes"
          ]
    },
    isPublished: true,
    isUserCreated: false,
    createdAt: 1795657800000,
  },
  {
    id: "la-32-jaylen-scott",
    side: "jam",
    roleCategory: "Producers",
    instruments: ["producer","drums"],
    regionId: "la",
    regionLabel: "Los Angeles (213)",
    regionState: "CA",
    neighborhood: "Fairfax",
    title: "Jaylen Scott",
    subtitle: "MPC beatmaker & boom-bap / hip-hop producer",
    seekingOrOffer: "Looking for LA vocalists, jazz horn players, and bassists to flip live samples and cut tracks in Fairfax.",
    genres: ["Hip-Hop","Neo-Soul","Boom-Bap"],
    tags: ["MPC Live","Beatmaker","Fairfax","Crate Digger"],
    bio: "23-year-old beatmaker chopping dusty vinyl breaks on an Akai MPC alongside live musicians. Big on swung drums, warm SP-404 grit, and letting real players elevate beats.",
    gearOrBackline: "Akai MPC Live II, Roland SP-404MKII, Technics SL-1200MK2, Yamaha HS8 Monitors",
    gearLocker: [
          {
                "id": "la-32-jaylen-scott-g1",
                "category": "Mics & Studio",
                "name": "Akai MPC Live II + SP-404MKII",
                "notes": "16-pad chop & live bus grit"
          },
          {
                "id": "la-32-jaylen-scott-g2",
                "category": "Mics & Studio",
                "name": "Technics SL-1200MK2 + Crate Wall",
                "notes": "Sample & vinyl source rig"
          }
    ],
    availability: "Late evenings & Sundays",
    visualSeed: 42,
    portraitUrl: `${LA_MEDIA_BASE}/la-32-jaylen-scott.webp`,
    portraitAlt: "Jaylen Scott tapping dusty boom-bap beats on an Akai MPC Live II in Fairfax.",
    clips: [
      {
        id: "la-32-jaylen-scott-clip-1",
        title: "MPC Live finger-drum beat",
        kind: 'video',
        embedUrl: `${LA_MEDIA_BASE}/la-32-jaylen-scott.mp4`,
        embedProvider: 'direct',
        posterUrl: `${LA_MEDIA_BASE}/la-32-jaylen-scott.webp`,
        durationSec: 8,
      },
    ],
    featuredClipId: "la-32-jaylen-scott-clip-1",
    profileStyle: {
          "themeId": "midnight-vinyl",
          "moodStatus": "Chopping live horn & bass stems into MPC packs — Fairfax",
          "bannerPattern": "vinyl",
          "soundsLike": [
                "J Dilla",
                "Madlib",
                "Alchemist"
          ]
    },
    isPublished: true,
    isUserCreated: false,
    createdAt: 1795657860000,
  },
  {
    id: "la-33-sienna-ross",
    side: "jam",
    roleCategory: "Producers",
    instruments: ["producer","synth"],
    regionId: "la",
    regionLabel: "Los Angeles (213)",
    regionState: "CA",
    neighborhood: "Arts District",
    title: "Sienna Ross",
    subtitle: "Electronic & Ableton live rig producer",
    seekingOrOffer: "Seeking vocalists, drummers, or electronic instrumentalists around DTLA to build a hybrid live Ableton + hardware show.",
    genres: ["Electronic","House","Alt-Pop"],
    tags: ["Ableton Push","Live Electronics","DTLA","Hybrid"],
    bio: "25-year-old producer designing hybrid Push 3 + analog synth live sets in DTLA. Looking to blend live vocals, acoustic drums, or bass over tight electronic grooves.",
    gearOrBackline: "Ableton Push 3 Standalone, Elektron Digitakt, Neumann KH 120 II, Sennheiser HD650",
    gearLocker: [
          {
                "id": "la-33-sienna-ross-g1",
                "category": "Pedals & Synth",
                "name": "Ableton Push 3 Standalone",
                "notes": "MPE expressive pads + live stems"
          },
          {
                "id": "la-33-sienna-ross-g2",
                "category": "Mics & Studio",
                "name": "Neumann KH 120 II Monitors",
                "notes": "Clinical translation in concrete loft"
          }
    ],
    availability: "Tue, Thu evenings & Saturdays",
    visualSeed: 43,
    portraitUrl: `${LA_MEDIA_BASE}/la-33-sienna-ross.webp`,
    portraitAlt: "Sienna Ross launching live electronic stems on Ableton Push 3 in her DTLA loft.",
    clips: [
      {
        id: "la-33-sienna-ross-clip-1",
        title: "Arts District Push 3 set",
        kind: 'video',
        embedUrl: `${LA_MEDIA_BASE}/la-33-sienna-ross.mp4`,
        embedProvider: 'direct',
        posterUrl: `${LA_MEDIA_BASE}/la-33-sienna-ross.webp`,
        durationSec: 8,
      },
    ],
    featuredClipId: "la-33-sienna-ross-clip-1",
    profileStyle: {
          "themeId": "emerald-club",
          "moodStatus": "Building hybrid DTLA electronic live rig w/ singers & drums",
          "bannerPattern": "grid",
          "soundsLike": [
                "Fred again..",
                "Four Tet",
                "Caribou"
          ]
    },
    isPublished: true,
    isUserCreated: false,
    createdAt: 1795657920000,
  },
  {
    id: "la-34-ethan-park",
    side: "jam",
    roleCategory: "Producers",
    instruments: ["producer","guitar"],
    regionId: "la",
    regionLabel: "Los Angeles (213)",
    regionState: "CA",
    neighborhood: "Burbank",
    title: "Ethan Park",
    subtitle: "Indie tracking & mixing producer",
    seekingOrOffer: "Looking to produce, track, and co-write singles with emerging indie rock, alt-pop, or bedroom artists around Burbank / Eastside.",
    genres: ["Indie Rock","Alt-Pop","Shoegaze"],
    tags: ["Mixing","SSL","Burbank","Co-Writer"],
    bio: "28-year-old engineer/producer with an acoustically treated Burbank tracking room. Focused on getting killer drum/guitar sounds quickly on the floor rather than fixing everything in post.",
    gearOrBackline: "SSL SiX Analog Console, RME UFX II, Coles 4038 Ribbon Pair, Barefoot Footprint02",
    gearLocker: [
          {
                "id": "la-34-ethan-park-g1",
                "category": "Mics & Studio",
                "name": "SSL SiX Desktop Analog Mixer + RME",
                "notes": "Clean British bus compression"
          },
          {
                "id": "la-34-ethan-park-g2",
                "category": "Mics & Studio",
                "name": "Coles 4038 Ribbon Pair + SM7B",
                "notes": "Warm vintage room overheads"
          }
    ],
    availability: "Mon–Fri evenings & Saturdays",
    visualSeed: 44,
    portraitUrl: `${LA_MEDIA_BASE}/la-34-ethan-park.webp`,
    portraitAlt: "Ethan Park dialing faders on an SSL desktop mixer in his Burbank studio.",
    clips: [
      {
        id: "la-34-ethan-park-clip-1",
        title: "Burbank control room mix",
        kind: 'video',
        embedUrl: `${LA_MEDIA_BASE}/la-34-ethan-park.mp4`,
        embedProvider: 'direct',
        posterUrl: `${LA_MEDIA_BASE}/la-34-ethan-park.webp`,
        durationSec: 8,
      },
    ],
    featuredClipId: "la-34-ethan-park-clip-1",
    profileStyle: {
          "themeId": "zine-mono",
          "moodStatus": "Booking Burbank indie EP tracking & co-writes",
          "bannerPattern": "bars",
          "soundsLike": [
                "Wolf Alice",
                "Soccer Mommy",
                "Beabadoobee"
          ]
    },
    isPublished: true,
    isUserCreated: false,
    createdAt: 1795657980000,
  },
  {
    id: "la-35-camila-santos",
    side: "jam",
    roleCategory: "Producers",
    instruments: ["producer","synth"],
    regionId: "la",
    regionLabel: "Los Angeles (213)",
    regionState: "CA",
    neighborhood: "Echo Park",
    title: "Camila Santos",
    subtitle: "Bedroom pop & modular synth producer",
    seekingOrOffer: "Looking for Echo Park / Silver Lake singers and indie bassists who love textured modular synth-pop production.",
    genres: ["Bedroom Pop","Modular","Synth-Pop"],
    tags: ["Modular Synth","Echo Park","Bedroom Pop","Co-Prod"],
    bio: "22-year-old producer patching organic Eurorack arps, tape loops, and crunchy drum machines into warm bedroom-pop hooks.",
    gearOrBackline: "Intellijel 7U Eurorack Skiff, Arturia KeyStep 37, Tascam Portastudio 424, Kali LP-6",
    gearLocker: [
          {
                "id": "la-35-camila-santos-g1",
                "category": "Pedals & Synth",
                "name": "Intellijel 7U Modular Synth Skiff",
                "notes": "Make Noise Maths, Plaits, Beads"
          },
          {
                "id": "la-35-camila-santos-g2",
                "category": "Mics & Studio",
                "name": "Tascam Portastudio 424 Cassette",
                "notes": "True analog 4-track tape bounce"
          }
    ],
    availability: "Wed nights & Sun afternoons",
    visualSeed: 45,
    portraitUrl: `${LA_MEDIA_BASE}/la-35-camila-santos.webp`,
    portraitAlt: "Camila Santos tweaking a patched Eurorack modular skiff at her Echo Park desk.",
    clips: [
      {
        id: "la-35-camila-santos-clip-1",
        title: "Echo Park modular patch",
        kind: 'video',
        embedUrl: `${LA_MEDIA_BASE}/la-35-camila-santos.mp4`,
        embedProvider: 'direct',
        posterUrl: `${LA_MEDIA_BASE}/la-35-camila-santos.webp`,
        durationSec: 8,
      },
    ],
    featuredClipId: "la-35-camila-santos-clip-1",
    profileStyle: {
          "themeId": "stage-coral",
          "moodStatus": "Patching modular synth hooks & tape loops in Echo Park",
          "bannerPattern": "waves",
          "soundsLike": [
                "Magdalena Bay",
                "Men I Trust",
                "Four Tet"
          ]
    },
    isPublished: true,
    isUserCreated: false,
    createdAt: 1795658040000,
  },
  {
    id: "la-36-darius-cole",
    side: "jam",
    roleCategory: "Producers",
    instruments: ["producer","keys"],
    regionId: "la",
    regionLabel: "Los Angeles (213)",
    regionState: "CA",
    neighborhood: "North Hollywood",
    title: "Darius Cole",
    subtitle: "R&B, soul & live-band fusion producer",
    seekingOrOffer: "Looking for LA vocalists, horns, and live drummers to co-create lush modern R&B and neo-soul records in NoHo.",
    genres: ["R&B","Neo-Soul","Jazz-Soul"],
    tags: ["NoHo Studio","Maschine","R&B Prod","Arranger"],
    bio: "36-year-old producer writing silky chord-heavy R&B tracks anchored in live Rhodes/piano chops, crisp layered percussion, and vocal arrangement.",
    gearOrBackline: "NI Maschine MK3, Fender Rhodes Plugin + Stage Keys, Apollo Twin X, Focal Alpha 65",
    gearLocker: [
          {
                "id": "la-36-darius-cole-g1",
                "category": "Mics & Studio",
                "name": "Maschine MK3 + Apollo Twin X",
                "notes": "Fast R&B beat & chord workflow"
          },
          {
                "id": "la-36-darius-cole-g2",
                "category": "Mics & Studio",
                "name": "Focal Alpha 65 + Acoustic Booth",
                "notes": "Clean vocal & mix room in NoHo"
          }
    ],
    availability: "Weekday evenings & Saturdays",
    visualSeed: 46,
    portraitUrl: `${LA_MEDIA_BASE}/la-36-darius-cole.webp`,
    portraitAlt: "Darius Cole working at his NoHo R&B studio desk with Maschine and warm lighting.",
    clips: [
      {
        id: "la-36-darius-cole-clip-1",
        title: "NoHo R&B track preview",
        kind: 'video',
        embedUrl: `${LA_MEDIA_BASE}/la-36-darius-cole.mp4`,
        embedProvider: 'direct',
        posterUrl: `${LA_MEDIA_BASE}/la-36-darius-cole.webp`,
        durationSec: 8,
      },
    ],
    featuredClipId: "la-36-darius-cole-clip-1",
    profileStyle: {
          "themeId": "tube-amber",
          "moodStatus": "NoHo vocal booth open — seeking top-tier R&B singers",
          "bannerPattern": "vinyl",
          "soundsLike": [
                "Victoria Monet",
                "Kaytranada",
                "Snoh Aalegra"
          ]
    },
    isPublished: true,
    isUserCreated: false,
    createdAt: 1795658100000,
  },
  {
    id: "la-37-audrey-hall",
    side: "jam",
    roleCategory: "Songwriters",
    instruments: ["guitar","vocals"],
    regionId: "la",
    regionLabel: "Los Angeles (213)",
    regionState: "CA",
    neighborhood: "Silver Lake",
    title: "Audrey Hall",
    subtitle: "Indie-folk fingerpicking songwriter",
    seekingOrOffer: "Seeking a cellist, upright bassist, or subtle brush drummer in Silver Lake for intimate acoustic sets and EP recording.",
    genres: ["Indie Folk","Acoustic","Americana"],
    tags: ["Singer-Songwriter","Martin 000","Silver Lake","Fingerstyle"],
    bio: "21-year-old Silver Lake songwriter writing quiet, lyric-focused folk songs in alternate tunings. Looking to turn solo acoustic tunes into warm textured chamber-folk arrangements.",
    gearOrBackline: "Martin 000-15M All-Mahogany, K&K Pure Mini Pickup, Shure SM58 / Neumann KMS 105",
    gearLocker: [
          {
                "id": "la-37-audrey-hall-g1",
                "category": "Instruments",
                "name": "Martin 000-15M Mahogany Acoustic",
                "notes": "Warm intimate woody midrange"
          },
          {
                "id": "la-37-audrey-hall-g2",
                "category": "Mics & Studio",
                "name": "Neumann KMS 105 + K&K Pure Mini",
                "notes": "Clean live acoustic room clarity"
          }
    ],
    availability: "Mon, Thu evenings & Sundays",
    visualSeed: 47,
    portraitUrl: `${LA_MEDIA_BASE}/la-37-audrey-hall.webp`,
    portraitAlt: "Audrey Hall fingerpicking a mahogany Martin acoustic guitar on her Silver Lake sofa.",
    clips: [
      {
        id: "la-37-audrey-hall-clip-1",
        title: "Silver Lake couch demo",
        kind: 'video',
        embedUrl: `${LA_MEDIA_BASE}/la-37-audrey-hall.mp4`,
        embedProvider: 'direct',
        posterUrl: `${LA_MEDIA_BASE}/la-37-audrey-hall.webp`,
        durationSec: 8,
      },
    ],
    featuredClipId: "la-37-audrey-hall-clip-1",
    profileStyle: {
          "themeId": "emerald-club",
          "moodStatus": "Seeking strings & upright bass for Hotel Cafe-style sets",
          "bannerPattern": "waves",
          "soundsLike": [
                "Adrienne Lenker",
                "Lizzy McAlpine",
                "Elliott Smith"
          ]
    },
    isPublished: true,
    isUserCreated: false,
    createdAt: 1795658160000,
  },
  {
    id: "la-38-mateo-del-rio",
    side: "jam",
    roleCategory: "Songwriters",
    instruments: ["guitar","vocals"],
    regionId: "la",
    regionLabel: "Los Angeles (213)",
    regionState: "CA",
    neighborhood: "Venice",
    title: "Mateo Del Rio",
    subtitle: "Bilingual indie & nylon-string songwriter",
    seekingOrOffer: "Looking for percussionists, upright bassists, and keys on the Westside for warm bilingual bossa-indie songwriting.",
    genres: ["Bossa Indie","Indie Folk","Latin Alt"],
    tags: ["Nylon Guitar","Bilingual","Venice","Bossa"],
    bio: "26-year-old Venice songwriter blending nylon-string bossa rhythms with dreamy Spanish/English indie melodies. Ready to put a warm 4-piece acoustic group together.",
    gearOrBackline: "Cordoba C9 Classical Nylon-String, Kremona NG-1 Piezo, Fishman Loudbox Mini",
    gearLocker: [
          {
                "id": "la-38-mateo-del-rio-g1",
                "category": "Instruments",
                "name": "Cordoba C9 Cedar Nylon-String",
                "notes": "Lush warm classical thumb tone"
          },
          {
                "id": "la-38-mateo-del-rio-g2",
                "category": "Amps & Cabs",
                "name": "Fishman Loudbox Mini Charge",
                "notes": "Breezy patio & acoustic gig rig"
          }
    ],
    availability: "Wed nights & Weekend afternoons",
    visualSeed: 48,
    portraitUrl: `${LA_MEDIA_BASE}/la-38-mateo-del-rio.webp`,
    portraitAlt: "Mateo Del Rio fingerpicking a nylon-string guitar in a sunny Venice bungalow.",
    clips: [
      {
        id: "la-38-mateo-del-rio-clip-1",
        title: "Venice nylon bossa sketch",
        kind: 'video',
        embedUrl: `${LA_MEDIA_BASE}/la-38-mateo-del-rio.mp4`,
        embedProvider: 'direct',
        posterUrl: `${LA_MEDIA_BASE}/la-38-mateo-del-rio.webp`,
        durationSec: 8,
      },
    ],
    featuredClipId: "la-38-mateo-del-rio-clip-1",
    profileStyle: {
          "themeId": "tube-amber",
          "moodStatus": "Building warm Venice acoustic/bossa-indie band",
          "bannerPattern": "waves",
          "soundsLike": [
                "Natalia Lafourcade",
                "Joao Gilberto",
                "Devendra Banhart"
          ]
    },
    isPublished: true,
    isUserCreated: false,
    createdAt: 1795658220000,
  },
  {
    id: "la-39-kiera-daniels",
    side: "jam",
    roleCategory: "Songwriters",
    instruments: ["guitar","vocals"],
    regionId: "la",
    regionLabel: "Los Angeles (213)",
    regionState: "CA",
    neighborhood: "Los Feliz",
    title: "Kiera Daniels",
    subtitle: "Soulful acoustic & rhythm songwriter",
    seekingOrOffer: "Seeking a tasteful LA rhythm section (drums, bass, keys) to back acoustic-soul originals live at Eastside clubs.",
    genres: ["Acoustic Soul","Folk","R&B"],
    tags: ["Songwriter","Taylor Acoustic","Los Feliz","Groove"],
    bio: "29-year-old songwriter building rhythmic percussive acoustic tracks grounded in warm R&B chords and storytelling lyrics. Have 10 polished songs ready for a live band.",
    gearOrBackline: "Taylor GS Mini-e Koa, Sennheiser e945 Mic, LR Baggs Venue DI",
    gearLocker: [
          {
                "id": "la-39-kiera-daniels-g1",
                "category": "Instruments",
                "name": "Taylor GS Mini-e Koa Acoustic",
                "notes": "Sparkly rhythmic strumming cut"
          },
          {
                "id": "la-39-kiera-daniels-g2",
                "category": "Pedals & Synth",
                "name": "LR Baggs Venue DI Preamp",
                "notes": "Tuner, notch filter & acoustic boost"
          }
    ],
    availability: "Tue evenings & Saturday mornings",
    visualSeed: 49,
    portraitUrl: `${LA_MEDIA_BASE}/la-39-kiera-daniels.webp`,
    portraitAlt: "Kiera Daniels strumming a Taylor acoustic guitar in her lamp-lit Los Feliz living room.",
    clips: [
      {
        id: "la-39-kiera-daniels-clip-1",
        title: "Los Feliz acoustic soul groove",
        kind: 'video',
        embedUrl: `${LA_MEDIA_BASE}/la-39-kiera-daniels.mp4`,
        embedProvider: 'direct',
        posterUrl: `${LA_MEDIA_BASE}/la-39-kiera-daniels.webp`,
        durationSec: 8,
      },
    ],
    featuredClipId: "la-39-kiera-daniels-clip-1",
    profileStyle: {
          "themeId": "stage-coral",
          "moodStatus": "10 originals ready — seeking drums & bass Los Feliz",
          "bannerPattern": "vinyl",
          "soundsLike": [
                "Lianne La Havas",
                "Tracy Chapman",
                "Brittany Howard"
          ]
    },
    isPublished: true,
    isUserCreated: false,
    createdAt: 1795658280000,
  },
  {
    id: "la-40-sam-whitaker",
    side: "jam",
    roleCategory: "Songwriters",
    instruments: ["guitar","vocals"],
    regionId: "la",
    regionLabel: "Los Angeles (213)",
    regionState: "CA",
    neighborhood: "Topanga",
    title: "Sam Whitaker",
    subtitle: "Americana, canyon-folk & alt-country writer",
    seekingOrOffer: "Looking for pedal steel, fiddle, upright bass, or brushes in Topanga / Valley / Eastside to flesh out canyon-folk originals.",
    genres: ["Americana","Alt-Country","Folk Rock"],
    tags: ["Gibson J-45","Topanga","Canyon Folk","Writer"],
    bio: "41-year-old songwriter recording acoustic demos in Topanga Canyon. Open-chord Gibson warmth, unhurried storytelling, and laid-back rehearsals with good coffee.",
    gearOrBackline: "Gibson J-45 Vintage Sunburst, Shure SM57 + Royer R-10, Fender Blues Junior",
    gearLocker: [
          {
                "id": "la-40-sam-whitaker-g1",
                "category": "Instruments",
                "name": "Gibson J-45 Sunburst Slope-Shoulder",
                "notes": "Warm dry vintage woody strumming"
          },
          {
                "id": "la-40-sam-whitaker-g2",
                "category": "Mics & Studio",
                "name": "Royer R-10 Ribbon Mic",
                "notes": "Natural acoustic guitar capture"
          }
    ],
    availability: "Fri afternoons & Sundays",
    visualSeed: 50,
    portraitUrl: `${LA_MEDIA_BASE}/la-40-sam-whitaker.webp`,
    portraitAlt: "Sam Whitaker playing a Gibson J-45 Sunburst acoustic guitar in a wood-walled Topanga room.",
    clips: [
      {
        id: "la-40-sam-whitaker-clip-1",
        title: "Topanga canyon J-45 take",
        kind: 'video',
        embedUrl: `${LA_MEDIA_BASE}/la-40-sam-whitaker.mp4`,
        embedProvider: 'direct',
        posterUrl: `${LA_MEDIA_BASE}/la-40-sam-whitaker.webp`,
        durationSec: 8,
      },
    ],
    featuredClipId: "la-40-sam-whitaker-clip-1",
    profileStyle: {
          "themeId": "tube-amber",
          "moodStatus": "Looking for pedal steel & upright bass around Topanga/Valley",
          "bannerPattern": "vinyl",
          "soundsLike": [
                "Wilco",
                "Townes Van Zandt",
                "MJ Lenderman"
          ]
    },
    isPublished: true,
    isUserCreated: false,
    createdAt: 1795658340000,
  }
];
