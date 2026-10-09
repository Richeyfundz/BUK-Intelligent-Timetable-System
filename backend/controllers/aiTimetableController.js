
const aiTimetableModel = require("../models/aiTimetableModel");

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const TIME_SLOTS = {
  Monday: [
    { start: "08:00:00", end: "10:00:00" },
    { start: "10:00:00", end: "12:00:00" },
    { start: "14:00:00", end: "16:00:00" },
  ],
  Tuesday: [
    { start: "08:00:00", end: "10:00:00" },
    { start: "10:00:00", end: "12:00:00" },
    { start: "14:00:00", end: "16:00:00" },
  ],
  Wednesday: [
    { start: "08:00:00", end: "10:00:00" },
    { start: "10:00:00", end: "12:00:00" },
    { start: "14:00:00", end: "16:00:00" },
  ],
  Thursday: [
    { start: "08:00:00", end: "10:00:00" },
    { start: "10:00:00", end: "12:00:00" },
    { start: "14:00:00", end: "16:00:00" },
  ],
  Friday: [
    { start: "08:00:00", end: "10:00:00" },
    { start: "10:00:00", end: "12:00:00" },
    { start: "14:30:00", end: "16:30:00" },
  ],
};

function formatDate(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function normalizeDate(value) {
  if (!value) return "";

  if (value instanceof Date) return formatDate(value);

  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);

  return match ? match[1] : "";
}

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T12:00:00`);

  return !Number.isNaN(date.getTime()) && formatDate(date) === value;
}

function getWeekdays(startDate, endDate) {
  const dates = [];
  const current = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);

  while (current <= end) {
    const dayNumber = current.getDay();

    if (dayNumber >= 1 && dayNumber <= 5) {
      dates.push({
        date: formatDate(current),
        day: DAYS[dayNumber - 1],
      });
    }

    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function timesOverlap(start1, end1, start2, end2) {
  return start1 < end2 && end1 > start2;
}

function shuffle(items) {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function buildCourseList(rows) {
  const courses = new Map();

  for (const row of rows) {
    if (!courses.has(row.course_id)) {
      courses.set(row.course_id, {
        course_id: row.course_id,
        course_code: row.course_code,
        course_title: row.course_title,
        course_unit: row.course_unit,
        level: row.level,
        semester: row.semester,
        lecturers: [],
      });
    }

    const course = courses.get(row.course_id);

    if (
      row.lecturer_id != null &&
      !course.lecturers.some(
        (lecturer) =>
          Number(lecturer.lecturer_id) === Number(row.lecturer_id)
      )
    ) {
      course.lecturers.push({
        lecturer_id: row.lecturer_id,
        staff_id: row.staff_id,
        lecturer_name: row.lecturer_name,
      });
    }
  }

  return Array.from(courses.values());
}

function hasClash(candidate, scheduled) {
  for (const item of scheduled) {
    if (
      normalizeDate(item.lecture_date) !==
      normalizeDate(candidate.lecture_date)
    ) {
      continue;
    }

    if (
      !timesOverlap(
        candidate.start_time,
        candidate.end_time,
        String(item.start_time || ""),
        String(item.end_time || "")
      )
    ) {
      continue;
    }

    if (
      candidate.lecturer_id != null &&
      item.lecturer_id != null &&
      Number(candidate.lecturer_id) === Number(item.lecturer_id)
    ) {
      return "Lecturer clash";
    }

    if (
      candidate.venue_id != null &&
      item.venue_id != null &&
      Number(candidate.venue_id) === Number(item.venue_id)
    ) {
      return "Venue clash";
    }

    if (String(candidate.level) === String(item.level)) {
      return "Level/student group clash";
    }
  }

  return null;
}

function generateSchedule(courses, venues, lectureDates, existingRows, semester, academicYear) {
  const scheduled = [...existingRows];
  const generated = [];
  const unscheduled = [];

  const slots = [];

  for (const date of lectureDates) {
    for (const time of TIME_SLOTS[date.day]) {
      slots.push({
        lecture_date: date.date,
        day: date.day,
        start_time: time.start,
        end_time: time.end,
      });
    }
  }

  // Prioritize courses with more units, then higher levels.
  const orderedCourses = [...courses].sort((a, b) => {
    const unitDifference =
      Number(b.course_unit || 1) - Number(a.course_unit || 1);

    if (unitDifference !== 0) return unitDifference;

    return Number(b.level || 0) - Number(a.level || 0);
  });

  for (const course of orderedCourses) {
    let placed = false;

    const candidateSlots = shuffle(slots);
    const lecturers = shuffle(course.lecturers);
    const candidateVenues = shuffle(venues);

    for (const slot of candidateSlots) {
      if (placed) break;

      for (const lecturer of lecturers) {
        if (placed) break;

        for (const venue of candidateVenues) {
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
            semester,
            academic_year: academicYear,

            day: slot.day,
            lecture_date: slot.lecture_date,
            start_time: slot.start_time,
            end_time: slot.end_time,

            session: "Lecture",
          };

          if (hasClash(candidate, scheduled)) continue;

          scheduled.push(candidate);
          generated.push(candidate);
          placed = true;
          break;
        }
      }
    }

    if (!placed) {
      unscheduled.push({
        course_id: course.course_id,
        course_code: course.course_code,
        course_title: course.course_title,
        level: course.level,
        reason:
          "No available slot, lecturer, and venue combination was found without a clash.",
      });
    }
  }

  generated.sort((a, b) => {
    const dateComparison =
      a.lecture_date.localeCompare(b.lecture_date);

    if (dateComparison !== 0) return dateComparison;

    const timeComparison =
      a.start_time.localeCompare(b.start_time);

    if (timeComparison !== 0) return timeComparison;

    return Number(a.level) - Number(b.level);
  });

  return { generated, unscheduled };
}

// =====================================================
// GENERATE TIMETABLE FOR ALL COURSE LEVELS
// =====================================================

exports.generateTimetable = (req, res) => {
  const { semester, academic_year, start_date, end_date } = req.body;

  if (!semester || !academic_year || !start_date || !end_date) {
    return res.status(400).json({
      success: false,
      message:
        "Semester, academic year, start date and end date are required.",
    });
  }

  if (!["First", "Second"].includes(semester)) {
    return res.status(400).json({
      success: false,
      message: "Semester must be First or Second.",
    });
  }

  if (!validDate(start_date) || !validDate(end_date)) {
    return res.status(400).json({
      success: false,
      message: "Please provide valid dates in YYYY-MM-DD format.",
    });
  }

  if (start_date > end_date) {
    return res.status(400).json({
      success: false,
      message: "Start date cannot be after end date.",
    });
  }

  const lectureDates = getWeekdays(start_date, end_date);

  if (lectureDates.length === 0) {
    return res.status(400).json({
      success: false,
      message: "The selected date range contains no weekdays.",
    });
  }

  // null means that every course level is included.
  aiTimetableModel.getCoursesWithLecturers(
    semester,
    null,
    (courseError, rows) => {
      if (courseError) {
        console.error("Load courses error:", courseError);

        return res.status(500).json({
          success: false,
          message: "Failed to load courses and lecturer assignments.",
        });
      }

      const courses = buildCourseList(rows || []);

      if (courses.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "No courses were found for this semester. Check your course records.",
        });
      }

      const withoutLecturers = courses.filter(
        (course) => course.lecturers.length === 0
      );

      if (withoutLecturers.length > 0) {
        return res.status(409).json({
          success: false,
          message:
            "Some courses have no assigned lecturer. Assign the actual lecturers before generating the timetable.",
          courses: withoutLecturers.map((course) => ({
            course_code: course.course_code,
            course_title: course.course_title,
            level: course.level,
          })),
        });
      }

      aiTimetableModel.getAvailableVenues((venueError, venues) => {
        if (venueError) {
          console.error("Load venues error:", venueError);

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

        aiTimetableModel.getExistingTimetables(
          academic_year,
          semester,
          (existingError, existingRows) => {
            if (existingError) {
              console.error("Load existing timetable error:", existingError);

              return res.status(500).json({
                success: false,
                message: "Failed to check existing timetable records.",
              });
            }

            const { generated, unscheduled } = generateSchedule(
              courses,
              venues,
              lectureDates,
              existingRows || [],
              semester,
              academic_year
            );

            if (unscheduled.length > 0) {
              return res.status(409).json({
                success: false,
                message:
                  `${unscheduled.length} course(s) could not be scheduled. ` +
                  "Expand the date range, add available venues, or review existing timetable clashes.",
                summary: {
                  total_courses: courses.length,
                  scheduled_courses: generated.length,
                  unscheduled_courses: unscheduled.length,
                },
                data: generated,
                unscheduled,
              });
            }

            return res.json({
              success: true,
              message: "Timetable generated successfully.",
              summary: {
                total_courses: courses.length,
                generated_courses: generated.length,
                total_sessions: generated.length,
                levels: [
                  ...new Set(generated.map((item) => item.level)),
                ].sort((a, b) => Number(a) - Number(b)),
                days: DAYS,
                start_date,
                end_date,
                prayer_breaks: {
                  monday_to_thursday: "13:00-14:00",
                  friday: "13:00-14:30",
                },
              },
              data: generated,
            });
          }
        );
      });
    }
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

  const requiredFields = [
    "course_id",
    "lecturer_id",
    "venue_id",
    "level",
    "semester",
    "day",
    "lecture_date",
    "start_time",
    "end_time",
    "academic_year",
  ];

  for (const item of timetable) {
    const missing = requiredFields.some(
      (field) =>
        item[field] === undefined ||
        item[field] === null ||
        item[field] === ""
    );

    if (missing) {
      return res.status(400).json({
        success: false,
        message: "One or more timetable records are incomplete.",
      });
    }
  }

  let index = 0;

  function saveNext() {
    if (index >= timetable.length) {
      return res.json({
        success: true,
        message: `${index} timetable sessions saved successfully.`,
        saved: index,
      });
    }

    aiTimetableModel.saveGeneratedTimetable(
      timetable[index],
      (error) => {
        if (error) {
          console.error("Save timetable error:", error);

          return res.status(500).json({
            success: false,
            message:
              "Saving failed. Some earlier sessions may already have been saved. Check the timetable before retrying.",
            saved_before_error: index,
          });
        }

        index++;
        saveNext();
      }
    );
  }

  saveNext();
};
