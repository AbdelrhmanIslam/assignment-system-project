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
        }
    }

    // toggle password visibility on eye button click
    var toggleBtns = document.querySelectorAll('.toggle-password-btn');
    for (var i = 0; i < toggleBtns.length; i++) {
        toggleBtns[i].addEventListener('click', function () {
            var targetId = this.getAttribute('data-target');
            var input = document.getElementById(targetId);
            if (!input) {
                return;
            }
            var eyeOpen = this.querySelector('.eye-open');
            var eyeClosed = this.querySelector('.eye-closed');
            if (input.type === 'password') {
                input.type = 'text';
                if (eyeOpen) {
                    eyeOpen.style.display = 'none';
                }
                if (eyeClosed) {
                    eyeClosed.style.display = 'inline-block';
                }
            } else {
                input.type = 'password';
                if (eyeOpen) {
                    eyeOpen.style.display = 'inline-block';
                }
                if (eyeClosed) {
                    eyeClosed.style.display = 'none';
                }
            }
        });
    }
});
