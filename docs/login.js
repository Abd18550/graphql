// Handle form submission
const token = localStorage.getItem("jwtToken");
if (token !== null) {
  window.location.href = 'profile.html';
}else{
document.getElementById("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault(); // Prevent page reload

  // Get user inputs
  const usernameOrEmail = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  // Encode credentials to Base64
  const credentials = btoa(`${usernameOrEmail}:${password}`);

  try {
    // Send POST request to the signin endpoint
    const response = await fetch('https://adam-jerusalem.nd.edu/api/auth/signin', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      // Extract JWT from response
      const data = await response.json();
      // Store JWT in localStorage
      localStorage.setItem('jwtToken', data);
      

      // Redirect user to profile page
      window.location.href = 'profile.html';
    } else {
      // Handle invalid credentials
      document.getElementById("errorMessage").textContent = "Invalid credentials. Please try again.";
      document.getElementById("errorMessage").style.display = "block";
    }
  } catch (error) {
    console.error("Error during login:", error);
    alert("Something went wrong. Please try again later.");
  }
});
}