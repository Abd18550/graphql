const fetchUserData = async () => {
    const token = localStorage.getItem("jwtToken");
  
    if (!token) {
      document.body.innerHTML = `
        <div class="notlogin">
          <h1 class="welcome">Welcome to Adam Users Graph</h1>
          <p class="teeext">You must log in to see your profile</p>
          <a href="../../docs/login.html" class="blogin">Log in</a>
        </div>
      `;
      return;
    }
  
    // Query to fetch user ID and username
    const userQuery = `
      query {
        user {
          id
          login
          attrs
          profile
        }
      }
    `;
  
    try {
      const userResponse = await fetch("https:///adam-jerusalem.nd.edu/api/graphql-engine/v1/graphql", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: userQuery }),
      });
  
      const userData = await userResponse.json();
      console.log(userData)
  
      if (userData && userData.data && userData.data.user && userData.data.user.length > 0) {
        const user = userData.data.user[0];
        document.getElementById("userId").textContent = user.id;
        document.getElementById("username").textContent = user.login;
        document.getElementById("first-name").textContent = user.attrs.firstName;
        document.getElementById("last-name").textContent = user.attrs.lastName;
        document.getElementById("gender").textContent = user.attrs.gender;
        document.getElementById("birthday").textContent = user.attrs.dateOfBirth.split("T")[0];
  
        // Fetch XP data once we have the user ID
      } else {
        alert("Failed to fetch user data.");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      alert("An error occurred while fetching user data.");
    }
  };


  document.getElementById("logoutButton").addEventListener("click", () => {
    localStorage.removeItem("jwtToken");
    window.location.href = "../../docs/login.html";
  });
  
  fetchUserData();