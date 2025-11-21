import Navigation from "@/components/navigation"
import Footer from "@/components/footer"

export default function Program() {
  const schedule = [
    {
      day: "Day 1 - Thursday, April 16, 2026",
      title: "CPD Day 1",
      sessions: [
        {
          sesi: "Session 1",
          items: [
            { time: "08:00 - 08:30", title: "Opening (Pre-test)", speaker: "TBD" },
            { time: "08:30 - 08:55", title: "Anatomy and Physiology of Pain", speaker: "TBD" },
            { time: "08:55 - 09:20", title: "Assessment and Diagnosis of Pain", speaker: "TBD" },
            { time: "09:20 - 09:30", title: "Discussion", speaker: "-" },
          ],
        },
        {
          sesi: "Session 2",
          items: [
            { time: "09:30 - 09:55", title: "Pharmacology Opioid", speaker: "TBD" },
            { time: "09:55 - 10:20", title: "Non Opioid", speaker: "TBD" },
            { time: "10:20 - 10:45", title: "Adjuvant Analgesia", speaker: "TBD" },
            { time: "10:45 - 11:00", title: "Discussion", speaker: "-" },
          ],
        },
        {
          sesi: "Session 3",
          items: [
            {
              time: "11:00 - 11:25",
              title: "Procedure Specific Pain Management Recommendation (PROSPECT)",
              speaker: "TBD",
            },
            { time: "11:25 - 11:50", title: "Interventional Technique for Perioperative Pain", speaker: "TBD" },
            { time: "11:50 - 12:15", title: "Acute Pain Service", speaker: "TBD" },
            { time: "12:15 - 12:30", title: "Discussion", speaker: "-" },
          ],
        },
        {
          sesi: "Break",
          items: [{ time: "12:30 - 13:00", title: "Lunch Break", speaker: "-" }],
        },
        {
          sesi: "Session 4",
          items: [
            { time: "13:00 - 13:30", title: "Discussion Session: Postoperative Pain", speaker: "-" },
            { time: "13:30 - 15:30", title: "Skill Station A: PCA, PCEA", speaker: "TBD" },
            { time: "13:30 - 15:30", title: "Skill Station B: Postop. ACB, FICB", speaker: "TBD" },
            { time: "13:30 - 15:30", title: "Skill Station C: Postop. Block Trunk (TAP, ESP)", speaker: "TBD" },
          ],
        },
      ],
    },
    {
      day: "Day 2 - Friday, April 17, 2026",
      title: "CPD Day 2",
      sessions: [
        {
          sesi: "Session 1",
          items: [
            { time: "08:00 - 08:25", title: "Chronic Pain After Surgery", speaker: "TBD" },
            { time: "08:25 - 08:50", title: "Neuropathic Pain", speaker: "TBD" },
            { time: "08:50 - 09:15", title: "Pain in Special Population: Pediatric and Geriatric", speaker: "TBD" },
            { time: "09:15 - 09:30", title: "Discussion", speaker: "-" },
          ],
        },
        {
          sesi: "Session 2",
          items: [
            { time: "09:30 - 09:55", title: "CRPS", speaker: "TBD" },
            { time: "09:55 - 10:20", title: "Cancer Pain and The Management", speaker: "TBD" },
            { time: "10:20 - 10:45", title: "Interventional Technique for Chronic Pain", speaker: "TBD" },
            { time: "10:45 - 11:00", title: "Discussion", speaker: "-" },
          ],
        },
        {
          sesi: "Session 3",
          items: [
            { time: "11:00 - 11:25", title: "The Role of Interventional Pain Management", speaker: "TBD" },
            { time: "11:25 - 11:50", title: "Ethic and Patient Safety in Pain Management", speaker: "TBD" },
            {
              time: "11:50 - 12:15",
              title: "The Role and Privilege of Anesthesiologist in Pain Management",
              speaker: "TBD",
            },
            { time: "12:15 - 12:30", title: "Discussion", speaker: "-" },
          ],
        },
        {
          sesi: "Break",
          items: [{ time: "12:30 - 13:00", title: "Lunch Break", speaker: "-" }],
        },
        {
          sesi: "Session 4",
          items: [
            { time: "13:00 - 13:30", title: "Discussion Session: Cancer Pain", speaker: "-" },
            {
              time: "13:30 - 15:30",
              title: "Skill Station A: Epidural Analgesia, Epidural USG guidance",
              speaker: "TBD",
            },
            { time: "13:30 - 15:30", title: "Skill Station B: Intra-articular knee, CTS", speaker: "TBD" },
            {
              time: "13:30 - 15:30",
              title: "Skill Station C: Suprascapular, Paravertebra block, Occipital",
              speaker: "TBD",
            },
            { time: "15:30 - 16:00", title: "Post-Test / Closing", speaker: "-" },
          ],
        },
      ],
    },
  ]

  return (
    <>
      <Navigation />
      <main className="pt-24">
        <section className="py-20 px-4 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="max-w-6xl mx-auto">
            <h1 className="font-display text-4xl sm:text-5xl font-bold mb-6">Program & Schedule</h1>
            <p className="text-lg text-muted-foreground">
              Comprehensive CPD program with lectures, discussions, and hands-on skill stations
            </p>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto space-y-16">
            {schedule.map((day, dayIndex) => (
              <div key={dayIndex}>
                <div className="mb-8">
                  <h2 className="font-display text-3xl font-bold mb-2 text-primary">{day.day}</h2>
                  <p className="text-muted-foreground text-lg">{day.title}</p>
                </div>

                <div className="space-y-8">
                  {day.sessions.map((session, sessionIndex) => (
                    <div key={sessionIndex}>
                      <h3 className="font-display text-lg font-bold text-primary mb-4 pb-2 border-b-2 border-primary/30">
                        {session.sesi}
                      </h3>
                      <div className="space-y-2">
                        {session.items.map((item, itemIndex) => (
                          <div
                            key={itemIndex}
                            className={`grid grid-cols-1 md:grid-cols-12 gap-4 p-4 rounded-lg border ${
                              session.sesi === "Break"
                                ? "bg-accent/10 border-accent/30 md:col-span-full"
                                : "bg-card border-border hover:border-primary/50"
                            } transition-colors`}
                          >
                            <div className="md:col-span-2">
                              <p className="text-sm font-bold text-primary">{item.time}</p>
                            </div>
                            <div className="md:col-span-7">
                              <p className="font-semibold text-foreground">{item.title}</p>
                            </div>
                            <div className="md:col-span-3">
                              <p className="text-sm text-muted-foreground">
                                {item.speaker === "-" ? "-" : `Speaker: ${item.speaker}`}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
