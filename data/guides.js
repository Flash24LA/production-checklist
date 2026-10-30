/*
 * ============================================================
 *  PRODUCTION GUIDES — EDIT THIS FILE TO CHANGE THE STEPS
 * ============================================================
 *
 * Each guide (Audio, Video, ...) has two routines: "setup" and "breakdown".
 * Each routine is split into sections, and each section holds steps.
 *
 * Step fields:
 *   id           REQUIRED. Unique, never reuse or rename once in use —
 *                saved check-offs are tied to it.
 *   title        Short action, e.g. "Place the mixer at FOH".
 *   instructions List of short lines, shown as numbered sub-steps.
 *   image        Optional. Path to a photo, e.g. "images/audio/setup-mixer.jpg".
 *                Leave as "" until you have the picture — a placeholder shows instead.
 *   imageCaption Optional. Short caption under the photo.
 *   imageCredit  Only for temporary stock photos, e.g. "Photo: Jane Doe, CC BY 2.0".
 *                Shows an "Example photo" label. Remove it when you add your own photo.
 *   tip          Optional. Helpful hint (shown in blue).
 *   warning      Optional. Safety / "don't do this" note (shown in amber).
 *
 * Set comingSoon: true on a guide to show it greyed-out on the home screen.
 */

window.PRODUCTION_GUIDES = [
  {
    id: "audio",
    name: "Audio",
    icon: "🎚️",
    description: "Mixer, speakers, wireless antennas and mics.",
    routines: {
      setup: {
        title: "Audio Setup",
        sections: [
          {
            title: "Gather Equipment",
            steps: [
              {
                id: "a-setup-gather",
                title: "Make sure you have all the equipment",
                instructions: [
                  "The rack with the mixer",
                  "4 handheld mics",
                  "2 headset mics",
                  "2 QSC 12.2 speakers",
                  "The red Audio bin (XLR cables, batteries, Focusrite, Phenyx Pro directional antenna paddles)",
                  "Mic stands to prop up the antennas",
                  "2 speaker stands",
                ],
                image: "images/audio/stock/equipment.jpg",
                imageCredit: "Photo: Lionel Allorge, CC BY-SA 3.0 (Wikimedia Commons)",
                imageCaption: "All audio equipment laid out",
              },
            ],
          },
          {
            title: "Cables & Speakers",
            steps: [
              {
                id: "a-setup-mix1-focusrite",
                title: "Connect Mix 1 to the Focusrite",
                instructions: [
                  "Connect the Mix 1 XLR cable to the Focusrite.",
                  "Place the Focusrite on the production table.",
                ],
                image: "images/audio/stock/focusrite.jpg",
                imageCredit: "Photo: ParsecAU, CC0 (Wikimedia Commons)",
              },
              {
                id: "a-setup-mix2-run",
                title: "Run Mix 2 to the merch table",
                instructions: [
                  "Get an XLR cable from the Audio bin.",
                  "Plug it into Mix 2.",
                  "Run the cable to the outside of the sanctuary, in front of the merch table.",
                ],
                image: "images/audio/stock/xlr-cable.jpg",
                imageCredit: "Photo: RobertKuhlmann, CC BY-SA 3.0 (Wikimedia Commons)",
              },
              {
                id: "a-setup-merch-speaker",
                title: "Set up the QSC speaker at the merch table",
                instructions: [
                  "Stand up one of the QSC speakers on a speaker stand.",
                  "Plug in the XLR run from Mix 2.",
                ],
                image: "images/audio/stock/pa-speaker-stand.jpg",
                imageCredit: "Photo: Andres B, CC BY 2.0 (Wikimedia Commons)",
              },
              {
                id: "a-setup-mix3-mix4",
                title: "Connect Mix 3 and Mix 4 to the wall",
                instructions: [
                  "Plug XLRs into Mix 3 and Mix 4.",
                  "Plug them into the XLR inputs on the back of the wall behind the production table.",
                ],
                image: "images/audio/stock/xlr-wall-plate.jpg",
                imageCredit: "Photo: VK1LW, CC BY-SA 3.0 (Wikimedia Commons)",
              },
              {
                id: "a-setup-holy-speaker",
                title: "Set up the QSC speaker in the Holy of Holies",
                instructions: [
                  "Plug an XLR cable into the male end at the front of the sanctuary.",
                  "Run it to the Holy of Holies.",
                  "Stand up the other QSC speaker on a speaker stand in the Holy of Holies.",
                  "Plug the XLR run into the speaker.",
                ],
                image: "images/audio/stock/pa-speaker-stand.jpg",
                imageCredit: "Photo: Andres B, CC BY 2.0 (Wikimedia Commons)",
              },
            ],
          },
          {
            title: "Wireless Antennas",
            steps: [
              {
                id: "a-setup-antenna-hoist",
                title: "Mount the Phenyx Pro antennas",
                instructions: [
                  "Hoist the Phenyx Pro antennas onto the mic stand.",
                  "Twist the antennas clockwise to secure them on top of the stand.",
                ],
                image: "images/audio/stock/mic-stand.jpg",
                imageCredit: "Photo: Carsten Stiller, CC BY 2.0 (Wikimedia Commons)",
              },
              {
                id: "a-setup-antenna-cables",
                title: "Connect the antenna paddle cables",
                instructions: [
                  "Find the curled SDI cables.",
                  "Plug them into the two Phenyx Pro directional antenna paddles.",
                ],
                image: "images/audio/stock/wireless-antenna.jpg",
                imageCredit: "Photo: Antonio Valiente, CC BY 2.0 (Wikimedia Commons)",
              },
              {
                id: "a-setup-antenna-place",
                title: "Place the antenna stand on the production table",
                instructions: [
                  "Put the mic stand with the antennas on top of the production table.",
                ],
                image: "images/audio/stock/wireless-antenna.jpg",
                imageCredit: "Photo: Antonio Valiente, CC BY 2.0 (Wikimedia Commons)",
                tip: "We do this so the antennas can still reach the production equipment when the sanctuary is full.",
              },
            ],
          },
          {
            title: "Mics",
            steps: [
              {
                id: "a-setup-mics-unpack",
                title: "Unpack the mics",
                instructions: [
                  "Pull the 4 handheld mics out of their pouches.",
                  "Pull the 2 headset receivers out of their pouches.",
                ],
                image: "images/audio/stock/handheld-mics.jpg",
                imageCredit: "Photo: I G, CC BY 2.0 (Wikimedia Commons)",
              },
              {
                id: "a-setup-batteries",
                title: "Put new batteries in all mics",
                instructions: [
                  "Put new batteries in all 4 handheld mics.",
                  "Put new batteries in both headset receivers.",
                ],
                image: "images/audio/stock/batteries.jpg",
                imageCredit: "Photo: ajay_suresh, CC BY 2.0 (Wikimedia Commons)",
                tip: "Batteries are in the red Audio bin.",
              },
              {
                id: "a-setup-headset-mics",
                title: "Connect the headset mics",
                instructions: [
                  "Find the headset mics in the white box in the rack.",
                  "Plug each headset mic into its receiver.",
                ],
                image: "images/audio/stock/headset-mic.jpg",
                imageCredit: "Photo: Christian Dahlqvist, CC BY-SA 2.0 (Wikimedia Commons)",
              },
            ],
          },
          {
            title: "Power Up & Check",
            steps: [
              {
                id: "a-setup-power-cables",
                title: "Plug in power for the mixer and rack",
                instructions: [
                  "Plug the mixer's power cable into the power adapter.",
                  "Plug the rack's power cable into the power adapter.",
                ],
                image: "images/audio/stock/power-strip.jpg",
                imageCredit: "Photo: Roy Zuo, CC BY-SA 4.0 (Wikimedia Commons)",
              },
              {
                id: "a-setup-mixer-on",
                title: "Power up the Allen & Heath Qu-16 and load SPOT Mix",
                instructions: [
                  "Power up the Allen & Heath Qu-16 mixer.",
                  "On the mixer, press Scenes.",
                  "Recall the first saved scene (SPOT Mix).",
                ],
                image: "images/audio/stock/mixer.jpg",
                imageCredit: "Photo: David Bartus, CC0 (Wikimedia Commons)",
              },
              {
                id: "a-setup-mic-check",
                title: "Check that all mics work",
                instructions: [
                  "Test each of the 4 handheld mics.",
                  "Test both headset mics.",
                  "Make sure each one is coming through.",
                ],
                image: "images/audio/stock/mic-check.jpg",
                imageCredit: "Photo: Hinnerk RÃ¼menapf, CC BY-SA 4.0 (Wikimedia Commons)",
                tip: "If a mic isn't working, write it in the note box below.",
              },
            ],
          },
        ],
      },

      breakdown: {
        title: "Audio Breakdown",
        sections: [
          {
            title: "Power Down",
            steps: [
              {
                id: "a-break-mixer-off",
                title: "Power down the Allen & Heath Qu-16",
                instructions: [
                  "Power off the Allen & Heath Qu-16 mixer.",
                ],
                image: "images/audio/stock/mixer.jpg",
                imageCredit: "Photo: David Bartus, CC0 (Wikimedia Commons)",
                warning: "Don't save over the SPOT Mix scene — it's recalled fresh every week.",
              },
              {
                id: "a-break-power-cables",
                title: "Unplug power for the mixer and rack",
                instructions: [
                  "Unplug the mixer's power cable from the power adapter.",
                  "Unplug the rack's power cable from the power adapter.",
                ],
                image: "images/audio/stock/power-strip.jpg",
                imageCredit: "Photo: Roy Zuo, CC BY-SA 4.0 (Wikimedia Commons)",
              },
            ],
          },
          {
            title: "Mics",
            steps: [
              {
                id: "a-break-headset-mics",
                title: "Disconnect the headset mics",
                instructions: [
                  "Unplug each headset mic from its receiver.",
                  "Put the headset mics back in the white box in the rack.",
                ],
                image: "images/audio/stock/headset-mic.jpg",
                imageCredit: "Photo: Christian Dahlqvist, CC BY-SA 2.0 (Wikimedia Commons)",
              },
              {
                id: "a-break-batteries",
                title: "Take the batteries out of all mics",
                instructions: [
                  "Remove the batteries from all 4 handheld mics.",
                  "Remove the batteries from both headset receivers.",
                ],
                image: "images/audio/stock/batteries.jpg",
                imageCredit: "Photo: ajay_suresh, CC BY 2.0 (Wikimedia Commons)",
              },
              {
                id: "a-break-mics-pack",
                title: "Put the mics back in their pouches",
                instructions: [
                  "Put the 4 handheld mics back in their pouches.",
                  "Put the 2 headset receivers back in their pouches.",
                ],
                image: "images/audio/stock/handheld-mics.jpg",
                imageCredit: "Photo: I G, CC BY 2.0 (Wikimedia Commons)",
                tip: "Count them: 4 handhelds + 2 headset receivers.",
              },
            ],
          },
          {
            title: "Wireless Antennas",
            steps: [
              {
                id: "a-break-antenna-stand",
                title: "Take the antenna stand off the production table",
                instructions: [
                  "Lift the mic stand with the antennas off the production table.",
                ],
                image: "images/audio/stock/mic-stand.jpg",
                imageCredit: "Photo: Carsten Stiller, CC BY 2.0 (Wikimedia Commons)",
              },
              {
                id: "a-break-antenna-cables",
                title: "Disconnect the antenna paddle cables",
                instructions: [
                  "Unplug the curled SDI cables from the two Phenyx Pro directional antenna paddles.",
                ],
                image: "images/audio/stock/wireless-antenna.jpg",
                imageCredit: "Photo: Antonio Valiente, CC BY 2.0 (Wikimedia Commons)",
              },
              {
                id: "a-break-antenna-remove",
                title: "Remove the Phenyx Pro antennas",
                instructions: [
                  "Twist the antennas counter-clockwise to take them off the mic stand.",
                  "Pack the antenna paddles in the red Audio bin.",
                  "Collapse the mic stand.",
                ],
                image: "images/audio/stock/mic-stand.jpg",
                imageCredit: "Photo: Carsten Stiller, CC BY 2.0 (Wikimedia Commons)",
              },
            ],
          },
          {
            title: "Cables & Speakers",
            steps: [
              {
                id: "a-break-holy-speaker",
                title: "Take down the QSC speaker in the Holy of Holies",
                instructions: [
                  "Unplug the XLR run from the speaker.",
                  "Lift the QSC speaker off its stand and collapse the stand.",
                  "Unplug the XLR from the male end at the front of the sanctuary.",
                  "Wrap the cable and put it in the red Audio bin.",
                ],
                image: "images/audio/stock/pa-speaker-stand.jpg",
                imageCredit: "Photo: Andres B, CC BY 2.0 (Wikimedia Commons)",
              },
              {
                id: "a-break-mix3-mix4",
                title: "Disconnect Mix 3 and Mix 4 from the wall",
                instructions: [
                  "Unplug the XLRs from the wall inputs behind the production table.",
                  "Unplug them from Mix 3 and Mix 4.",
                  "Wrap the cables and put them in the red Audio bin.",
                ],
                image: "images/audio/stock/coiled-cables.jpg",
                imageCredit: "Photo: Juliana Bastos Marques, CC BY-SA 4.0 (Wikimedia Commons)",
              },
              {
                id: "a-break-merch-speaker",
                title: "Take down the QSC speaker at the merch table",
                instructions: [
                  "Unplug the XLR run from the speaker.",
                  "Lift the QSC speaker off its stand and collapse the stand.",
                ],
                image: "images/audio/stock/pa-speaker-stand.jpg",
                imageCredit: "Photo: Andres B, CC BY 2.0 (Wikimedia Commons)",
              },
              {
                id: "a-break-mix2-run",
                title: "Bring in the Mix 2 cable run",
                instructions: [
                  "Unplug the XLR from Mix 2.",
                  "Wrap the cable from the merch table back to the production table.",
                  "Put it in the red Audio bin.",
                ],
                image: "images/audio/stock/coiled-cables.jpg",
                imageCredit: "Photo: Juliana Bastos Marques, CC BY-SA 4.0 (Wikimedia Commons)",
              },
              {
                id: "a-break-mix1-focusrite",
                title: "Disconnect the Focusrite",
                instructions: [
                  "Disconnect the Mix 1 XLR cable from the Focusrite.",
                  "Pack the Focusrite in the red Audio bin.",
                ],
                image: "images/audio/stock/focusrite.jpg",
                imageCredit: "Photo: ParsecAU, CC0 (Wikimedia Commons)",
              },
            ],
          },
          {
            title: "Final Check",
            steps: [
              {
                id: "a-break-final-check",
                title: "Make sure everything is packed",
                instructions: [
                  "The rack with the mixer",
                  "4 handheld mics and 2 headset mics",
                  "2 QSC 12.2 speakers",
                  "The red Audio bin (XLR cables, batteries, Focusrite, Phenyx Pro antenna paddles)",
                  "The antenna mic stand",
                  "2 speaker stands",
                ],
                image: "images/audio/stock/equipment.jpg",
                imageCredit: "Photo: Lionel Allorge, CC BY-SA 3.0 (Wikimedia Commons)",
                tip: "Walk the sanctuary, merch table and Holy of Holies once more for anything left behind.",
              },
            ],
          },
        ],
      },
    },
  },

  // Video — flip comingSoon to false and add routines when the steps are ready.
  { id: "video", name: "Video", icon: "🎥", description: "Cameras, switcher and screens.", comingSoon: true },
];
