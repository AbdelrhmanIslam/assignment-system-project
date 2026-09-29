document.addEventListener("DOMContentLoaded", function () {
  loadDashboard();
});

function loadDashboard() {
  fetch("../../backend/student/dashboard.php", {
    method: "GET",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
    },
  })
    .then(function (response) {
      if (response.status === 401) {
        window.location.href = "../auth/login.html";

        return null;
      }

      if (response.status === 403) {
        throw new Error("You do not have permission to access this page.");
      }

      if (!response.ok) {
        throw new Error("Failed to load dashboard data.");
      }

      return response.json();
    })
    .then(function (data) {
      if (!data) {
        return;
      }

      if (!data.success) {
        throw new Error(data.message || "Failed to load dashboard data.");
      }

      updateStudentInfo(data.student);
      updateTeachers(data.teachers);
      updateStatistics(data.stats);
      updateAssignments(data.assignments);
    })
    .catch(function (error) {
      console.error("Dashboard Error:", error);

      showDashboardError(error.message);
    });
}

function updateTeachers(teachers) {
  var container = document.getElementById("teachers-container");
  if (!container) return;
  container.innerHTML = "";

  if (!teachers || teachers.length === 0) {
    var emptyDiv = document.createElement("div");
    emptyDiv.style.cssText = "grid-column: 1 / -1; padding: 1.5rem; background: var(--glass-bg); border: 1px dashed var(--glass-border); border-radius: var(--radius-md); color: var(--text-muted); text-align: center;";
    var noTeachersTitle = window.i18n ? window.i18n.t("student.no_teachers_assigned") : "No teachers assigned yet.";
    var noTeachersDesc = window.i18n ? window.i18n.t("student.no_teachers_desc") : "Assignments will appear once you are enrolled with your teachers.";
    emptyDiv.innerHTML = "<strong>" + escapeHtml(noTeachersTitle) + "</strong><p style='margin: 4px 0 0; font-size: 0.9rem;'>" + escapeHtml(noTeachersDesc) + "</p>";
    container.appendChild(emptyDiv);
    return;
  }

  teachers.forEach(function (t) {
    var card = document.createElement("div");
    card.className = "stat-card";
    card.style.cssText = "display: flex; align-items: center; gap: 14px; padding: 16px 20px; border-left: 4px solid var(--role-teacher); text-align: left;";

    var avatar = document.createElement("div");
    avatar.style.cssText = "width: 44px; height: 44px; border-radius: 50%; background: var(--glass-bg-elevated); color: var(--role-teacher); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; flex-shrink: 0; border: 1px solid var(--glass-border);";
    var initials = (t.name || 'T').split(' ').map(function(w){return w[0];}).slice(0,2).join('').toUpperCase();
    avatar.textContent = initials;

    var info = document.createElement("div");
    info.style.cssText = "flex: 1; min-width: 0;";

    var name = document.createElement("strong");
    name.style.cssText = "display: block; font-size: 15px; color: var(--text-primary); margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;";
    name.textContent = window.i18n ? window.i18n.translateName(t.name) : t.name;

    var email = document.createElement("span");
    email.style.cssText = "display: block; font-size: 13px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;";
    email.textContent = t.email;

    var badgeContainer = document.createElement("div");
    badgeContainer.style.cssText = "display: flex; gap: 6px; align-items: center; margin-top: 6px; flex-wrap: wrap;";

    if (t.subject) {
      var subjectBadge = document.createElement("span");
      subjectBadge.style.cssText = "font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 600; background: rgba(99, 102, 241, 0.15); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.3);";
      subjectBadge.textContent = window.i18n ? window.i18n.translateSubject(t.subject) : t.subject;
      badgeContainer.appendChild(subjectBadge);
    }

    var roleBadge = document.createElement("span");
    roleBadge.className = "status-badge status-graded";
    roleBadge.style.cssText = "font-size: 11px; padding: 2px 8px;";
    roleBadge.textContent = window.i18n ? window.i18n.translateRole("teacher") : "Teacher";
    badgeContainer.appendChild(roleBadge);

    info.appendChild(name);
    info.appendChild(email);
    info.appendChild(badgeContainer);

    card.appendChild(avatar);
    card.appendChild(info);
    container.appendChild(card);
  });
}

function updateStudentInfo(student) {
  var studentName = document.getElementById("student-name");
  var studentEmail = document.getElementById("student-email");
  var studentGradeBadge = document.getElementById("student-grade-badge");

  if (studentName) {
    studentName.textContent = window.i18n ? window.i18n.translateName(student.name) : student.name;
  }

  if (studentEmail) {
    studentEmail.textContent = student.email;
  }

  if (studentGradeBadge && student.grade_level) {
    studentGradeBadge.textContent = window.i18n ? window.i18n.translateGrade(student.grade_level) : (window.formatGradeLevel ? formatGradeLevel(student.grade_level) : student.grade_level);
    studentGradeBadge.style.display = "inline-block";
  }
}

function updateStatistics(stats) {
  var isAr = (window.i18n && window.i18n.getCurrentLanguage() === 'ar');
  var totalAssignments = document.getElementById("total-assignments");
  var notSubmitted = document.getElementById("not-submitted");
  var underReview = document.getElementById("under-review");
  var graded = document.getElementById("graded");

  if (totalAssignments) {
    totalAssignments.textContent = (window.i18n && isAr) ? window.i18n.toArabicDigits(stats.total) : stats.total;
  }

  if (notSubmitted) {
    notSubmitted.textContent = (window.i18n && isAr) ? window.i18n.toArabicDigits(stats.not_submitted) : stats.not_submitted;
  }

  if (underReview) {
    underReview.textContent = (window.i18n && isAr) ? window.i18n.toArabicDigits(stats.under_review) : stats.under_review;
  }

  if (graded) {
    graded.textContent = (window.i18n && isAr) ? window.i18n.toArabicDigits(stats.graded) : stats.graded;
  }
}

function updateAssignments(assignments) {
  var loading = document.getElementById("assignments-loading");
  var empty = document.getElementById("assignments-empty");
  var container = document.getElementById("assignments-container");
  var tableBody = document.getElementById("assignments-table-body");

  if (loading) {
    loading.style.display = "none";
  }

  if (!assignments || assignments.length === 0) {
    if (empty) {
      empty.style.display = "block";
    }

    if (container) {
      container.style.display = "none";
    }

    return;
  }

  if (empty) {
    empty.style.display = "none";
  }

  if (container) {
    container.style.display = "block";
  }

  if (!tableBody) {
    return;
  }

  tableBody.innerHTML = "";

  var isAr = (window.i18n && window.i18n.getCurrentLanguage() === 'ar');
  assignments.forEach(function (assignment) {
    var row = document.createElement("tr");

    var assignmentCell = document.createElement("td");
    var assignmentTitle = document.createElement("strong");

    assignmentTitle.textContent = window.i18n ? window.i18n.translateAssignment(assignment.title) : assignment.title;

    assignmentCell.appendChild(assignmentTitle);

    var courseCell = document.createElement("td");
    courseCell.textContent = window.i18n ? window.i18n.translateCourse(assignment.course_name) : assignment.course_name;

    var teacherCell = document.createElement("td");
    var teacherBadge = document.createElement("span");
    teacherBadge.style.cssText = "font-weight: 600; color: var(--text-primary); display: inline-flex; align-items: center; gap: 4px;";
    var trTeacher = assignment.teacher_name ? (window.i18n ? window.i18n.translateName(assignment.teacher_name) : assignment.teacher_name) : (isAr ? "معلم" : "Teacher");
    teacherBadge.textContent = trTeacher;
    teacherCell.appendChild(teacherBadge);

    var deadlineCell = document.createElement("td");
    deadlineCell.textContent = formatDate(assignment.deadline);

    var statusCell = document.createElement("td");

    var statusBadge = document.createElement("span");

    statusBadge.className =
      "status-badge " + getStatusClass(assignment.display_status);

    statusBadge.textContent = getStatusLabel(assignment.display_status);

    statusCell.appendChild(statusBadge);

    var gradeCell = document.createElement("td");

    if (assignment.display_status === "graded" && assignment.grade !== null) {
      var gVal = (window.i18n && isAr) ? window.i18n.toArabicDigits(assignment.grade) : assignment.grade;
      var gMax = (window.i18n && isAr) ? window.i18n.toArabicDigits(assignment.max_grade) : assignment.max_grade;
      gradeCell.textContent = gVal + " / " + gMax;
    } else {
      gradeCell.textContent = "—";
    }

    var actionCell = document.createElement("td");

    var viewButton = document.createElement("a");

    if (assignment.display_status === "graded") {
      viewButton.href = "result.html?id=" + encodeURIComponent(assignment.id);
    } else {
      viewButton.href = "assignment.html?id=" + encodeURIComponent(assignment.id);
    }

    viewButton.className = "action-btn " + getActionClass(assignment.display_status);

    viewButton.textContent = getActionLabel(assignment.display_status);

    actionCell.appendChild(viewButton);

    row.appendChild(assignmentCell);
    row.appendChild(courseCell);
    row.appendChild(teacherCell);
    row.appendChild(deadlineCell);
    row.appendChild(statusCell);
    row.appendChild(gradeCell);
    row.appendChild(actionCell);

    tableBody.appendChild(row);
  });
}

function getActionLabel(status) {
  if (window.i18n) {
    switch (status) {
      case "not_submitted":
        return window.i18n.t("common.submit");
      case "graded":
        return window.i18n.t("common.view_result");
      default:
        return window.i18n.t("common.view");
    }
  }
  switch (status) {
    case "not_submitted":
      return "Submit";
    case "deadline_passed":
      return "View";
    case "graded":
      return "View Result";
    default:
      return "View";
  }
}

function getActionClass(status) {
  switch (status) {
    case "not_submitted":
      return "action-submit";
    case "deadline_passed":
      return "action-view";
    case "graded":
      return "action-result";
    case "under_review":
      return "action-review";
    default:
      return "action-view";
  }
}

function getStatusLabel(status) {
  if (window.i18n) {
    return window.i18n.translateStatus(status);
  }
  switch (status) {
    case "not_submitted":
      return "Not Submitted";

    case "deadline_passed":
      return "Deadline Passed";

    case "submitted":
      return "Submitted";

    case "under_review":
      return "Under Review";

    case "graded":
      return "Graded";

    default:
      return "Submitted";
  }
}

function getStatusClass(status) {
  switch (status) {
    case "not_submitted":
      return "status-not-submitted";

    case "deadline_passed":
      return "status-closed";

    case "submitted":
      return "status-submitted";

    case "under_review":
      return "status-review";

    case "graded":
      return "status-graded";

    default:
      return "status-submitted";
  }
}

function formatDate(dateString) {
  if (!dateString) {
    return window.i18n ? window.i18n.t("teacher.no_deadline") : "No deadline";
  }
  var date = new Date(dateString.replace(" ", "T"));

  if (isNaN(date.getTime())) {
    return dateString;
  }

  var isAr = (window.i18n && window.i18n.getCurrentLanguage() === 'ar');
  var lang = isAr ? 'ar-EG' : 'en-US';
  var res = date.toLocaleString(lang, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return (window.i18n && isAr) ? window.i18n.toArabicDigits(res) : res;
}

function showDashboardError(message) {
  var loading = document.getElementById("assignments-loading");
  var container = document.getElementById("assignments-container");
  var empty = document.getElementById("assignments-empty");

  if (loading) {
    loading.style.display = "none";
  }

  if (container) {
    container.style.display = "none";
  }

  if (empty) {
    empty.style.display = "block";

    empty.innerHTML =
      "<h3>Unable to load dashboard</h3>" +
      "<p>" +
      escapeHtml(message) +
      "</p>";
  }
}

function escapeHtml(value) {
  var div = document.createElement("div");

  div.textContent = value;

  return div.innerHTML;
}

window.addEventListener("languageChanged", function () {
  if (typeof loadDashboard === "function") loadDashboard();
});

