const examModel = require("../models/exam-timetableModel");

// =====================================================
// HELPER: GET ALL WEEKDAYS BETWEEN TWO DATES
// =====================================================

function getExamDates(startDate, endDate) {
  const dates = [];

  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");

  while (start <= end) {
    const dayNumber = start.getDay();

    // Monday - Friday only
    if (dayNumber >= 1 && dayNumber <= 5) {
      dates.push({
        date: start.toISOString().split("T")[0],
        day: ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"][
          dayNumber
        ],
      });
    }

    start.setDate(start.getDate() + 1);
  }

  return dates;
}

// =====================================================
// HELPER: CHECK TIME OVERLAP
// =====================================================

function timeOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

// =====================================================
// HELPER: CHECK EXAM CLASH
// =====================================================

function hasClash(candidate, generated, existing) {
  const allTimetables = [...generated, ...existing];

  return allTimetables.some((item) => {
    if (String(item.exam_date) !== String(candidate.exam_date)) {
      return false;
    }

    if (
      !timeOverlap(
        candidate.start_time,
        candidate.end_time,
        item.start_time,
        item.end_time,
      )
    ) {
      return false;
    }

    // Same venue cannot have two exams
    if (Number(item.venue_id) === Number(candidate.venue_id)) {
      return true;
    }

    // Same level cannot have two exams at same time
    if (String(item.level) === String(candidate.level)) {
      return true;
    }

    return false;
  });
}

// =====================================================
// GENERATE EXAM TIMETABLE
// =====================================================

exports.generateExamTimetable = (req, res) => {
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

  if (semester !== "First" && semester !== "Second") {
    return res.status(400).json({
      success: false,
      message: "Semester must be First or Second.",
    });
  }

  const start = new Date(start_date + "T00:00:00");
  const end = new Date(end_date + "T00:00:00");

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({
      success: false,
      message: "Invalid examination dates.",
    });
  }

  if (start > end) {
    return res.status(400).json({
      success: false,
      message: "Exam start date cannot be after exam end date.",
    });
  }

  // ===================================================
  // GET COURSES
  // ===================================================

  examModel.getExamCourses(semester, (courseError, courses) => {
    if (courseError) {
      console.error("Exam course error:", courseError);

      return res.status(500).json({
        success: false,
        message: "Failed to load courses for examination.",
      });
    }

    if (!courses || courses.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No courses were found for the selected semester.",
      });
    }

    // =================================================
    // GET VENUES
    // =================================================

    examModel.getAvailableVenues((venueError, venues) => {
      if (venueError) {
        console.error("Exam venue error:", venueError);

        return res.status(500).json({
          success: false,
          message: "Failed to load examination venues.",
        });
      }

      if (!venues || venues.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No available venues were found.",
        });
      }

      // =============================================
      // GET EXISTING EXAMS
      // =============================================

      examModel.getExistingExamTimetables(
        academic_year,
        semester,
        (existingError, existing) => {
          if (existingError) {
            console.error("Existing exam timetable error:", existingError);

            return res.status(500).json({
              success: false,
              message: "Failed to check existing examination timetable.",
            });
          }

          // =========================================
          // GET EXAM DATES
          // =========================================

          const examDates = getExamDates(start_date, end_date);

          if (examDates.length === 0) {
            return res.status(400).json({
              success: false,
              message:
                "The selected examination period contains no Monday-Friday dates.",
            });
          }

          // =========================================
          // EXAM PERIODS
          // =========================================

          const examPeriods = [
            {
              start_time: "09:00:00",
              end_time: "11:00:00",
              session: "Morning",
            },

            {
              start_time: "11:00:00",
              end_time: "13:00:00",
              session: "Midday",
            },

            {
              start_time: "14:00:00",
              end_time: "16:00:00",
              session: "Afternoon",
            },
          ];

          // =========================================
          // CREATE ALL POSSIBLE SLOTS
          // =========================================

          const slots = [];

          examDates.forEach((dateInfo) => {
            examPeriods.forEach((period) => {
              venues.forEach((venue) => {
                slots.push({
                  exam_date: dateInfo.date,

                  day: dateInfo.day,

                  start_time: period.start_time,

                  end_time: period.end_time,

                  session: period.session,

                  venue_id: venue.id,

                  venue_name: venue.venue_name,

                  venue_code: venue.venue_code,
                });
              });
            });
          });

          // =========================================
          // SORT COURSES
          // =========================================

          // Higher-unit courses are placed first.
          // This makes the generator handle the
          // harder-to-place courses first.

          courses.sort((a, b) => {
            const unitDifference =
              Number(b.course_unit) - Number(a.course_unit);

            if (unitDifference !== 0) {
              return unitDifference;
            }

            return Number(a.level) - Number(b.level);
          });

          // =========================================
          // GENERATE TIMETABLE
          // =========================================

          const generated = [];

          for (const course of courses) {
            let scheduled = false;

            // Try every available slot
            for (const slot of slots) {
              const candidate = {
                course_id: course.course_id,

                course_code: course.course_code,

                course_title: course.course_title,

                course_unit: course.course_unit,

                level: course.level,

                semester: course.semester,

                venue_id: slot.venue_id,

                venue_name: slot.venue_name,

                venue_code: slot.venue_code,

                exam_date: slot.exam_date,

                day: slot.day,

                start_time: slot.start_time,

                end_time: slot.end_time,

                session: slot.session,

                academic_year: academic_year,
              };

              // Check conflicts
              if (!hasClash(candidate, generated, existing)) {
                generated.push(candidate);

                scheduled = true;

                break;
              }
            }

            // =======================================
            // COURSE COULD NOT BE SCHEDULED
            // =======================================

            if (!scheduled) {
              return res.status(409).json({
                success: false,

                message:
                  `Unable to schedule ${course.course_code}. ` +
                  `There are not enough conflict-free examination slots ` +
                  `within the selected examination period.`,

                course: {
                  id: course.course_id,
                  code: course.course_code,
                  title: course.course_title,
                  level: course.level,
                },
              });
            }
          }

          // =========================================
          // SORT FINAL RESULT
          // =========================================

          generated.sort((a, b) => {
            const dateCompare = new Date(a.exam_date) - new Date(b.exam_date);

            if (dateCompare !== 0) {
              return dateCompare;
            }

            if (a.start_time < b.start_time) {
              return -1;
            }

            if (a.start_time > b.start_time) {
              return 1;
            }

            return Number(a.level) - Number(b.level);
          });

          // =========================================
          // SUMMARY
          // =========================================

          const levels = [...new Set(generated.map((item) => item.level))];

          // =========================================
          // RETURN GENERATED EXAM TIMETABLE
          // =========================================

          return res.json({
            success: true,

            message: "Complete examination timetable generated successfully.",

            summary: {
              courses: courses.length,

              examinations: generated.length,

              levels: levels,

              venues: venues.length,

              exam_days: examDates.length,

              start_date: start_date,

              end_date: end_date,
            },

            data: generated,
          });
        },
      );
    });
  });
};

// =====================================================
// SAVE GENERATED EXAM TIMETABLE
// =====================================================

exports.saveExamTimetable = (req, res) => {
  const { timetable } = req.body;

  if (!timetable || !Array.isArray(timetable) || timetable.length === 0) {
    return res.status(400).json({
      success: false,

      message: "No examination timetable was provided.",
    });
  }

  let saved = 0;

  const saveNext = (index) => {
    if (index >= timetable.length) {
      return res.json({
        success: true,

        message: "Examination timetable saved successfully.",

        saved: saved,
      });
    }

    examModel.saveExamTimetable(timetable[index], (error) => {
      if (error) {
        console.error("Save exam timetable error:", error);

        return res.status(500).json({
          success: false,

          message: "Failed to save examination timetable.",

          error: error.message,
        });
      }

      saved++;

      saveNext(index + 1);
    });
  };

  saveNext(0);
};

// =====================================================
// CLEAR EXAM TIMETABLE
// =====================================================

exports.clearExamTimetable = (req, res) => {
  const { academic_year, semester } = req.body;

  if (!academic_year || !semester) {
    return res.status(400).json({
      success: false,

      message: "Academic year and semester are required.",
    });
  }

  examModel.deleteExamTimetable(academic_year, semester, (error, result) => {
    if (error) {
      console.error("Clear exam timetable error:", error);

      return res.status(500).json({
        success: false,

        message: "Failed to clear examination timetable.",
      });
    }

    return res.json({
      success: true,

      message: "Examination timetable cleared successfully.",

      deleted: result.affectedRows,
    });
  });
};
