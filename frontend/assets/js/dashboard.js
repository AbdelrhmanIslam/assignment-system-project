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
      updateStatistics(data.stats);
      updateAssignments(data.assignments);
    })
    .catch(function (error) {
      console.error("Dashboard Error:", error);

      showDashboardError(error.message);
    });
}

function updateStudentInfo(student) {
  var studentName = document.getElementById("student-name");
  var studentEmail = document.getElementById("student-email");

  if (studentName) {
    studentName.textContent = student.name;
  }

  if (studentEmail) {
    studentEmail.textContent = student.email;
  }
}

function updateStatistics(stats) {
  var totalAssignments = document.getElementById("total-assignments");
  var notSubmitted = document.getElementById("not-submitted");
  var underReview = document.getElementById("under-review");
  var graded = document.getElementById("graded");

  if (totalAssignments) {
    totalAssignments.textContent = stats.total;
  }

  if (notSubmitted) {
    notSubmitted.textContent = stats.not_submitted;
  }

  if (underReview) {
    underReview.textContent = stats.under_review;
  }

  if (graded) {
    graded.textContent = stats.graded;
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

  assignments.forEach(function (assignment) {
    var row = document.createElement("tr");

    var assignmentCell = document.createElement("td");
    var assignmentTitle = document.createElement("strong");

    assignmentTitle.textContent = assignment.title;

    assignmentCell.appendChild(assignmentTitle);

    var courseCell = document.createElement("td");
    courseCell.textContent = assignment.course_name;

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
      gradeCell.textContent = assignment.grade + " / " + assignment.max_grade;
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
    row.appendChild(deadlineCell);
    row.appendChild(statusCell);
    row.appendChild(gradeCell);
    row.appendChild(actionCell);

    tableBody.appendChild(row);
  });
}

function getActionLabel(status) {
  switch (status) {
    case "not_submitted":
      return "Submit";
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
    case "graded":
      return "action-result";
    case "under_review":
      return "action-review";
    default:
      return "action-view";
  }
}

function getStatusLabel(status) {
  switch (status) {
    case "not_submitted":
      return "Not Submitted";

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
  var date = new Date(dateString.replace(" ", "T"));

  if (isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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
      "<h3>Unable to Load Dashboard</h3>" +
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
