// Fetch user data (userId and username)
const fetchUserData = async () => {
    const token = localStorage.getItem("jwtToken");
  
    if (!token) {
      document.body.innerHTML = `
        <div class="notlogin">
          <h1 class="welcome">Welcome to Adam Users Graph</h1>
          <p class="teeext">You must log in to see your profile</p>
          <a href="index.html" class="blogin">Log in</a>
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
        }
      }
    `;
  
    try {
      const userResponse = await fetch("https://adam-jerusalem.nd.edu/api/graphql-engine/v1/graphql", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: userQuery }),
      });
  
      const userData = await userResponse.json();
  
      if (userData && userData.data && userData.data.user && userData.data.user.length > 0) {
        const user = userData.data.user[0];
        console.log("User Data:", user);
  
        // Fetch audit data once we have the user ID
        fetchAudits(user.id, token);
        fetchAuditRatio(user.id, token);
      } else {
        alert("Failed to fetch user data.");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      alert("An error occurred while fetching user data.");
    }
  };
  
  // Fetch audit data for a specific user
  const fetchAudits = async (userId, token) => {
    // Query to fetch audit data with captain and project info
    const auditQuery = `
      query ($userId: Int!) {
        audit(
          where: { auditorId: { _eq: $userId } }
          order_by: { createdAt: asc }
        ) {
          id
          groupId
          grade
          resultId
          group {
            captainId
            captain {
              login
            }
            object {
              name
            }
          }
        }
      }
    `;
  
    try {
      const response = await fetch("https://adam-jerusalem.nd.edu/api/graphql-engine/v1/graphql", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: auditQuery,
          variables: { userId: userId },
        }),
      });
  
      const data = await response.json();
      console.log("Audit Data:", data);
  
      if (data?.data?.audit) {
        const audits = data.data.audit;
  
        // Get the audits list container
        const auditsList = document.getElementById("AuditsList");
  
        // Clear the container
        auditsList.innerHTML = "";
  
        // Display each audit as a div
        audits.forEach((audit) => {
            if (audit.grade !== null) {
          const projectName = audit.group?.object?.name || "Unknown Project";
          const captainName = audit.group?.captain?.login || "Unknown Captain";
          const result = audit.grade >= 1 ? "Succeeded" : "Failed";
  
          // Create a div for each audit
          const auditDiv = document.createElement("div");
          auditDiv.classList.add("audit-card");
  
          // Add content to the div
          auditDiv.innerHTML = `
            <p><strong>Project:</strong> ${projectName}</p>
            <p><strong>Captain:</strong> ${captainName}</p>
            <p><strong>Result:</strong> ${result}</p>
          `;
  
          // Append the audit div to the container
          auditsList.appendChild(auditDiv);
            }
        });
      } else {
        console.warn("No audit data found for the user.");
      }
    } catch (error) {
      console.error("Error fetching audit data:", error);
      alert("An error occurred while fetching audit data.");
    }
  };

  const fetchAuditRatio = async (userId, token) => {
    const auditQuery = `
      query ($userId: Int!) {
        audit(
          where: { auditorId: { _eq: $userId } }
        ) {
          grade
        }
      }
    `;
  
    try {
      const response = await fetch("https://adam-jerusalem.nd.edu/api/graphql-engine/v1/graphql", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: auditQuery,
          variables: { userId: userId },
        }),
      });
  
      const auditData = await response.json();
  
      if (auditData?.data?.audit) {
        const audits = auditData.data.audit;
  
        // Calculate success and failure counts
        const successCount = audits.filter((audit) => audit.grade > 0).length;
        const failureCount = audits.filter((audit) => audit.grade === null).length;
        // Prepare data for graph
        const auditRatioData = [
          { label: "Success", value: successCount },
          { label: "Failure", value: failureCount },
        ];
        const allcount = successCount + failureCount;
        // Render the graph
        renderAuditGraph(auditRatioData, allcount);
      } else {
        console.warn("No audit data available.");
      }
    } catch (error) {
      console.error("Error fetching audit data:", error);
    }
  };
  
  // Render Audit Ratio Graph (Bar Chart)
  const renderAuditGraph = (data, allcount) => {
    const svg = document.getElementById("auditGraph");
    const width = svg.clientWidth;
    const height = svg.clientHeight;
    const padding = 40;
  
    // Clear previous graph content
    svg.innerHTML = "";
  
    const maxValue = Math.max(...data.map((d) => d.value));
    const barWidth = (width - padding * 2) / data.length;
  
    // Create bars for the graph
    data.forEach((item, index) => {
      const barHeight = (item.value / maxValue) * (height - padding * 2);
      const x = padding + index * barWidth;
      const y = height - padding - barHeight;
  
      // Bar
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", x);
      rect.setAttribute("y", y);
      rect.setAttribute("width", barWidth - 10); // Add spacing between bars
      rect.setAttribute("height", barHeight);
      rect.setAttribute("fill", item.label === "Success" ? "#4CAF50" : "#F44336"); // Green for success, red for failure
      svg.appendChild(rect);
  
      // Label
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", x + (barWidth - 10) / 2);
      text.setAttribute("y", height - padding + 20);
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("fill", "#fff");
      text.setAttribute("font-size", "12px");
      if (item.label === "Success"){
        text.textContent = "You did " + item.value + " audits" ;
      }else{
        text.textContent = "You missed " + item.value + " audits";
      }
      svg.appendChild(text);
  
      // Value
      const valueText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      valueText.setAttribute("x", x + (barWidth - 10) / 2);
      valueText.setAttribute("y", y - 5);
      valueText.setAttribute("text-anchor", "middle");
      valueText.setAttribute("fill", "#fff");
      valueText.setAttribute("font-size", "12px");
      valueText.textContent = Math.round((item.value / allcount) * 100) + "%";
      svg.appendChild(valueText);
    });
  };

  document.getElementById("logoutButton").addEventListener("click", () => {
    localStorage.removeItem("jwtToken");
    window.location.href = "index.html";
  });
  
  // Fetch user data on page load
  fetchUserData();
  

  