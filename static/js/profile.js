document.getElementById("logoutButton").addEventListener("click", () => {
  localStorage.removeItem("jwtToken");
  window.location.href = "../../templetes/login.html";
});
// Fetch user data (userId and username ....)
const fetchUserData = async () => {
    const token = localStorage.getItem("jwtToken");
  
    if (!token) {
      document.body.innerHTML = `
        <div class="notlogin">
          <h1 class="welcome">Welcome to Adam Users Graph</h1>
          <p class="teeext">You must log in to see your profile</p>
          <a href="../../templetes/login.html" class="blogin">Log in</a>
        </div>
      `;
      return;
    }
  
    // Query to fetch user ID and username ....
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
  
      if (userData && userData.data && userData.data.user && userData.data.user.length > 0) {
        const user = userData.data.user[0];
        console.log(user.attrs)
        console.log(user.profile)
        // document.getElementById("userId").textContent = user.id;
        document.getElementById("username").textContent = user.login;
  
        // Fetch XP data once we have the user ID
        fetchUserXP(user.id, token);
        fetchAuditRatio(user.id, token);
      } else {
        alert("Failed to fetch user data.");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      alert("An error occurred while fetching user data.");
    }
  };
  
  fetchUserData();
  
  
  // Fetch XP data for a specific user and render graph
  const fetchUserXP = async (userId, token) => {
    const xpQuery = `
      query ($userId: Int!) {
        transaction(
          where: {
            _and: [
              { userId: { _eq: $userId } },
              { type: { _eq: "xp" } },
              { _not: { path: { _like: "%piscine-go%" } } },
              { _not: { path: { _like: "%piscine-js/%" } } }
              ]
              }
              ) {
          amount
          createdAt
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
          query: xpQuery,
          variables: { userId: userId },
        }),
      });
  
      const xpData = await response.json();
      if (xpData && xpData.data && xpData.data.transaction) {
        const userXp = xpData.data.transaction;
        const totalXp = userXp.reduce((sum, xp) => sum + xp.amount, 0);
        if (totalXp >= 1000000) {
            const truncatedValue = Math.floor((totalXp / 1000000) * 100) / 100;
            document.getElementById("xpAmount").textContent = `${truncatedValue} MB`;
        }else{
          document.getElementById("xpAmount").textContent = `${Math.round(totalXp / 1000)} KB`;

        }

      } else {
        document.getElementById("xpAmount").textContent = "No XP data available";
      }
      if (xpData?.data?.transaction) {
        const transactions = xpData.data.transaction;
  
        // Sort data by date
        const sortedData = transactions.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
  
        // Calculate cumulative XP over time
        let cumulativeXP = 0;
        const graphData = sortedData.map((transaction) => {
          cumulativeXP += transaction.amount;
          return {
            date: new Date(transaction.createdAt).toLocaleDateString(),
            xp: cumulativeXP,
          };
        });
        graphData.unshift({ date: "10/1/2023", xp: 0 });
        console.log(graphData)
        renderXPGraph(graphData);

        const xpSlider = document.getElementById("xpRange");
        const xpValueDisplay = document.getElementById("xpRangeValue");
        
        xpSlider.addEventListener("input", () => {
          const selectedXP = parseInt(xpSlider.value);
          xpValueDisplay.textContent = selectedXP; // Update display value
          renderXPGraph(graphData, selectedXP);
        });
      } else {
        console.warn("No XP data available.");
      }
    } catch (error) {
      console.error("Error fetching XP data:", error);
    }
  };
  
  const renderXPGraph = (data, min = 5000) => {
    const svg = document.getElementById("xpGraph");
    const width = svg.clientWidth;
    const height = svg.clientHeight;
    const padding = 60; // Increased padding for axis labels

    // Clear previous graph content
    svg.innerHTML = "";

    // Ensure the first data point is {date: '10/1/2023', xp: 0}
    if (data.length > 0 && data[0].date !== '10/1/2023') {
        data.unshift({ date: '10/1/2023', xp: 0 }); // Insert at the beginning
    }

    // Convert dates to Date objects for accurate scaling
    data.forEach(d => d.date = new Date(d.date));

    // Get min/max dates for scaling
    const minDate = new Date("2023-10-01");
    const maxDate = data[data.length - 1].date;

    // Scaling functions
    const maxXP = Math.max(...data.map((d) => d.xp));
    const minXP = 0; // Always start XP from 0

    const xScale = (date) =>
        padding + ((date - minDate) / (maxDate - minDate)) * (width - padding * 2);
    
    const yScale = (xp) =>
        height - padding - ((xp - minXP) * (height - padding * 2)) / (maxXP - minXP);

    // Create a linear gradient for the fill area
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const gradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
    gradient.setAttribute("id", "xpGradient");
    gradient.setAttribute("x1", "0%");
    gradient.setAttribute("y1", "100%");
    gradient.setAttribute("x2", "0%");
    gradient.setAttribute("y2", "0%");

    // Gradient colors
    const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop1.setAttribute("offset", "0%");
    stop1.setAttribute("stop-color", "#3498db"); // Blue (bottom)

    const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop2.setAttribute("offset", "100%");
    stop2.setAttribute("stop-color", "#ff0000"); // Red (top)

    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    defs.appendChild(gradient);
    svg.appendChild(defs);

    // Create tooltip
    const tooltip = document.createElement("div");
    tooltip.style.position = "absolute";
    tooltip.style.background = "#333";
    tooltip.style.color = "#fff";
    tooltip.style.padding = "5px 10px";
    tooltip.style.borderRadius = "5px";
    tooltip.style.fontSize = "12px";
    tooltip.style.display = "none";
    tooltip.style.pointerEvents = "none";
    document.body.appendChild(tooltip);

    // Draw Axes
    const xAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    xAxis.setAttribute("x1", padding);
    xAxis.setAttribute("y1", height - padding);
    xAxis.setAttribute("x2", width - padding);
    xAxis.setAttribute("y2", height - padding);
    xAxis.setAttribute("stroke", "#fff");
    xAxis.setAttribute("stroke-width", "1");
    svg.appendChild(xAxis);

    const yAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    yAxis.setAttribute("x1", padding);
    yAxis.setAttribute("y1", padding);
    yAxis.setAttribute("x2", padding);
    yAxis.setAttribute("y2", height - padding);
    yAxis.setAttribute("stroke", "#fff");
    yAxis.setAttribute("stroke-width", "1");
    svg.appendChild(yAxis);

    // Add Date Labels (X-Axis)
    const totalMonths = (maxDate.getFullYear() - minDate.getFullYear()) * 12 + 
                        (maxDate.getMonth() - minDate.getMonth());

    const monthStep = Math.max(1, Math.floor(totalMonths / 5)); // Avoid 0 step

    for (let i = 0; i <= 5; i++) {
        const labelDate = new Date(minDate);
        labelDate.setMonth(minDate.getMonth() + i * monthStep);

        const month = labelDate.getMonth() + 1;
        const year = labelDate.getFullYear().toString().slice(-2);

        const x = xScale(labelDate);

        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", x);
        text.setAttribute("y", height - padding + 20);
        text.setAttribute("fill", "#fff");
        text.setAttribute("font-size", "12px");
        text.setAttribute("text-anchor", "middle");
        text.textContent = `${month}/${year}`;
        svg.appendChild(text);
    }

    // Add XP Labels (Y-Axis)
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
        const xpValue = Math.round(minXP + ((maxXP - minXP) * (i / ySteps)));
        const y = yScale(xpValue);
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", padding - 10);
        text.setAttribute("y", y + 5);
        text.setAttribute("fill", "#fff");
        text.setAttribute("font-size", "12px");
        text.setAttribute("text-anchor", "end");
        text.textContent = xpValue;
        svg.appendChild(text);
    }

    // Draw Data Points and Lines
    let lastxp = 0;
    let pathData = `M ${xScale(minDate)},${yScale(0)} `;

    data.forEach((point, index) => {
        const x = xScale(point.date);
        const y = yScale(point.xp);

        pathData += `${x},${y} `;

        // Draw point if XP increase is more than the min threshold
        if (point.xp - lastxp >= min || index === 0) { // Ensure first point is included
            const xpDifference = point.xp - lastxp;
            lastxp = point.xp;

            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("cx", x);
            circle.setAttribute("cy", y);
            circle.setAttribute("r", 5);
            circle.setAttribute("fill", "#fff");
            circle.setAttribute("stroke", "#3498db");
            circle.setAttribute("stroke-width", "2");

            circle.addEventListener("mouseover", (e) => {
                tooltip.style.display = "block";
                tooltip.textContent = `Date: ${point.date.toLocaleDateString()}, XP: ${xpDifference}`;
            });

            circle.addEventListener("mousemove", (e) => {
                tooltip.style.left = e.pageX + 10 + "px";
                tooltip.style.top = e.pageY - 20 + "px";
            });

            circle.addEventListener("mouseout", () => {
                tooltip.style.display = "none";
            });

            svg.appendChild(circle);
        } else {
            lastxp = point.xp;
        }
    });

    // Create filled area with gradient
    const fillPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    fillPath.setAttribute("d", pathData.trim());
    fillPath.setAttribute("fill", "url(#xpGradient)");
    fillPath.setAttribute("opacity", "0.5");
    svg.appendChild(fillPath);

    // Draw the line path
    const linePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    linePath.setAttribute("d", pathData.trim());
    linePath.setAttribute("fill", "none");
    linePath.setAttribute("stroke", "#fff");
    linePath.setAttribute("stroke-width", "3");
    svg.appendChild(linePath);
};






  
  // Fetch Audit Data and Render Graph
const fetchAuditRatio = async (userId, token) => {
  const auditQuery = `
    query ($userId: Int!) {
      user(
        where: { id: { _eq: $userId } }
      ) {
        auditRatio
        totalUp
        totalDown
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

    const userData = await response.json();
    const user = userData.data.user[0];
    console.log(user);
    const data = [
      { label: "done", value: (user.totalUp) },
          { label: "received", value: (user.totalDown)  },
    ];
    const total = (user.totalUp + user.totalDown);
    console.log(data);
    console.log(total);
    renderAuditGraph(data, total, user.auditRatio)
  } catch (error) {
    console.error("Error fetching audit data:", error);
  }
};

// Render Audit Ratio Graph (Bar Chart)
const renderAuditGraph = (data, allcount, ratio) => {
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
    rect.setAttribute("fill", item.label === "done" ? "#4CAF50" : "#F44336"); // Green for success, red for failure
    svg.appendChild(rect);

    // Label
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", x + (barWidth - 10) / 2);
    text.setAttribute("y", height - padding + 20);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("fill", "#fff");
    text.setAttribute("font-size", "12px");
    if (item.label === "done"){
      text.textContent = "You did " + (item.value/1000000).toFixed(2) + " MB" ;
    }else{
      text.textContent = "You received " + (item.value/1000000).toFixed(2) + " MB";
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
  const graph = document.getElementById("graph2");
  const aRatio = document.createElement("h3");
  const roundRatio = Math.round(ratio.toFixed(2)*10)/10;
  aRatio.textContent = `Audit Ratio: ${roundRatio}`;
  graph.prepend(aRatio);

};
