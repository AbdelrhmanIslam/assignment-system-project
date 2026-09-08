// main javascript helper for frontend pages

document.addEventListener('DOMContentLoaded', function () {
    // read url query parameters
    var urlParams = new URLSearchParams(window.location.search);
    var error = urlParams.get('error');
    var success = urlParams.get('success');

    // display error alert if error param is present
    var alertBox = document.getElementById('alert-box');
    if (alertBox) {
        if (error) {
            alertBox.className = 'alert alert-error';
            alertBox.textContent = decodeURIComponent(error);
            alertBox.style.display = 'block';
        } else if (success) {
            alertBox.className = 'alert alert-success';
            alertBox.textContent = decodeURIComponent(success);
            alertBox.style.display = 'block';
        }
    }
});
