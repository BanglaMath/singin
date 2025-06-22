document.addEventListener('DOMContentLoaded', () => {
    const registrationForm = document.getElementById('registrationForm');
    const otpForm = document.getElementById('otpForm');
    const successMessageDiv = document.getElementById('successMessage');
    const otpMessage = document.getElementById('otpMessage');
    const resendOtpLink = document.getElementById('resendOtpLink');
    const generatedIdSpan = document.getElementById('generatedId');
    const generatedPassSpan = document.getElementById('generatedPass');

    let userData = {}; // To store temporary user data

    // Base URL of your Node.js backend server
    const BACKEND_URL = 'http://localhost:3000'; // Make sure this matches your server's port

    // --- Step 1: Handle Registration Form Submission (Send OTP) ---
    registrationForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const referralCode = document.getElementById('referralCode').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            alert('Password and confirm password do not match!');
            return;
        }

        // Store user data temporarily in the frontend
        userData = { fullName, email, phone, referralCode, password };
        console.log('Registration data captured:', userData);

        try {
            // Call backend to send OTP
            const response = await fetch(`${BACKEND_URL}/api/send-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phone: userData.phone }), // Only send phone number for OTP
            });
            const data = await response.json();

            if (data.success) {
                otpMessage.textContent = `An OTP has been sent to ${userData.phone}.`;
                registrationForm.classList.remove('active-form');
                registrationForm.classList.add('hidden-form');
                otpForm.classList.remove('hidden-form');
                otpForm.classList.add('active-form');
                alert(data.message); // Show success message from backend
            } else {
                alert('Error sending OTP: ' + (data.message || 'Unknown error'));
                console.error('OTP send failed:', data);
            }
        } catch (error) {
            console.error('Network or server error during OTP send:', error);
            alert('Failed to connect to the server. Please ensure the backend is running.');
        }
    });

    // --- Step 2: Handle OTP Verification Form Submission ---
    otpForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const enteredOtp = document.getElementById('otp').value;
        const phone = userData.phone; // Use the phone number from stored user data

        try {
            // Call backend to verify OTP
            const response = await fetch(`${BACKEND_URL}/api/verify-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phone: phone, otp: enteredOtp }),
            });
            const data = await response.json();

            if (data.success) {
                alert(data.message); // OTP verified message

                // If OTP is valid, call backend to complete registration and generate credentials
                const registerCompleteResponse = await fetch(`${BACKEND_URL}/api/register-complete`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(userData), // Send all user data for final registration
                });
                const registerCompleteData = await registerCompleteResponse.json();

                if (registerCompleteData.success) {
                    generatedIdSpan.textContent = registerCompleteData.id;
                    generatedPassSpan.textContent = registerCompleteData.password; // This will be the user's password or system-gen.

                    otpForm.classList.remove('active-form');
                    otpForm.classList.add('hidden-form');
                    successMessageDiv.classList.remove('hidden-form');
                    successMessageDiv.classList.add('active-form');
                    alert(registerCompleteData.message);
                } else {
                    alert('Error completing registration: ' + (registerCompleteData.message || 'Unknown error'));
                    console.error('Registration completion failed:', registerCompleteData);
                }
            } else {
                alert('OTP verification failed: ' + (data.message || 'Unknown error'));
                console.error('OTP verification failed:', data);
            }
        } catch (error) {
            console.error('Network or server error during OTP verification/registration completion:', error);
            alert('Failed to connect to the server. Please ensure the backend is running and reachable.');
        }
    });

    // --- Handle Resend OTP Link ---
    resendOtpLink.addEventListener('click', async function(event) {
        event.preventDefault();
        const phone = userData.phone;
        if (phone) {
            console.log('Resending OTP to:', phone);
            try {
                const response = await fetch(`${BACKEND_URL}/api/send-otp`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ phone: phone }),
                });
                const data = await response.json();
                if (data.success) {
                    alert('A new OTP has been sent!');
                } else {
                    alert('Failed to resend OTP: ' + (data.message || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error resending OTP:', error);
                alert('An error occurred while attempting to resend OTP.');
            }
        } else {
            alert('Please go back and enter your mobile number first to resend OTP.');
            // Optionally, redirect to the registration form
            registrationForm.classList.add('active-form');
            registrationForm.classList.remove('hidden-form');
            otpForm.classList.add('hidden-form');
        }
    });
});