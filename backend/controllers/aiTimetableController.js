const aiTimetableModel = require("../models/aiTimetableModel");

// =====================================================
// DAYS AND LECTURE PERIODS
// =====================================================

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const TIME_SLOTS = [
  { start: "08:00:00", end: "10:00:00" },
  { start: "10:00:00", end: "12:00:00" },
  { start: "12:00:00", end: "14:00:00" },
  { start: "14:00:00", end: "16:00:00" },
];

// =====================================================
// FORMAT DATE
// =====================================================

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// =====================================================
// GET WEEKDAYS BETWEEN TWO DATES
// =====================================================

function getWeekdays(startDate, endDate) {
  const dates = [];

  const current = new Date(startDate);
  const end = new Date(endDate);

  current.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  while (current <= end) {
    const day = current.getDay();

    // Sunday = 0
    // Monday = 1
    // Friday = 5
    // Saturday = 6

    if (day >= 1 && day <= 5) {
      dates.push(new Date(current));
    }

    current.setDate(current.getDate() + 1);
  }

  return dates;
}

// =====================================================
// TIME CLASH CHECK
// =====================================================

function timesOverlap(start1, end1, start2, end2) {
  return start1 < end2 && end1 > start2;
}

// =====================================================
// CHECK WHETHER A CANDIDATE CLASHES
// =====================================================

function hasClash(candidate, scheduled) {
  for (const item of scheduled) {
    // Different date = no clash
    if (String(item.lecture_date) !== String(candidate.lecture_date)) {
      continue;
    }

    // Different time = no clash
    if (
      !timesOverlap(
        candidate.start_time,
        candidate.end_time,
        item.start_time,
        item.end_time,
      )
    ) {
      continue;
    }

    // =================================================
    // LECTURER CLASH
    // =================================================

    if (Number(candidate.lecturer_id) === Number(item.lecturer_id)) {
      return {
        clash: true,
        reason: "Lecturer is already teaching another course at this time.",
      };
    }

    // =================================================
    // VENUE CLASH
    // =================================================

    if (Number(candidate.venue_id) === Number(item.venue_id)) {
      return {
        clash: true,
        reason: "Venue is already occupied at this time.",
      };
    }

    // =================================================
    // LEVEL / STUDENT CLASH
    // =================================================

    if (String(candidate.level) === String(item.level)) {
      return {
        clash: true,
        reason: "Students in this level already have a lecture at this time.",
      };
    }
  }

  return {
    clash: false,
    reason: null,
  };
}

// =====================================================
// SHUFFLE ARRAY
// =====================================================

function shuffle(array) {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

// =====================================================
// GENERATE COMPLETE TIMETABLE
// =====================================================

exports.generateTimetable = (req, res) => {
  const { semester, academic_year, start_date, end_date } = req.body;

  // ===================================================
  // VALIDATION
  // ===================================================

  if (!semester || !academic_year || !start_date || !end_date) {
    return res.status(400).json({
      success: false,
      message: "Semester, academic year, start date and end date are required.",
    });
  }

  const start = new Date(`${start_date}T00:00:00`);
  const end = new Date(`${end_date}T00:00:00`);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({
      success: false,
      message: "Invalid semester dates.",
    });
  }

  if (start > end) {
    return res.status(400).json({
      success: false,
      message: "Semester start date cannot be after the end date.",
    });
  }

  // ===================================================
  // GET ALL WEEKDAYS
  // ===================================================

  const lectureDates = getWeekdays(start, end);

  if (lectureDates.length === 0) {
    return res.status(400).json({
      success: false,
      message: "No Monday-Friday lecture dates exist in the selected range.",
    });
  }

  // ===================================================
  // GET ALL COURSES FOR ALL LEVELS
  // ===================================================

  aiTimetableModel.getCoursesWithLecturers(
    semester,
    null,
    (courseError, courses) => {
      if (courseError) {
        console.error(courseError);

        return res.status(500).json({
          success: false,
          message: "Failed to load courses and lecturers.",
        });
      }

      if (!courses || courses.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "No courses with assigned lecturers were found for this semester.",
        });
      }

      // =================================================
      // GET AVAILABLE VENUES
      // =================================================

      aiTimetableModel.getAvailableVenues((venueError, venues) => {
        if (venueError) {
          console.error(venueError);

          return res.status(500).json({
            success: false,
            message: "Failed to load available venues.",
          });
        }

        if (!venues || venues.length === 0) {
          return res.status(400).json({
            success: false,
            message: "No available venues were found.",
          });
        }

        // =================================================
        // GET EXISTING TIMETABLE
        // =================================================

        aiTimetableModel.getExistingTimetables(
          academic_year,
          semester,
          (existingError, existing) => {
            if (existingError) {
              console.error(existingError);

              return res.status(500).json({
                success: false,
                message: "Failed to check existing timetable.",
              });
            }

            // =================================================
            // START WITH EXISTING SCHEDULE
            // =================================================

            const scheduled = [...(existing || [])];

            const generated = [];

            // =================================================
            // GROUP COURSES BY COURSE
            // =================================================

            const courseMap = new Map();

            for (const row of courses) {
              if (!courseMap.has(row.course_id)) {
                courseMap.set(row.course_id, {
                  course_id: row.course_id,
                  course_code: row.course_code,
                  course_title: row.course_title,
                  course_unit: row.course_unit,
                  level: row.level,
                  semester: row.semester,
                  lecturers: [],
                });
              }

              courseMap.get(row.course_id).lecturers.push({
                lecturer_id: row.lecturer_id,
                staff_id: row.staff_id,
                lecturer_name: row.lecturer_name,
              });
            }

            let courseList = Array.from(courseMap.values());

            // =================================================
            // SCHEDULE HARDER COURSES FIRST
            // =================================================

            courseList.sort((a, b) => {
              // Higher course units first
              const unitA = Number(a.course_unit || 1);
              const unitB = Number(b.course_unit || 1);

              if (unitA !== unitB) {
                return unitB - unitA;
              }

              // Then level
              return Number(b.level) - Number(a.level);
            });

            // =================================================
            // CREATE ALL POSSIBLE DATED SLOTS
            // =================================================

            const allSlots = [];

            for (const date of lectureDates) {
              const dayIndex = date.getDay();

              const dayName = DAYS[dayIndex - 1];

              for (const time of TIME_SLOTS) {
                allSlots.push({
                  date: new Date(date),
                  lecture_date: formatDate(date),
                  day: dayName,
                  start_time: time.start,
                  end_time: time.end,
                });
              }
            }

            // =================================================
            // SCHEDULE EVERY COURSE
            // =================================================

            for (const course of courseList) {
              let scheduledCourse = false;

              // Randomize lecturers only among lecturers
              // who are actually assigned to this course.
              const lecturers = shuffle(course.lecturers);

              // Randomize slots so timetable is not always
              // generated in exactly the same pattern.
              const slots = shuffle(allSlots);

              for (const slot of slots) {
                if (scheduledCourse) {
                  break;
                }

                for (const lecturer of lecturers) {
                  if (scheduledCourse) {
                    break;
                  }

                  for (const venue of venues) {
                    const candidate = {
                      course_id: course.course_id,
                      course_code: course.course_code,
                      course_title: course.course_title,
                      course_unit: course.course_unit,

                      lecturer_id: lecturer.lecturer_id,
                      lecturer_name: lecturer.lecturer_name,

                      venue_id: venue.id,
                      venue_name: venue.venue_name,
                      venue_code: venue.venue_code,

                      level: course.level,
                      semester: semester,

                      day: slot.day,
                      lecture_date: slot.lecture_date,

                      start_time: slot.start_time,
                      end_time: slot.end_time,

                      session: "Lecture",

                      academic_year: academic_year,
                    };

                    const clash = hasClash(candidate, scheduled);

                    if (!clash.clash) {
                      scheduled.push(candidate);
                      generated.push(candidate);

                      scheduledCourse = true;

                      break;
                    }
                  }
                }
              }

              // =================================================
              // COURSE COULD NOT BE SCHEDULED
              // =================================================

              if (!scheduledCourse) {
                return res.status(409).json({
                  success: false,
                  message: `Unable to schedule ${course.course_code} (${course.course_title}) for ${course.level} Level without a clash.`,
                });
              }
            }

            // =================================================
            // SORT FINAL TIMETABLE
            // =================================================

            const dayOrder = {
              Monday: 1,
              Tuesday: 2,
              Wednesday: 3,
              Thursday: 4,
              Friday: 5,
            };

            generated.sort((a, b) => {
              // Date
              if (a.lecture_date !== b.lecture_date) {
                return a.lecture_date.localeCompare(b.lecture_date);
              }

              // Time
              if (a.start_time !== b.start_time) {
                return a.start_time.localeCompare(b.start_time);
              }

              // Level
              return Number(a.level) - Number(b.level);
            });

            // =================================================
            // RETURN COMPLETE TIMETABLE
            // =================================================

            return res.json({
              success: true,

              message: "Complete timetable generated successfully.",

              summary: {
                total_courses: courseList.length,
                generated_courses: generated.length,
                total_sessions: generated.length,
                levels: [...new Set(generated.map((item) => item.level))].sort(
                  (a, b) => Number(a) - Number(b),
                ),
                days: DAYS,
                start_date,
                end_date,
              },

              data: generated,
            });
          },
        );
      });
    },
  );
};

// =====================================================
// SAVE GENERATED TIMETABLE
// =====================================================

exports.saveGeneratedTimetable = (req, res) => {
  const { timetable } = req.body;

  if (!Array.isArray(timetable) || timetable.length === 0) {
    return res.status(400).json({
      success: false,
      message: "No timetable data was provided.",
    });
  }

  let completed = 0;
  let failed = false;

  for (const item of timetable) {
    if (
      !item.course_id ||
      !item.lecturer_id ||
      !item.venue_id ||
      !item.level ||
      !item.semester ||
      !item.day ||
      !item.lecture_date ||
      !item.start_time ||
      !item.end_time ||
      !item.academic_year
    ) {
      if (!failed) {
        failed = true;

        return res.status(400).json({
          success: false,
          message: "One or more timetable records are incomplete.",
        });
      }

      return;
    }

    aiTimetableModel.saveGeneratedTimetable(item, (error) => {
      if (failed) {
        return;
      }

      if (error) {
        failed = true;

        console.error(error);

        return res.status(500).json({
          success: false,
          message: "Failed to save generated timetable.",
        });
      }

      completed++;

      if (completed === timetable.length) {
        return res.json({
          success: true,
          message: `${completed} timetable sessions saved successfully.`,
          saved: completed,
        });
      }
    });
  }
};
