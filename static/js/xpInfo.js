// Fetch user data (userId and username)
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
  
        // Fetch XP data once we have the user ID
        fetchUserXP(user.id, token);
      } else {
        alert("Failed to fetch user data.");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      alert("An error occurred while fetching user data.");
    }
  };
  
  // Fetch XP data for a specific user
  // Fetch XP data for a specific user
  const fetchUserXP = async (userId, token) => {
    // Query to fetch XP data
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
          id
          type
          amount
          objectId
          userId
          createdAt
          path
        }
      }
    `;
  
    try {
      const xpResponse = await fetch("https://adam-jerusalem.nd.edu/api/graphql-engine/v1/graphql", {
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
  
      const xpData = await xpResponse.json();
  
      // Ensure the elements exist
      const transactionsElement = document.getElementById("transactions");
      const xpAmountElement = document.getElementById("xpAmount");
      const transactionsHistoryElement = document.getElementById("TransactionsHistory");
  
      if (xpData && xpData.data && xpData.data.transaction) {
        let transactions = xpData.data.transaction;
  
        // Sort transactions by date (newest to oldest)
        transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
        // Display the total number of transactions
        if (transactionsElement) {
          transactionsElement.textContent = transactions.length;
        }
  
        // Calculate total XP
        const totalXp = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  
        // Display total XP
        if (xpAmountElement) {
          if (totalXp >= 1000000) {
            const truncatedValue = Math.floor((totalXp / 1000000) * 100) / 100;
            xpAmountElement.textContent = `${truncatedValue} MB`;
          } else {
            xpAmountElement.textContent = `${Math.floor(totalXp / 1000)} KB`;
          }
        }
  
        // Display each transaction
        if (transactionsHistoryElement) {
          transactionsHistoryElement.innerHTML = ""; // Clear previous content
  
          transactions.forEach((transaction) => {
            // Extract and transform the path
            const rawPath = transaction.path;
            const extractedPart = rawPath.split("/module/")[1];
            const transformedPath = extractedPart ? extractedPart.replace(/\//g, "-") : "N/A";
          
            // Create a new div for each transaction
            const transactionDiv = document.createElement("div");
            transactionDiv.classList.add("transaction");
            let amount = 0;
            let unit = "B";
            if (transaction.amount < 1000) {
                amount = transaction.amount;
              } else {
                amount = Math.round(transaction.amount / 1000);
                unit = "KB";
              }
            // Add transaction details
            transactionDiv.innerHTML = `
              <p><strong>Path:</strong> ${transformedPath}</p>
              <p><strong>Amount:</strong> ${amount} ${unit}</p>
              <p><strong>Created At:</strong> ${new Date(transaction.createdAt).toLocaleString()}</p>
            `;
          
            // Append the transaction div to the history container
            transactionsHistoryElement.appendChild(transactionDiv);
          });
          
        }
      } else {
        if (xpAmountElement) {
          xpAmountElement.textContent = "No XP data available";
        }
        if (transactionsElement) {
          transactionsElement.textContent = "0";
        }
      }
    } catch (error) {
      console.error("Error fetching XP data:", error);
      alert("An error occurred while fetching XP data.");
    }
  };
  
  
  
  
  
  // Handle logout
  document.getElementById("logoutButton").addEventListener("click", () => {
    localStorage.removeItem("jwtToken");
    window.location.href = "../../templetes/login.html";
  });
  
  // Fetch user data on page load
  fetchUserData();
  